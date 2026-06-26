import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import bot from './config/bot.js';
import User from './models/User.js';
import PendingSession from './models/PendingSession.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import { startScheduler } from './services/scheduler.js';
import { closeBrowser } from './scrapers/_browser.js';

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '';

const app = express();
app.use(cors({ origin: FRONTEND_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ name: 'FirstApply API', status: 'running' });
});

// ---------------------------------------------------------------------------
// Telegram bot commands
// ---------------------------------------------------------------------------
function registerBotCommands() {
  // /start [token]
  // With a deep-link token: complete the website session (auto-register).
  // Without one: generic welcome.
  bot.onText(/^\/start(?:\s+(\S+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match && match[1];

    if (token) {
      try {
        const session = await PendingSession.findOne({ token, status: 'pending' });
        if (session) {
          const username = msg.from?.username || msg.chat?.username || session.telegramUsername || '';
          await User.findOneAndUpdate(
            { telegramChatId: chatId.toString() },
            {
              $set: {
                telegramChatId: chatId.toString(),
                telegramUsername: username,
                filters: session.filters,
                isActive: true,
              },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          session.status = 'completed';
          session.chatId = chatId.toString();
          await session.save();

          const f = session.filters || {};
          await bot.sendMessage(
            chatId,
            `🎉 *You're all set!*\n\nFirstApply will now DM you matching fresher jobs.\n\n` +
              `*Roles:* ${(f.roles || []).join(', ') || 'any'}\n` +
              `*Locations:* ${(f.locations || []).join(', ') || 'any'}\n` +
              `*Experience:* ${(f.experience || []).join(', ') || 'any'}\n\n` +
              `Send /status to review or /stop to pause anytime.`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        // Token not found/expired → fall through to a helpful message.
        await bot.sendMessage(
          chatId,
          `That setup link has expired. Please head back to ${FRONTEND_URL || 'our website'} and try again.`
        );
        return;
      } catch (e) {
        console.error('/start token error:', e.message);
        // fall through to generic welcome
      }
    }

    await bot.sendMessage(
      chatId,
      `Welcome to *FirstApply*! 🚀\n\nGo to ${FRONTEND_URL || 'our website'} to set up your job alerts in one tap.`,
      { parse_mode: 'Markdown' }
    );
  });

  // /stop — pause alerts
  bot.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await User.findOneAndUpdate(
        { telegramChatId: chatId.toString() },
        { $set: { isActive: false } }
      );
    } catch (e) {
      console.error('/stop error:', e.message);
    }
    await bot.sendMessage(chatId, 'Alerts paused. Send /start to resume.');
  });

  // /status — show current filters
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });
      if (!user) {
        await bot.sendMessage(
          chatId,
          `You're not registered yet. Visit ${FRONTEND_URL || 'our website'} to set up alerts.`
        );
        return;
      }
      const f = user.filters || {};
      await bot.sendMessage(
        chatId,
        `📋 *Your FirstApply settings*\n\n` +
          `Status: ${user.isActive ? '🟢 Active' : '🔴 Paused'}\n` +
          `*Roles:* ${(f.roles || []).join(', ') || 'any'}\n` +
          `*Locations:* ${(f.locations || []).join(', ') || 'any'}\n` +
          `*Experience:* ${(f.experience || []).join(', ') || 'any'}`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('/status error:', e.message);
    }
  });

  // /help — command list
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `*FirstApply commands*\n\n` +
        `/start – get started\n` +
        `/status – view your current filters\n` +
        `/stop – pause alerts\n` +
        `/help – show this message\n\n` +
        `Set up or edit alerts at ${FRONTEND_URL || 'our website'}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);

    if (process.env.TELEGRAM_BOT_TOKEN) {
      // Cache the bot's @username so /api/auth/start-token can build deep links.
      try {
        const me = await bot.getMe();
        app.locals.botUsername = me.username;
        console.log(`🤖 Bot identified as @${me.username}`);
      } catch (e) {
        console.warn('Could not fetch bot username:', e.message);
      }

      registerBotCommands();
      // Start a single long-poll loop for command handling. The notifier sends
      // outbound messages on the same bot instance (no polling needed there).
      await bot.startPolling({ restart: true });
      console.log('🤖 Telegram bot polling for commands');
    } else {
      console.warn('⚠️  No TELEGRAM_BOT_TOKEN — bot commands disabled');
    }

    startScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 FirstApply backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Clean up the shared Chromium instance on shutdown (Render restarts, Ctrl+C).
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down…`);
  await closeBrowser();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
