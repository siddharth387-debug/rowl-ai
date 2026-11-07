const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Pre-seeded users from MongoDB Atlas so login/register/profile work even when Render's MongoDB connection is down
const memoryUsers = new Map([
  [
    'terryfunk@gmail.com',
    {
      _id: '6a5249d3a819e50fc6f61b49',
      name: 'terryFunk',
      email: 'terryFunk@gmail.com',
      password: '$2a$12$pMwPV9VODG9u019R/wZsFeerOM1k7QXSTtNaHojr7TAMFvNquWg66',
      role: 'patient',
      healingStage: 'beginning',
      phone: '',
      emergencyContact: { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'gustavo@gmail.com',
    {
      _id: '6a6595869331fd0b93a30258',
      name: 'gustavo',
      email: 'gustavo@gmail.com',
      password: '$2a$12$slSW0dEWBJDhZipXuY49g.AjLgKz712XCjc7/c0CNLotNk9K2OMg.',
      role: 'patient',
      healingStage: 'beginning',
      phone: '',
      emergencyContact: { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'carl@gmail.com',
    {
      _id: '6a6a272d24711ac1200ad62a',
      name: 'carl anderson',
      email: 'carl@gmail.com',
      password: '$2a$12$Jo7dexCgpmKYo96dpOsubuLESkaas5Y7Z4.gotvp4gN2EMLrmRmCe',
      role: 'patient',
      healingStage: 'beginning',
      phone: '',
      emergencyContact: { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'rah.ultamil1511@gmail.com',
    {
      _id: '6a7304c90b7e35e7cd666dc9',
      name: 'rah',
      email: 'rah.ultamil1511@gmail.com',
      password: '$2a$12$FwWO0WL5c5p4/lAxJOzhMuLa657mms3tvmS91.6bUXfw42.fgKQ1W',
      role: 'patient',
      healingStage: 'processing',
      phone: '',
      emergencyContact: { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'nandhakumar3899@gmail.com',
    {
      _id: '6a7305120b7e35e7cd666dcd',
      name: 'NAN',
      email: 'nandhakumar3899@gmail.com',
      password: '$2a$12$H60s7AyI94HhycRhLHPyAucdSmyj8EM2IiftczGZfGV7RmIcdS1de',
      role: 'patient',
      healingStage: 'beginning',
      phone: '',
      emergencyContact: { name: '', phone: '', email: '', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'rolden@gmail.com',
    {
      _id: '6ae83df64ec66dde9b80ac3f',
      name: 'siddharth_rolden',
      email: 'rolden@gmail.com',
      password: '$2a$12$KgNY.QNRCmLBSAotYCVYe.1NqEJ1j2RQwxhtr/cZuzAA8AT56XHla',
      role: 'patient',
      healingStage: 'beginning',
      phone: '6380686416',
      emergencyContact: { name: '', phone: '', email: 'deansiddharth@gmail.com', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'ralph@gmail.com',
    {
      _id: '6ae8408b23e58e2b904b6e77',
      name: 'ralph_emerson',
      email: 'ralph@gmail.com',
      password: '$2a$12$rRGtiN/dHXEgmsliqoGmVuqiLdrHfIXf3G.3sAwKmjsw1D4idZHK2',
      role: 'patient',
      healingStage: 'beginning',
      phone: '+91 6380686416',
      emergencyContact: { name: '', phone: '', email: 'deansiddharth@gmail.com', relation: '' },
      journalEntries: [],
    },
  ],
  [
    'priya.menon@rowl.ai',
    {
      _id: '6ae84acf9d3661516fc110a4',
      name: 'Dr. Priya Menon',
      email: 'priya.menon@rowl.ai',
      password: '$2a$10$YaYO2uVgZ4AimXMxQ5.ULedbSGvomkZyQrTPmbahBRjozhldSwwdO',
      role: 'doctor',
      specialization: 'Trauma & PTSD',
      bio: 'Specialist in somatic trauma therapy and EMDR. 12 years supporting survivors of relational trauma.',
      rating: 4.9,
      slots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
      avatar: '🌸',
      isVerified: true,
      healingStage: 'beginning',
      journalEntries: [],
    },
  ],
  [
    'arun.sharma@rowl.ai',
    {
      _id: '6ae84acf9d3661516fc110a5',
      name: 'Dr. Arun Sharma',
      email: 'arun.sharma@rowl.ai',
      password: '$2a$10$YaYO2uVgZ4AimXMxQ5.ULedbSGvomkZyQrTPmbahBRjozhldSwwdO',
      role: 'doctor',
      specialization: 'Grief & Loss',
      bio: 'Compassionate grief counselor helping people find meaning after loss, heartbreak, and major life transitions.',
      rating: 4.8,
      slots: ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
      avatar: '🌿',
      isVerified: true,
      healingStage: 'beginning',
      journalEntries: [],
    },
  ],
  [
    'lakshmi.rao@rowl.ai',
    {
      _id: '6ae84acf9d3661516fc110a6',
      name: 'Dr. Lakshmi Rao',
      email: 'lakshmi.rao@rowl.ai',
      password: '$2a$10$YaYO2uVgZ4AimXMxQ5.ULedbSGvomkZyQrTPmbahBRjozhldSwwdO',
      role: 'doctor',
      specialization: 'Anxiety & Relationships',
      bio: 'CBT and attachment-based therapist. Specializes in healing relationship trauma and anxiety disorders.',
      rating: 4.9,
      slots: ['9:30 AM', '12:00 PM', '2:30 PM', '4:30 PM'],
      avatar: '💛',
      isVerified: true,
      healingStage: 'beginning',
      journalEntries: [],
    },
  ],
  [
    'meera.pillai@rowl.ai',
    {
      _id: '6ae84acf9d3661516fc110a7',
      name: 'Dr. Meera Pillai',
      email: 'meera.pillai@rowl.ai',
      password: '$2a$10$YaYO2uVgZ4AimXMxQ5.ULedbSGvomkZyQrTPmbahBRjozhldSwwdO',
      role: 'doctor',
      specialization: 'Heartbreak & Identity',
      bio: 'Psychologist focused on self-discovery after painful relationships and rebuilding a sense of self.',
      rating: 4.7,
      slots: ['8:30 AM', '11:30 AM', '1:30 PM', '3:30 PM'],
      avatar: '🌺',
      isVerified: true,
      healingStage: 'beginning',
      journalEntries: [],
    },
  ],
]);

const memoryAppointments = [];
const memoryCommunityPosts = [
  {
    _id: '6ae84acf9d3661516fc12001',
    title: 'Taking my first breath without anxiety in months',
    content: 'Today I tried the 5-4-3-2-1 grounding exercise before my morning presentation and it genuinely helped calm my racing heart. Sending warmth to everyone here.',
    category: 'healing',
    isAnonymous: true,
    anonymousName: 'Gentle Lotus',
    hearts: [],
    comments: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 5),
  },
];

const memoryResources = [
  { _id: '6ae84acf9d3661516fc13001', title: 'Understanding PTSD: A Gentle Guide', excerpt: 'Learn how trauma affects the mind and body, and discover your first steps toward healing.', category: 'ptsd', type: 'article', readTime: 8, author: 'Dr. Priya Menon', tags: ['ptsd', 'trauma', 'healing'], isPublished: true },
  { _id: '6ae84acf9d3661516fc13002', title: 'The 5-4-3-2-1 Grounding Technique', excerpt: 'A powerful mindfulness exercise to anchor yourself when overwhelmed by trauma responses.', category: 'mindfulness', type: 'exercise', readTime: 5, author: 'Rowl Wellness Team', tags: ['grounding', 'anxiety', 'mindfulness'], isPublished: true },
  { _id: '6ae84acf9d3661516fc13003', title: 'Healing a Broken Heart: Science & Soul', excerpt: 'Heartbreak activates the same brain regions as physical pain. Here is how to navigate it with compassion.', category: 'grief', type: 'article', readTime: 10, author: 'Dr. Arun Sharma', tags: ['heartbreak', 'grief', 'relationships'], isPremium: true, isPublished: true },
  { _id: '6ae84acf9d3661516fc13004', title: 'Building Your Safe Inner Space', excerpt: 'A guided visualization exercise to create a mental sanctuary for moments of distress.', category: 'self-care', type: 'exercise', readTime: 15, author: 'Dr. Lakshmi Rao', tags: ['visualization', 'safety', 'self-care'], isPremium: true, isPublished: true },
  { _id: '6ae84acf9d3661516fc13005', title: 'When Anxiety Becomes Overwhelming', excerpt: 'Recognizing anxiety disorders and understanding when to seek professional support.', category: 'anxiety', type: 'article', readTime: 7, author: 'Rowl Wellness Team', tags: ['anxiety', 'mental health', 'support'], isPublished: true },
  { _id: '6ae84acf9d3661516fc13006', title: 'Letters to Your Younger Self', excerpt: 'A therapeutic writing exercise to process past pain and cultivate self-compassion.', category: 'trauma', type: 'exercise', readTime: 20, author: 'Dr. Meera Pillai', tags: ['writing', 'self-compassion', 'healing'], isPremium: true, isPublished: true },
];

const memoryPayments = [];

const findMemoryUserById = (id) => {
  for (const u of memoryUsers.values()) {
    if (String(u._id) === String(id)) return u;
  }
  return null;
};

const findMemoryUserByEmail = (email) => {
  if (!email) return null;
  return memoryUsers.get(String(email).trim().toLowerCase()) || null;
};

module.exports = {
  isDbConnected,
  memoryUsers,
  memoryAppointments,
  memoryCommunityPosts,
  memoryResources,
  memoryPayments,
  findMemoryUserById,
  findMemoryUserByEmail,
};
