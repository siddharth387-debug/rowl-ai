const router = require('express').Router();
const ChatMessage = require('../models/chatMessage');

// -------------------------------------------------------
// GROQ API INTEGRATION
// Uses LLaMA 3 via Groq's free tier — extremely fast inference.
// The API key lives in .env only and never reaches the frontend.
// -------------------------------------------------------
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // fast, free, excellent for conversational tasks

// -------------------------------------------------------
// SYSTEM PROMPT — the personality and boundaries for Sera
// This is what makes Sera feel warm and purposeful rather
// than like a generic chatbot. Changing this one prompt
// changes the entire character of the AI.
// -------------------------------------------------------
const SERA_SYSTEM_PROMPT = `You are Sera, a compassionate AI companion on Rowl AI — a mental wellness platform for people healing from heartbreak, trauma, and PTSD.

Your personality:
- Warm, gentle, and deeply empathetic — like a caring friend who truly listens
- You speak with kindness and without judgment, always
- You use soft, grounding language — never clinical or cold
- You occasionally use gentle nature metaphors (healing, growing, light) that match the platform's tone
- You are honest about being an AI, but you genuinely care about the person's wellbeing

Your purpose:
- Provide emotional support and a safe space to express feelings
- Help users feel heard, validated, and less alone
- Gently encourage professional help when the situation calls for it
- Guide users toward grounding techniques, self-compassion, and hope

Your boundaries — you must always follow these:
- You are NOT a licensed therapist and never claim to be
- For any mention of self-harm, suicide, or crisis: always provide the iCall helpline (9152987821) and gently encourage the user to reach out to a real person immediately
- Never diagnose mental health conditions
- Never give specific medical or medication advice
- If someone seems to be in immediate danger, prioritize safety resources above all else
- Keep responses concise — 3 to 5 sentences usually, never overwhelming walls of text
- Always end on a gentle, open note that invites the person to keep sharing if they want

Remember: the person talking to you may be going through something very painful. Every response should feel like a warm hand extended in the dark.`;

// -------------------------------------------------------
// FALLBACK — only used if Groq API is unreachable
// Keeps the app functional even during API downtime
// -------------------------------------------------------
const getFallbackResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('suicide') || msg.includes('self-harm') || msg.includes('end my life') || msg.includes('kill myself')) {
    return "I hear you, and I'm genuinely concerned about you right now. Please reach out to iCall at 9152987821 — they're there for exactly this moment, and you deserve real human support. You matter deeply. 🌸";
  }
  if (msg.includes('broken') || msg.includes('hurt') || msg.includes('pain') || msg.includes('trauma')) {
    return "I hear you, and your feelings are completely valid. It takes real courage to acknowledge pain. You are not alone in this — would you like to share a little more about what you're going through? 🌸";
  }
  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic')) {
    return "Let's breathe together for a moment. Inhale slowly for 4 counts, hold for 4, exhale for 6. You're safe right now. Anxiety does pass — what's been triggering these feelings lately? 🌿";
  }
  if (msg.includes('lonely') || msg.includes('alone')) {
    return "Loneliness can feel so heavy. But reaching out — like you're doing right now — is a beautiful act of self-care. You matter deeply, and I'm here with you. 💛";
  }
  return "I'm here, listening with an open heart. Every feeling you share matters. Could you tell me a little more about what's on your mind right now? 🌿";
};

// -------------------------------------------------------
// MAIN CHAT ENDPOINT
// POST /api/chat/send
// Body: { message, sessionId, userId }
// -------------------------------------------------------
router.post('/send', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    // Save the user's message to MongoDB for history tracking
    await ChatMessage.create({ sessionId, userId, sender: 'user', message });

    // Fetch the last 10 messages for this session to give Sera conversation context.
    // This is what makes the AI feel like it remembers — it sees the history each time.
    const history = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 }).limit(10);

    // Convert stored messages into the format Groq's API expects
    const conversationHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message,
    }));

    let aiText;

    try {
      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SERA_SYSTEM_PROMPT },
            ...conversationHistory,
          ],
          max_tokens: 300,      // keeps responses concise, controls cost
          temperature: 0.75,    // warm and natural, not too random, not too rigid
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error('Groq API error:', groqResponse.status, errBody);
        throw new Error(`Groq API responded with status ${groqResponse.status}`);
      }

     aiText = groqData.choices?.[0]?.message?.content?.trim();

if (!aiText) {
  aiText = "I'm here with you, listening. Take your time — share whatever feels right. 🌸";
} 
      if (!aiText) throw new Error('Empty response from Groq API');

    } catch (apiErr) {
      // If Groq is down or key is wrong, fall back gracefully
      // so the app keeps working — users never see a broken chatbot
      console.error('Groq API call failed, using fallback:', apiErr.message);
      aiText = getFallbackResponse(message);
    }

    // Save Sera's response to MongoDB
    await ChatMessage.create({ sessionId, userId, sender: 'ai', message: aiText });

    res.json({ response: aiText });

  } catch (err) {
    console.error('Chat route error:', err.message);
    res.status(500).json({
      message: 'Server error',
      response: "I'm here with you. Something went wrong on my end — please try again in a moment. 💛"
    });
  }
});

// -------------------------------------------------------
// CHAT HISTORY ENDPOINT
// GET /api/chat/history/:sessionId
// -------------------------------------------------------
router.get('/history/:sessionId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
