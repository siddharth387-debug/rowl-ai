const router = require('express').Router();
const mongoose = require('mongoose');
const CommunityPost = require('../models/community');
const auth = require('../middleware/auth');
const { isDbConnected, memoryCommunityPosts } = require('../utils/memoryStore');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    if (isDbConnected()) {
      const query = category ? { category } : {};
      const posts = await CommunityPost.find(query).sort({ createdAt: -1 }).limit(20);
      return res.json(posts);
    }
    const posts = category
      ? memoryCommunityPosts.filter((p) => p.category === category)
      : memoryCommunityPosts;
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, isAnonymous, anonymousName } = req.body;
    if (isDbConnected()) {
      const post = new CommunityPost({ author: req.user.id, title, content, category, isAnonymous, anonymousName: anonymousName || 'Anonymous Healer' });
      await post.save();
      return res.json(post);
    }
    const post = {
      _id: new mongoose.Types.ObjectId().toString(),
      author: req.user.id,
      title,
      content,
      category: category || 'general',
      isAnonymous: Boolean(isAnonymous),
      anonymousName: anonymousName || 'Anonymous Healer',
      hearts: [],
      comments: [],
      createdAt: new Date(),
    };
    memoryCommunityPosts.unshift(post);
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Heart/unheart a post
router.put('/:id/heart', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const post = await CommunityPost.findById(req.params.id);
      const idx = post.hearts.indexOf(req.user.id);
      if (idx === -1) post.hearts.push(req.user.id);
      else post.hearts.splice(idx, 1);
      await post.save();
      return res.json(post);
    }
    const post = memoryCommunityPosts.find((p) => String(p._id) === String(req.params.id));
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const idx = post.hearts.indexOf(req.user.id);
    if (idx === -1) post.hearts.push(req.user.id);
    else post.hearts.splice(idx, 1);
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      const post = await CommunityPost.findById(req.params.id);
      post.comments.push({ author: req.user.id, content: req.body.content, isAnonymous: req.body.isAnonymous, anonymousName: req.body.anonymousName || 'Anonymous Healer' });
      await post.save();
      return res.json(post);
    }
    const post = memoryCommunityPosts.find((p) => String(p._id) === String(req.params.id));
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({
      _id: new mongoose.Types.ObjectId().toString(),
      author: req.user.id,
      content: req.body.content,
      isAnonymous: req.body.isAnonymous,
      anonymousName: req.body.anonymousName || 'Anonymous Healer',
      createdAt: new Date(),
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
