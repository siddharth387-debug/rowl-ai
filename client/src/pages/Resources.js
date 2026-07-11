import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const catColors = { ptsd: '#FAD4CB', trauma: '#F4A896', grief: '#FBF0C0', anxiety: '#F7D97A', relationships: '#FAD4CB', 'self-care': '#FBF0C0', mindfulness: '#F4A896' };
const catEmojis = { ptsd: '🧠', trauma: '💙', grief: '🌧', anxiety: '🌬', relationships: '💞', 'self-care': '🌸', mindfulness: '🧘' };
const typeEmojis = { article: '📖', exercise: '🌱', audio: '🎵', video: '🎬' };

const fallbackResources = [
  { _id: 'r1', title: 'Understanding PTSD: A Gentle Guide', excerpt: 'Learn how trauma affects the mind and body, and discover your first steps toward healing with compassion.', category: 'ptsd', type: 'article', readTime: 8, author: 'Dr. Priya Menon', tags: ['ptsd', 'trauma', 'healing'] },
  { _id: 'r2', title: 'The 5-4-3-2-1 Grounding Technique', excerpt: 'A powerful mindfulness exercise to anchor yourself when overwhelmed by trauma responses.', category: 'mindfulness', type: 'exercise', readTime: 5, author: 'Rowl Wellness Team', tags: ['grounding', 'anxiety', 'mindfulness'] },
  { _id: 'r3', title: 'Healing a Broken Heart: Science & Soul', excerpt: 'Heartbreak activates the same brain regions as physical pain. Navigate it with self-compassion.', category: 'grief', type: 'article', readTime: 10, author: 'Dr. Arun Sharma', tags: ['heartbreak', 'grief', 'relationships'], isPremium: true },
  { _id: 'r4', title: 'Building Your Safe Inner Space', excerpt: 'A guided visualization to create a mental sanctuary for moments of distress.', category: 'self-care', type: 'exercise', readTime: 15, author: 'Dr. Lakshmi Rao', tags: ['visualization', 'safety'], isPremium: true },
  { _id: 'r5', title: 'When Anxiety Becomes Overwhelming', excerpt: 'Recognizing anxiety disorders and understanding when to seek professional support.', category: 'anxiety', type: 'article', readTime: 7, author: 'Rowl Wellness Team', tags: ['anxiety', 'mental health'] },
  { _id: 'r6', title: 'Letters to Your Younger Self', excerpt: 'A therapeutic writing exercise to process past pain and cultivate deep self-compassion.', category: 'trauma', type: 'exercise', readTime: 20, author: 'Dr. Meera Pillai', tags: ['writing', 'self-compassion'], isPremium: true },
];

const exerciseContent = {
  'r2': {
    steps: [
      { num: 5, sense: 'SEE', emoji: '👁', prompt: 'Name 5 things you can see right now. Look slowly around you.' },
      { num: 4, sense: 'TOUCH', emoji: '🤚', prompt: 'Notice 4 things you can physically feel — your feet on the floor, air on your skin.' },
      { num: 3, sense: 'HEAR', emoji: '👂', prompt: 'Listen for 3 sounds. Maybe distant traffic, your own breath, birds.' },
      { num: 2, sense: 'SMELL', emoji: '👃', prompt: 'Find 2 scents around you. It\'s okay if it\'s subtle.' },
      { num: 1, sense: 'TASTE', emoji: '👅', prompt: 'Notice 1 thing you can taste right now.' },
    ]
  }
};

