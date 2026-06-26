import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramChatId: { type: String, required: true, unique: true },
  telegramUsername: { type: String, default: '' },
  filters: {
    roles: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    experience: { type: [String], default: [] },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export default User;
