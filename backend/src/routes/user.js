import express from 'express';

import User from '../models/User.js';
import { sendMessage } from '../services/notifier.js';

const router = express.Router();

// Normalize incoming filter arrays to lowercase, trimmed, de-duped values.
function normalizeFilters(filters = {}) {
  const norm = (arr) =>
    Array.from(
      new Set((Array.isArray(arr) ? arr : []).map((v) => (v || '').toString().trim().toLowerCase()).filter(Boolean))
    );
  return {
    roles: norm(filters.roles),
    locations: norm(filters.locations),
    experience: norm(filters.experience),
  };
}

// POST /api/users/register — upsert a user and send a welcome DM.
router.post('/register', async (req, res) => {
  try {
    const { telegramUsername, chatId, filters } = req.body || {};
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId is required' });
    }

    const cleanFilters = normalizeFilters(filters);

    const user = await User.findOneAndUpdate(
      { telegramChatId: chatId.toString() },
      {
        $set: {
          telegramChatId: chatId.toString(),
          telegramUsername: telegramUsername || '',
          filters: cleanFilters,
          isActive: true,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Best-effort welcome message; don't fail registration if Telegram is down.
    await sendMessage(
      chatId,
      `🎉 *You're all set!*\n\nFresherAlert will now DM you matching fresher jobs.\n\n` +
        `*Roles:* ${cleanFilters.roles.join(', ') || 'any'}\n` +
        `*Locations:* ${cleanFilters.locations.join(', ') || 'any'}\n` +
        `*Experience:* ${cleanFilters.experience.join(', ') || 'any'}\n\n` +
        `Send /status anytime to review, or /stop to pause.`
    );

    return res.json({ success: true, message: 'Registered!', user });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// GET /api/users/:chatId — return a user's filters.
router.get('/:chatId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramChatId: req.params.chatId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, filters: user.filters, isActive: user.isActive });
  } catch (err) {
    console.error('get user error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// PUT /api/users/:chatId — update filters.
router.put('/:chatId', async (req, res) => {
  try {
    const cleanFilters = normalizeFilters(req.body?.filters);
    const user = await User.findOneAndUpdate(
      { telegramChatId: req.params.chatId },
      { $set: { filters: cleanFilters, isActive: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('update user error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// DELETE /api/users/:chatId — soft delete (pause alerts).
router.delete('/:chatId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { telegramChatId: req.params.chatId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Alerts paused' });
  } catch (err) {
    console.error('delete user error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to pause alerts' });
  }
});

export default router;
