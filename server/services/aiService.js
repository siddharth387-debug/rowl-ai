const {
  buildSeraSystemPrompt,
  EPISODIC_MEMORY_PROMPT,
  CLINICAL_BRIEF_PROMPT,
} = require('../constants/prompts');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
];

const CRISIS_PATTERNS = [
  'suicide',
  'suicidal',
  'self-harm',
  'self harm',
  'end my life',
  'kill myself',
  'want to die',
  'better off dead',
  'overdose',
  'hurt myself',
];

/**
 * Deterministic safety guardrail — runs in <1ms before any LLM call
 * so crisis detection never depends solely on probabilistic model output.
 */
function detectCrisisIntent(message = '') {
  const normalized = message.toLowerCase();
  return CRISIS_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * Determines whether an interactive in-chat widget (ActionCard) should accompany Sera's reply.
 */
function deriveActionCard(userMessage = '', isCrisis = false) {
  if (isCrisis) return undefined;
  const msg = userMessage.toLowerCase();

  if (
    msg.includes('anxious') ||
    msg.includes('anxiety') ||
    msg.includes('panic') ||
    msg.includes('overwhelmed') ||
    msg.includes('freeze') ||
    msg.includes('flashback') ||
    msg.includes('breathe')
  ) {
    return {
      type: 'exercise',
      title: '5-4-3-2-1 Sensory Grounding',
      description: 'A gentle 5-minute exercise to anchor your nervous system in the present moment.',
      ctaText: 'Start Grounding Exercise 🌿',
      link: '/resources',
    };
  }

  if (
    msg.includes('therapist') ||
    msg.includes('doctor') ||
    msg.includes('counselor') ||
    msg.includes('professional') ||
    msg.includes('therapy') ||
    msg.includes('trauma')
  ) {
    return {
      type: 'appointment',
      title: 'Connect with a Trauma-Informed Therapist',
      description: 'Speak 1-on-1 via video or text with our verified mental wellness specialists.',
      ctaText: 'Explore Therapists 🗓',
      link: '/appointments',
    };
  }

  if (msg.includes('lonely') || msg.includes('alone') || msg.includes('no one understands')) {
    return {
      type: 'community',
      title: 'Community Healing Circle',
      description: 'Read anonymous stories and milestones from others walking a similar healing path.',
      ctaText: 'Visit Community Circle 💛',
      link: '/community',
    };
  }

  if (msg.includes('journal') || msg.includes('write') || msg.includes('track')) {
    return {
      type: 'journal',
      title: 'Mindful Reflections Journal',
      description: 'Capture what is in your heart and track your emotional weather privately.',
      ctaText: 'Open My Journal 📓',
      link: '/healing',
    };
  }

  return undefined;
}

function getFallbackResponse(message = '', userContext = {}) {
  const firstName = userContext.name ? `, ${userContext.name.split(' ')[0]}` : '';
  if (detectCrisisIntent(message)) {
    return `I hear you${firstName}, and I'm genuinely concerned about your safety right now. Please reach out to iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345 — real, caring professionals are waiting to support you through this exact moment. You matter deeply, and you don't have to carry this alone. 🌸`;
  }

  const msg = message.toLowerCase();
  if (msg.includes('broken') || msg.includes('hurt') || msg.includes('pain') || msg.includes('trauma')) {
    return `I hear you${firstName}, and your feelings are completely valid. It takes real courage to acknowledge pain. You are not alone in this — would you like to share a little more about what you're going through? 🌸`;
  }
  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('panic') || msg.includes('overwhelmed')) {
    return `Let's breathe together for a moment${firstName}. Inhale slowly for 4 counts, hold for 4, exhale for 6. You're safe right now. Anxiety does pass — what's been triggering these feelings lately? 🌿`;
  }
  if (msg.includes('lonely') || msg.includes('alone')) {
    return `Loneliness can feel so heavy${firstName}. But reaching out — like you're doing right now — is a beautiful act of self-care. You matter deeply, and I'm here with you. 💛`;
  }
  return `I'm here${firstName}, listening with an open heart. Every feeling you share matters. Could you tell me a little more about what's on your mind right now? 🌿`;
}

/**
 * Calls Groq API with automatic model fallback chain & configurable temperature.
 */
