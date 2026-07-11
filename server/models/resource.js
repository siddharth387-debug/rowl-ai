const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String },
  content: { type: String },
  category: { type: String, enum: ['trauma', 'ptsd', 'grief', 'anxiety', 'relationships', 'self-care', 'mindfulness'], required: true },
  type: { type: String, enum: ['article', 'exercise', 'audio', 'video'], default: 'article' },
  readTime: { type: Number },
  author: { type: String },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', ResourceSchema);
