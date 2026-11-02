const mongoose = require('mongoose');
const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');
const {
  generateSeraReply,
  summarizeEpisodicMemory,
} = require('../services/aiService');
const { dispatchEmergencySOS } = require('../services/sosAlertService');

// In-memory session fallback when MongoDB connection is unavailable
const memorySessions = new Map();

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId, userId, userEmail, userName, userPhone, emergencyContact, mood } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const isDbReady = mongoose.connection.readyState === 1;
    let chronologicalHistory = [];
    let userDoc = null;
    let userContext = {};

    if (isDbReady) {
      await ChatMessage.create({
        sessionId,
        userId: userId || undefined,
        sender: 'user',
        message: message.trim(),
        mood: mood || undefined,
      });

      const recentDocs = await ChatMessage.find({ sessionId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
      chronologicalHistory = recentDocs.reverse();

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        userDoc = await User.findById(userId)
          .select('name email phone emergencyContact healingStage journalEntries aiMemorySummary')
          .lean();
        if (userDoc) {
          userContext = {
            name: userDoc.name,
            healingStage: userDoc.healingStage,
            latestMood: mood || userDoc.journalEntries?.[0]?.mood || '',
            aiMemorySummary: userDoc.aiMemorySummary || '',
          };
        }
      }
    } else {
      const sessionMsgs = memorySessions.get(sessionId) || [];
      sessionMsgs.push({
        sessionId,
        sender: 'user',
        message: message.trim(),
        mood: mood || undefined,
        timestamp: new Date(),
      });
      memorySessions.set(sessionId, sessionMsgs);
      chronologicalHistory = sessionMsgs.slice(-10);
    }

    // Fallback userDoc from client payload if DB is disconnected or userDoc not found
    if (!userDoc && (userEmail || userName || emergencyContact?.email)) {
      userDoc = {
        name: userName || 'Rowl User',
        email: userEmail || '',
        phone: userPhone || '',
        emergencyContact: emergencyContact || {},
      };
      userContext = {
        name: userDoc.name,
        latestMood: mood || '',
      };
    }

    const conversationHistory = chronologicalHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    }));

    const { aiText, isCrisis, actionCard } = await generateSeraReply({
      message: message.trim(),
      conversationHistory,
      userContext,
    });

    let savedAiMsg = {
      sessionId,
      userId: userId || undefined,
      sender: 'ai',
      message: aiText,
      isCrisis,
      actionCard,
      timestamp: new Date(),
    };

    let crisisCount = 0;

    if (isDbReady) {
      savedAiMsg = await ChatMessage.create(savedAiMsg);
      crisisCount = isCrisis
        ? await ChatMessage.countDocuments({ sessionId, isCrisis: true })
        : 0;
    } else {
      const sessionMsgs = memorySessions.get(sessionId) || [];
      sessionMsgs.push(savedAiMsg);
      memorySessions.set(sessionId, sessionMsgs);
      crisisCount = isCrisis
        ? sessionMsgs.filter((m) => m.isCrisis).length
        : 0;
    }

    const crisisEscalated = isCrisis && crisisCount >= 1;

    let sosStatus = null;
    if (crisisEscalated) {
      sosStatus = await dispatchEmergencySOS(userDoc, message.trim());
    }

    if (isDbReady && userDoc && chronologicalHistory.length >= 6 && chronologicalHistory.length % 2 === 0) {
      summarizeEpisodicMemory(userDoc.aiMemorySummary, [...chronologicalHistory, savedAiMsg])
        .then((updatedSummary) => {
          if (updatedSummary && updatedSummary !== userDoc.aiMemorySummary) {
            return User.findByIdAndUpdate(userId, { aiMemorySummary: updatedSummary });
          }
        })
        .catch(() => {});
    }

    res.json({
      response: aiText,
      isCrisis,
      crisisCount,
      crisisEscalated,
      sosStatus,
      actionCard: savedAiMsg.actionCard || null,
      timestamp: savedAiMsg.timestamp,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      response: "I'm here with you. Something went wrong on my end — please try again in a moment. 💛",
    });
  }
};

exports.getSessionHistory = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(memorySessions.get(req.params.sessionId) || []);
    }
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 })
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLatestUserSession = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ sessionId: null, messages: [] });
    }
    const { userId } = req.params;
    const latestMsg = await ChatMessage.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestMsg) {
      return res.json({ sessionId: null, messages: [] });
    }

    const messages = await ChatMessage.find({ sessionId: latestMsg.sessionId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      sessionId: latestMsg.sessionId,
      messages,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
