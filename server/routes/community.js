const router = require('express').Router();
const CommunityPost = require('../models/community');
const auth = require('../middleware/auth');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const posts = await CommunityPost.find(query).sort({ createdAt: -1 }).limit(20);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, isAnonymous, anonymousName } = req.body;
    const post = new CommunityPost({ author: req.user.id, title, content, category, isAnonymous, anonymousName: anonymousName || 'Anonymous Healer' });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Heart/unheart a post
router.put('/:id/heart', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    const idx = post.hearts.indexOf(req.user.id);
    if (idx === -1) post.hearts.push(req.user.id);
    else post.hearts.splice(idx, 1);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    post.comments.push({ author: req.user.id, content: req.body.content, isAnonymous: req.body.isAnonymous, anonymousName: req.body.anonymousName || 'Anonymous Healer' });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
