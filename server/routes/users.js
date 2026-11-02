const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const auth = require('../middleware/auth');

const DEFAULT_DOCTORS = [
  {
    name: 'Dr. Priya Menon',
    email: 'priya.menon@rowl.ai',
    role: 'doctor',
    specialization: 'Trauma & PTSD',
    bio: 'Specialist in somatic trauma therapy and EMDR. 12 years supporting survivors of relational trauma.',
    rating: 4.9,
    slots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    avatar: '🌸',
    isVerified: true,
  },
  {
    name: 'Dr. Arun Sharma',
    email: 'arun.sharma@rowl.ai',
    role: 'doctor',
    specialization: 'Grief & Loss',
    bio: 'Compassionate grief counselor helping people find meaning after loss, heartbreak, and major life transitions.',
    rating: 4.8,
    slots: ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
    avatar: '🌿',
    isVerified: true,
  },
  {
    name: 'Dr. Lakshmi Rao',
    email: 'lakshmi.rao@rowl.ai',
    role: 'doctor',
    specialization: 'Anxiety & Relationships',
    bio: 'CBT and attachment-based therapist. Specializes in healing relationship trauma and anxiety disorders.',
    rating: 4.9,
    slots: ['9:30 AM', '12:00 PM', '2:30 PM', '4:30 PM'],
    avatar: '💛',
    isVerified: true,
  },
  {
    name: 'Dr. Meera Pillai',
    email: 'meera.pillai@rowl.ai',
    role: 'doctor',
    specialization: 'Heartbreak & Identity',
    bio: 'Psychologist focused on self-discovery after painful relationships and rebuilding a sense of self.',
    rating: 4.7,
    slots: ['8:30 AM', '11:30 AM', '1:30 PM', '3:30 PM'],
    avatar: '🌺',
    isVerified: true,
  },
];

const ensureDefaultDoctors = async () => {
  const count = await User.countDocuments({ role: 'doctor' });
  if (count > 0) return;

  const defaultPassword = await bcrypt.hash('doctor_rowl_2026', 10);
  await User.insertMany(
    DEFAULT_DOCTORS.map((doc) => ({
      ...doc,
      password: defaultPassword,
    }))
  );
};

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile (supports both patient & doctor fields)
router.put('/me', auth, async (req, res) => {
  try {
    const {
      name,
      bio,
      healingStage,
      phone,
      emergencyContact,
      specialization,
      slots,
      shareInsightsWithDoctor,
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (healingStage !== undefined) updateFields.healingStage = healingStage;
    if (phone !== undefined) updateFields.phone = phone;
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (Array.isArray(slots)) updateFields.slots = slots;
    if (shareInsightsWithDoctor !== undefined) {
      updateFields.shareInsightsWithDoctor = shareInsightsWithDoctor;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true }).select('-password');
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

// Get all doctors (seeds default doctors with valid MongoDB ObjectIds if none exist)
router.get('/doctors', async (req, res) => {
  try {
    await ensureDefaultDoctors();
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
