const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: { type: String, enum: ['user', 'ai', 'doctor'], required: true },
  message: { type: String, required: true },
  mood: { type: String },
  isCrisis: { type: Boolean, default: false },
  actionCard: {
    type: { type: String, enum: ['exercise', 'appointment', 'community', 'journal'] },
    title: { type: String },
    description: { type: String },
    ctaText: { type: String },
    link: { type: String }
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
