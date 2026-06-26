import TelegramBot from 'node-telegram-bot-api';

// Single shared bot instance used by both the notifier and the command handlers.
// polling:false — we drive updates explicitly from index.js so a single
// getUpdates loop owns the bot (avoids 409 conflicts on Render restarts).
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set — Telegram features disabled');
}

const bot = new TelegramBot(token || 'missing-token', { polling: false });

export default bot;
