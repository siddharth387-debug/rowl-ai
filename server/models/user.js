const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  // For doctors
  specialization: { type: String },
  licenseNumber: { type: String },
  isVerified: { type: Boolean, default: false },
  // For patients
  healingStage: { type: String, enum: ['beginning', 'processing', 'growing', 'thriving'], default: 'beginning' },
  ptsdScore: { type: Number, default: 0 },
  journalEntries: [{ content: String, mood: String, date: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
