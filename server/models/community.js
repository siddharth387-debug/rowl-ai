const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  anonymousName: { type: String, default: 'Anonymous Healer' },
  isAnonymous: { type: Boolean, default: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['story', 'question', 'support', 'milestone'], default: 'story' },
  hearts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    anonymousName: String,
    isAnonymous: { type: Boolean, default: true },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
