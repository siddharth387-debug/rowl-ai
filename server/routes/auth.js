const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const {
  isDbConnected,
  memoryUsers,
  findMemoryUserByEmail,
} = require('../utils/memoryStore');
const { sendPasswordResetOtpEmail } = require('../services/sosAlertService');

const JWT_SECRET = process.env.JWT_SECRET || 'rowl_ai_secret_2024';

const hashOtp = (otp) =>
  crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, emergencyContact } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const safeRole = role === 'doctor' ? 'doctor' : 'patient';
    const hashedPassword = await bcrypt.hash(password, 12);

    if (isDbConnected()) {
      let user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
      if (user) return res.status(400).json({ message: 'User already exists' });

      user = new User({
        name,
        email: email.trim(),
        password: hashedPassword,
        role: safeRole,
        phone: phone || '',
        emergencyContact: emergencyContact || undefined,
      });
      await user.save();

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          emergencyContact: user.emergencyContact,
        },
      });
    }

    // Fallback when MongoDB connection is unavailable on Render
    if (findMemoryUserByEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: name || 'Rowl Healer',
      email: email.trim(),
      password: hashedPassword,
      role: safeRole,
      healingStage: 'beginning',
      phone: phone || '',
      emergencyContact: emergencyContact || { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    };
    memoryUsers.set(normalizedEmail, newUser);

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        emergencyContact: newUser.emergencyContact,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    }
    if (!user) {
      user = findMemoryUserByEmail(normalizedEmail);
    }
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        healingStage: user.healingStage,
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || {},
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Step 1: Request 6-Digit Password Reset OTP via Gmail
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Please enter your registered email address' });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    }
    if (!user) {
      user = findMemoryUserByEmail(normalizedEmail);
    }
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email address' });
    }

    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = hashOtp(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (isDbConnected() && typeof user.save === 'function') {
      user.resetOtpHash = otpHash;
      user.resetOtpExpires = otpExpires;
      await user.save();
    } else {
      const memUser = findMemoryUserByEmail(normalizedEmail) || user;
      memUser.resetOtpHash = otpHash;
      memUser.resetOtpExpires = otpExpires;
      memoryUsers.set(normalizedEmail, memUser);
    }

    const { emailSent, emailPreviewUrl } = await sendPasswordResetOtpEmail(user, otp);

    res.json({
      message: 'A 6-digit verification OTP has been sent to your email!',
      emailSent,
      emailPreviewUrl: emailPreviewUrl || null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Step 2: Verify 6-Digit OTP and Update Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, 6-digit OTP, and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const incomingHash = hashOtp(otp);
    const now = new Date();

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    }
    if (!user) {
      user = findMemoryUserByEmail(normalizedEmail);
    }

    if (
      !user ||
      !user.resetOtpHash ||
      user.resetOtpHash !== incomingHash ||
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires) < now
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (isDbConnected() && typeof user.save === 'function') {
      user.password = hashedPassword;
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
    } else {
      user.password = hashedPassword;
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      memoryUsers.set(normalizedEmail, user);
    }

    res.json({ message: 'Password reset successful! You can now sign in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
