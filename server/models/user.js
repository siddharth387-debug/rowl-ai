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
  slots: { type: [String], default: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'] },
  rating: { type: Number, default: 4.8 },
  // For patients
  phone: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    relation: { type: String, default: '' },
  },
  healingStage: { type: String, enum: ['beginning', 'processing', 'growing', 'thriving'], default: 'beginning' },
  ptsdScore: { type: Number, default: 0 },
  aiMemorySummary: { type: String, default: '' },
  shareInsightsWithDoctor: { type: Boolean, default: false },
  journalEntries: [{ content: String, mood: String, date: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
