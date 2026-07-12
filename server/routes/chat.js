const router = require('express').Router();
const ChatMessage = require('../models/chatMessage');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

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

router.post('/send', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    await ChatMessage.create({ sessionId, userId, sender: 'user', message });

    const history = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 }).limit(10);

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
          max_tokens: 300,
          temperature: 0.75,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        console.error('Groq API error:', groqResponse.status, errBody);
        throw new Error(`Groq API responded with status ${groqResponse.status}`);
      }

      const groqData = await groqResponse.json();
      aiText = groqData.choices?.[0]?.message?.content?.trim();

      if (!aiText) {
        aiText = "I'm here with you, listening. Take your time — share whatever feels right. 🌸";
      }

    } catch (apiErr) {
      console.error('Groq API call failed, using fallback:', apiErr.message);
      aiText = getFallbackResponse(message);
    }

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