async function callGroqChat(messages, { temperature = 0.7, maxTokens = 1024 } = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  let lastError = null;
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`Groq API error (${response.status}) on ${model}: ${errText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      if (content) return content;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

/**
 * Generates Sera's empathetic response using 3-tier memory:
 * 1. Sliding window history (chronological last N messages)
 * 2. User profile semantic context (name, healingStage, latestMood)
 * 3. Episodic memory summary from past sessions
 */
async function generateSeraReply({ message, conversationHistory, userContext }) {
  const isCrisis = detectCrisisIntent(message);
  const actionCard = deriveActionCard(message, isCrisis);
  const systemPrompt = buildSeraSystemPrompt(userContext);

  let aiText;
  try {
    aiText = await callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
      { temperature: isCrisis ? 0.3 : 0.75, maxTokens: 1024 }
    );

    if (!aiText) {
      aiText = getFallbackResponse(message, userContext);
    }
  } catch (err) {
    aiText = getFallbackResponse(message, userContext);
  }

  return {
    aiText,
    isCrisis,
    actionCard,
  };
}

/**
 * Condenses recent conversation turns into a 2-sentence long-term episodic memory
 * using low temperature (0.2) for factual accuracy.
 */
async function summarizeEpisodicMemory(existingSummary = '', recentMessages = []) {
  if (!process.env.GROQ_API_KEY || recentMessages.length < 4) {
    return existingSummary;
  }

  const transcript = recentMessages
    .map((m) => `${m.sender === 'user' ? 'User' : 'Sera'}: ${m.message}`)
    .join('\n');

  const promptContent = existingSummary
    ? `Previous Memory Summary:\n${existingSummary}\n\nRecent Conversation:\n${transcript}`
    : `Recent Conversation:\n${transcript}`;

  try {
    const summary = await callGroqChat(
      [
        { role: 'system', content: EPISODIC_MEMORY_PROMPT },
        { role: 'user', content: promptContent },
      ],
      { temperature: 0.2, maxTokens: 600 }
    );
    return summary || existingSummary;
  } catch {
    return existingSummary;
  }
}

/**
 * Generates a structured 1-page Pre-Session Clinical Intake Brief for the therapist
 * using low temperature (0.2) for objective clinical synthesis.
 */
async function generateClinicalBrief(patient = {}, concern = '') {
  const stage = patient.healingStage || 'beginning';
  const recentJournals = (patient.journalEntries || []).slice(0, 5);
  const moods = recentJournals.map((j) => j.mood).filter(Boolean);
  const memory = patient.aiMemorySummary || '';

  const fallbackBrief = {
    presentingThemes:
      memory ||
      (concern
        ? `Patient requested support regarding: "${concern}". Currently navigating the ${stage} stage of trauma recovery.`
        : `Patient is currently in the "${stage}" healing stage and seeking trauma-informed therapeutic support.`),
    moodTrajectory:
      moods.length > 0
        ? `Recent self-reported mood check-ins: ${moods.join(' → ')} (${recentJournals.length} recent journal entries logged).`
        : 'No recent mood journal entries logged prior to this session.',
    suggestedFocus: [
      'Establish emotional safety and validate current coping capacity',
      concern
        ? `Explore patient's stated concern: "${concern}" at a comfortable pace`
        : `Review triggers and grounding tools suited for the ${stage} stage`,
      'Co-create one gentle between-session grounding or journaling anchor',
    ],
  };

  if (!process.env.GROQ_API_KEY) {
    return fallbackBrief;
  }

  try {
    const contextText = [
      `Patient Healing Stage: ${stage}`,
      `Appointment Stated Concern: ${concern || 'Not specified'}`,
      `Recent Moods: ${moods.join(', ') || 'None'}`,
      `Episodic AI Companion Summary: ${memory || 'None available'}`,
    ].join('\n');

    const raw = await callGroqChat(
      [
        { role: 'system', content: CLINICAL_BRIEF_PROMPT },
        { role: 'user', content: contextText },
      ],
      { temperature: 0.2, maxTokens: 800 }
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.presentingThemes && Array.isArray(parsed.suggestedFocus)) {
        return parsed;
      }
    }
    return fallbackBrief;
  } catch {
    return fallbackBrief;
  }
}

module.exports = {
  detectCrisisIntent,
  deriveActionCard,
  getFallbackResponse,
  generateSeraReply,
  summarizeEpisodicMemory,
  generateClinicalBrief,
  callGroqChat,
};
