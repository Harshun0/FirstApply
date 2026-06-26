import mongoose from 'mongoose';

// Short-lived link between a website setup session and a Telegram chat.
// Created when the user clicks "Connect Telegram"; completed when the bot
// receives `/start <token>`. Auto-expires after 15 minutes.
const pendingSessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  filters: {
    roles: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    experience: { type: [String], default: [] },
  },
  telegramUsername: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  chatId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// TTL: drop abandoned sessions after 15 minutes (900s).
pendingSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const PendingSession = mongoose.model('PendingSession', pendingSessionSchema);

export default PendingSession;
