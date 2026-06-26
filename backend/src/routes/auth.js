import express from 'express';
import crypto from 'crypto';

import PendingSession from '../models/PendingSession.js';

const router = express.Router();

function normalizeFilters(filters = {}) {
  const norm = (arr) =>
    Array.from(
      new Set(
        (Array.isArray(arr) ? arr : [])
          .map((v) => (v || '').toString().trim().toLowerCase())
          .filter(Boolean)
      )
    );
  return {
    roles: norm(filters.roles),
    locations: norm(filters.locations),
    experience: norm(filters.experience),
  };
}

// POST /api/auth/start-token
// Body: { filters, telegramUsername? }
// Creates a pending session and returns a Telegram deep link the user opens.
router.post('/start-token', async (req, res) => {
  try {
    const { filters, telegramUsername } = req.body || {};

    // URL-safe token (hex) — valid as a Telegram /start payload (<=64 chars).
    const token = crypto.randomBytes(16).toString('hex');

    await PendingSession.create({
      token,
      filters: normalizeFilters(filters),
      telegramUsername: telegramUsername || '',
    });

    const botUsername = req.app.locals.botUsername || process.env.BOT_USERNAME || '';
    const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : '';

    return res.json({ success: true, token, botUsername, deepLink });
  } catch (err) {
    console.error('start-token error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not start session' });
  }
});

// GET /api/auth/poll/:token
// The website polls this until status flips to "completed".
router.get('/poll/:token', async (req, res) => {
  try {
    const session = await PendingSession.findOne({ token: req.params.token });
    // Missing == expired (TTL) or never existed.
    if (!session) {
      return res.status(404).json({ success: false, status: 'expired' });
    }
    return res.json({
      success: true,
      status: session.status,
      chatId: session.status === 'completed' ? session.chatId : undefined,
    });
  } catch (err) {
    console.error('poll error:', err.message);
    return res.status(500).json({ success: false, message: 'Poll failed' });
  }
});

export default router;
