const router = require('express').Router();
const Resource = require('../models/Resource');

// Seed initial resources
const seedResources = async () => {
  const count = await Resource.countDocuments();
  if (count > 0) return;
  await Resource.insertMany([
    { title: 'Understanding PTSD: A Gentle Guide', excerpt: 'Learn how trauma affects the mind and body, and discover your first steps toward healing.', category: 'ptsd', type: 'article', readTime: 8, author: 'Dr. Priya Menon', tags: ['ptsd', 'trauma', 'healing'] },
    { title: 'The 5-4-3-2-1 Grounding Technique', excerpt: 'A powerful mindfulness exercise to anchor yourself when overwhelmed by trauma responses.', category: 'mindfulness', type: 'exercise', readTime: 5, author: 'Rowl Wellness Team', tags: ['grounding', 'anxiety', 'mindfulness'] },
    { title: 'Healing a Broken Heart: Science & Soul', excerpt: 'Heartbreak activates the same brain regions as physical pain. Here is how to navigate it with compassion.', category: 'grief', type: 'article', readTime: 10, author: 'Dr. Arun Sharma', tags: ['heartbreak', 'grief', 'relationships'], isPremium: true },
    { title: 'Building Your Safe Inner Space', excerpt: 'A guided visualization exercise to create a mental sanctuary for moments of distress.', category: 'self-care', type: 'exercise', readTime: 15, author: 'Dr. Lakshmi Rao', tags: ['visualization', 'safety', 'self-care'], isPremium: true },
    { title: 'When Anxiety Becomes Overwhelming', excerpt: 'Recognizing anxiety disorders and understanding when to seek professional support.', category: 'anxiety', type: 'article', readTime: 7, author: 'Rowl Wellness Team', tags: ['anxiety', 'mental health', 'support'] },
    { title: 'Letters to Your Younger Self', excerpt: 'A therapeutic writing exercise to process past pain and cultivate self-compassion.', category: 'trauma', type: 'exercise', readTime: 20, author: 'Dr. Meera Pillai', tags: ['writing', 'self-compassion', 'healing'], isPremium: true },
  ]);
};

seedResources().catch(console.error);

router.get('/', async (req, res) => {
  try {
    const { category, type } = req.query;
    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;
    const resources = await Resource.find({ ...query, isPublished: true });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