const Resources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState(fallbackResources);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    axios.get(`${API}/resources`).then(res => { if (res.data.length > 0) setResources(res.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected?.isPremium && user) {
      axios.get(`${API}/payments/resource-access/${selected._id}`)
        .then(res => { if (res.data.hasAccess) setUnlockedIds(prev => [...new Set([...prev, selected._id])]); })
        .catch(() => {});
    }
  }, [selected, user]);

  const hasAccess = (resource) => !resource.isPremium || unlockedIds.includes(resource._id);

  const handleUnlock = async (resource) => {
    if (!user) { setUnlockError('Please sign in to unlock premium content.'); return; }
    setUnlocking(true);
    setUnlockError('');
    try {
      const orderRes = await axios.post(`${API}/payments/create-order`, { purpose: 'resource', resourceId: resource._id });
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Rowl AI',
        description: `Unlock: ${resource.title}`,
        order_id: orderId,
        theme: { color: '#C96A3B' },
        prefill: { name: user.name, email: user.email },
        handler: async function (response) {
          try {
            await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resourceId: resource._id,
            });
            setUnlockedIds(prev => [...prev, resource._id]);
          } catch {
            setUnlockError('Payment succeeded but unlock failed — please refresh or contact support.');
          }
          setUnlocking(false);
        },
        modal: { ondismiss: () => setUnlocking(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setUnlockError('Could not start payment. Please try again.');
      setUnlocking(false);
    }
  };

  const filtered = resources.filter(r =>
    (filter === 'all' || r.category === filter) &&
    (typeFilter === 'all' || r.type === typeFilter)
  );

  const cats = ['all', ...new Set(resources.map(r => r.category))];
  const types = ['all', 'article', 'exercise'];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.title}>Resource Library 📚</h1>
        <p style={styles.subtitle}>Thoughtfully curated tools for your healing path — grounded in psychology, offered with love.</p>
      </div>

      {/* Filters */}
      <div style={styles.filterSection}>
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>Topic:</span>
          {cats.map(c => (
            <button key={c} style={{ ...styles.filterBtn, ...(filter === c ? styles.filterActive : {}) }} onClick={() => setFilter(c)}>
              {catEmojis[c] || '✨'} {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>Type:</span>
          {types.map(t => (
            <button key={t} style={{ ...styles.filterBtn, ...(typeFilter === t ? styles.filterActive : {}) }} onClick={() => setTypeFilter(t)}>
              {typeEmojis[t] || '✨'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Resource cards */}
      {!selected && (
        <div style={styles.grid}>
          {filtered.map(r => (
            <div key={r._id} style={{ ...styles.card, borderTop: `4px solid ${catColors[r.category] || '#F4A896'}` }} onClick={() => { setSelected(r); setExerciseStep(0); }}>
              <div style={styles.cardTop}>
                <span style={styles.cardTypeTag}>{typeEmojis[r.type]} {r.type}</span>
                {r.isPremium && !unlockedIds.includes(r._id) ? (
                  <span style={styles.premiumTag}>✨ Premium</span>
                ) : (
                  <span style={styles.readTime}>⏱ {r.readTime} min</span>
                )}
              </div>
              <h3 style={styles.cardTitle}>{r.title}</h3>
              <p style={styles.cardExcerpt}>{r.excerpt}</p>
              <div style={styles.cardFooter}>
                <span style={styles.author}>By {r.author}</span>
                <button style={styles.readBtn}>Read →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article / Exercise detail */}
      {selected && (
        <div style={styles.detail}>
          <button style={styles.backBtn} onClick={() => setSelected(null)}>← Back to Library</button>
          <div style={styles.detailCard}>
            <div style={styles.detailMeta}>
              <span style={{ ...styles.catBadge, background: catColors[selected.category] || '#FAD4CB' }}>
                {catEmojis[selected.category]} {selected.category}
              </span>
              <span style={styles.readTime}>⏱ {selected.readTime} min</span>
            </div>
            <h2 style={styles.detailTitle}>{selected.title}</h2>
            <p style={styles.detailAuthor}>By {selected.author}</p>

            {!hasAccess(selected) ? (
              <div style={styles.paywall}>
                <div style={styles.paywallIcon}>✨</div>
                <h3 style={styles.paywallTitle}>This is a Premium Resource</h3>
                <p style={styles.paywallText}>{selected.excerpt}</p>
                <p style={styles.paywallSub}>Unlock this guided resource for a one-time fee to support our therapists and continued care for the community.</p>
                {unlockError && <div style={styles.payError}>{unlockError}</div>}
                <button style={styles.unlockBtn} onClick={() => handleUnlock(selected)} disabled={unlocking}>
                  {unlocking ? 'Opening secure payment...' : 'Unlock for ₹99 💛'}
                </button>
              </div>
            ) : selected.type === 'exercise' && exerciseContent[selected._id] ? (
              <div style={styles.exerciseSection}>
                <p style={styles.exerciseIntro}>Find a comfortable position. Take a slow breath. Let's ground you, step by step. 🌿</p>
                <div style={styles.exerciseSteps}>
                  {exerciseContent[selected._id].steps.map((step, i) => (
                    <div key={i} style={{ ...styles.exerciseStep, opacity: i <= exerciseStep ? 1 : 0.3, transform: i <= exerciseStep ? 'none' : 'translateX(-10px)', transition: 'all 0.4s ease' }}>
                      <div style={styles.stepNum}>{step.num}</div>
                      <div>
                        <div style={styles.stepSense}>{step.emoji} {step.sense}</div>
                        <p style={styles.stepPrompt}>{step.prompt}</p>
                        {i === exerciseStep && i < exerciseContent[selected._id].steps.length - 1 && (
                          <button style={styles.nextStep} onClick={() => setExerciseStep(i + 1)}>Done ✓</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {exerciseStep >= exerciseContent[selected._id].steps.length - 1 && (
                  <div style={styles.completedBanner}>
                    🌟 Beautiful. You just grounded yourself. Notice how you feel right now. 🌟
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.articleBody}>
                <p style={styles.articleText}>{selected.excerpt}</p>
                <p style={styles.articleText}>
                  Whether you're navigating the aftermath of trauma, processing heartbreak, or simply trying to understand your own emotional patterns — you are not broken. The nervous system's responses to overwhelming events are natural, even when they feel unbearable.
                </p>
                <p style={styles.articleText}>
                  Healing begins with gentleness — toward yourself, toward your memories, toward the parts of you that are still learning to feel safe. Every step you take in awareness is meaningful.
                </p>
                <div style={styles.tags}>{(selected.tags || []).map(t => <span key={t} style={styles.tag}>#{t}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: 'calc(100vh - 70px)', background: '#FAF6F1', padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  pageHeader: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#3B2A1A', marginBottom: '0.5rem' },
  subtitle: { color: '#6B4C35', fontSize: '1rem', lineHeight: 1.6 },
  filterSection: { display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  filterLabel: { fontSize: '0.82rem', color: '#A07856', fontWeight: 700, minWidth: '40px' },
  filterBtn: { padding: '6px 14px', background: 'white', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontSize: '0.82rem', color: '#6B4C35', cursor: 'pointer', transition: 'all 0.2s' },
  filterActive: { background: '#C96A3B', color: 'white', border: '1.5px solid #C96A3B' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' },
  card: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(59,42,26,0.07)', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTypeTag: { fontSize: '0.78rem', background: '#FAF6F1', padding: '3px 10px', borderRadius: '10px', color: '#8B4513', fontWeight: 600 },
  readTime: { fontSize: '0.78rem', color: '#A07856' },
  cardTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#3B2A1A', lineHeight: 1.4 },
  cardExcerpt: { color: '#6B4C35', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(244,168,150,0.2)' },
  author: { fontSize: '0.78rem', color: '#A07856' },
  readBtn: { background: 'none', border: 'none', color: '#C96A3B', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' },
  detail: { maxWidth: '680px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#C96A3B', fontFamily: 'Nunito, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', textDecoration: 'underline' },
  detailCard: { background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 8px 30px rgba(201,106,59,0.1)' },
  detailMeta: { display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem' },
  catBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: '#3B2A1A' },
  detailTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#3B2A1A', marginBottom: '0.4rem', lineHeight: 1.3 },
  detailAuthor: { color: '#A07856', fontSize: '0.88rem', marginBottom: '1.5rem' },
  exerciseSection: { background: '#FAF6F1', borderRadius: '14px', padding: '1.5rem' },
  exerciseIntro: { color: '#6B4C35', fontStyle: 'italic', marginBottom: '1.5rem', lineHeight: 1.6 },
  exerciseSteps: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  exerciseStep: { display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'white', borderRadius: '12px' },
  stepNum: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 },
  stepSense: { fontWeight: 700, color: '#3B2A1A', marginBottom: '4px', fontSize: '0.9rem' },
  stepPrompt: { color: '#6B4C35', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '0.8rem' },
  nextStep: { padding: '8px 18px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },
  completedBanner: { marginTop: '1.5rem', padding: '1rem 1.5rem', background: 'linear-gradient(135deg,#F7D97A,#F4A896)', borderRadius: '12px', textAlign: 'center', color: '#3B2A1A', fontFamily: 'Playfair Display, serif', fontSize: '1rem', fontStyle: 'italic' },
  articleBody: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  articleText: { color: '#6B4C35', lineHeight: 1.8, fontSize: '0.97rem' },
  tags: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  tag: { padding: '4px 10px', background: '#FBF0C0', borderRadius: '10px', fontSize: '0.78rem', color: '#8B4513', fontWeight: 600 },
  premiumTag: { fontSize: '0.78rem', background: 'linear-gradient(135deg,#F7D97A,#C96A3B)', padding: '3px 10px', borderRadius: '10px', color: 'white', fontWeight: 700 },
  paywall: { textAlign: 'center', padding: '2rem 1rem', background: '#FAF6F1', borderRadius: '16px' },
  paywallIcon: { fontSize: '2.5rem', marginBottom: '0.8rem' },
  paywallTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#3B2A1A', marginBottom: '0.8rem' },
  paywallText: { color: '#6B4C35', lineHeight: 1.6, marginBottom: '0.6rem', fontSize: '0.95rem' },
  paywallSub: { color: '#A07856', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 },
  payError: { fontSize: '0.85rem', color: '#8B4513', background: '#FDE8DC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #F4A896', marginBottom: '1rem' },
  unlockBtn: { padding: '12px 28px', background: 'linear-gradient(135deg,#F7D97A,#C96A3B)', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,106,59,0.3)' },
};

export default Resources;
