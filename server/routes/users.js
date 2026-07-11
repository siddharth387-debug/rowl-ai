const router = require('express').Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, healingStage } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, bio, healingStage }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add journal entry
router.post('/journal', auth, async (req, res) => {
  try {
    const { content, mood } = req.body;
    const user = await User.findById(req.user.id);
    user.journalEntries.unshift({ content, mood });
    await user.save();
    res.json(user.journalEntries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
