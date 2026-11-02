const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');
const {
  generateSeraReply,
  summarizeEpisodicMemory,
} = require('../services/aiService');
const { dispatchEmergencySOS } = require('../services/sosAlertService');

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId, userId, mood } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    await ChatMessage.create({
      sessionId,
      userId: userId || undefined,
      sender: 'user',
      message: message.trim(),
      mood: mood || undefined,
    });

    // Tier 1 Working Memory: Fetch the MOST RECENT 10 messages (descending), then reverse to chronological order
    const recentDocs = await ChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    const chronologicalHistory = recentDocs.reverse();

    const conversationHistory = chronologicalHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    }));

    // Tier 2 (Profile) & Tier 3 (Episodic Memory) lookup if user is authenticated
    let userDoc = null;
    let userContext = {};
    if (userId) {
      userDoc = await User.findById(userId)
        .select('name phone emergencyContact healingStage journalEntries aiMemorySummary')
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

    const { aiText, isCrisis, actionCard } = await generateSeraReply({
      message: message.trim(),
      conversationHistory,
      userContext,
    });

    const savedAiMsg = await ChatMessage.create({
      sessionId,
      userId: userId || undefined,
      sender: 'ai',
      message: aiText,
      isCrisis,
      actionCard,
    });

    const crisisCount = isCrisis
      ? await ChatMessage.countDocuments({ sessionId, isCrisis: true })
      : 0;
    const crisisEscalated = isCrisis && crisisCount >= 3;

    let sosStatus = null;
    if (crisisEscalated) {
      sosStatus = await dispatchEmergencySOS(userDoc);
    }

    // Asynchronously update Tier 3 Episodic Memory every 6 messages without delaying the HTTP response
    if (userDoc && chronologicalHistory.length >= 6 && chronologicalHistory.length % 2 === 0) {
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
