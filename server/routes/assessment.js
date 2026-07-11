const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// PTSD/Emotional Wellbeing Assessment questions
const questions = [
  { id: 1, text: 'How often have you experienced recurring memories or flashbacks of a distressing event?', category: 'ptsd' },
  { id: 2, text: 'Do you find yourself avoiding people, places, or situations that remind you of painful experiences?', category: 'ptsd' },
  { id: 3, text: 'How often do you feel emotionally numb or disconnected from people around you?', category: 'connection' },
  { id: 4, text: 'Have you been experiencing changes in sleep patterns — difficulty sleeping or sleeping too much?', category: 'physical' },
  { id: 5, text: 'How often do you feel overwhelmed by feelings of sadness, grief, or loss?', category: 'grief' },
  { id: 6, text: 'Do you find it hard to trust others or feel safe in relationships?', category: 'relationships' },
  { id: 7, text: 'How often do you feel irritable, angry, or have sudden emotional reactions?', category: 'emotional' },
  { id: 8, text: 'Are you able to find moments of joy or hope in your daily life?', category: 'positive', reverse: true },
];

router.get('/questions', (req, res) => {
  res.json(questions);
});

router.post('/submit', auth, async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: score (1-5) }
    let totalScore = 0;
    let count = 0;

    for (const [qId, score] of Object.entries(answers)) {
      const q = questions.find(q => q.id === parseInt(qId));
      totalScore += q?.reverse ? (6 - score) : score;
      count++;
    }

    const avgScore = totalScore / count;
    let healingStage = 'beginning';
    if (avgScore <= 2) healingStage = 'thriving';
    else if (avgScore <= 3) healingStage = 'growing';
    else if (avgScore <= 4) healingStage = 'processing';

    await User.findByIdAndUpdate(req.user.id, { ptsdScore: avgScore, healingStage });

    const recommendations = {
      beginning: { message: 'You\'re taking the bravest first step. We\'re here for you.', actions: ['Book a session with a therapist', 'Try our grounding exercises', 'Join a support circle'] },
      processing: { message: 'You\'re moving through difficult feelings with courage.', actions: ['Continue therapy sessions', 'Explore our resource library', 'Share in the community'] },
      growing: { message: 'You\'re growing beautifully. Keep nurturing yourself.', actions: ['Explore advanced healing resources', 'Consider group therapy', 'Start journaling regularly'] },
      thriving: { message: 'You\'re blossoming! Your journey inspires others.', actions: ['Share your story to uplift others', 'Explore mindfulness practices', 'Celebrate your progress'] },
    };

    res.json({ healingStage, score: avgScore, recommendations: recommendations[healingStage] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
