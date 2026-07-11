import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const categories = ['all', 'story', 'question', 'support', 'milestone'];
const catEmojis = { story: '📖', question: '❓', support: '🤗', milestone: '🌟', all: '✨' };
const catColors = { story: '#FAD4CB', question: '#FBF0C0', support: '#F4A896', milestone: '#F7D97A' };

const seedPosts = [
  { _id: '1', anonymousName: 'Healing Butterfly', isAnonymous: true, title: 'It gets better — I promise', content: 'A year ago I couldn\'t get out of bed. The PTSD had me locked in memories I couldn\'t escape. Today I walked in the park and felt the sun on my face and cried — but this time from gratitude. If you\'re in the dark right now, please hold on.', category: 'story', hearts: [], comments: [], createdAt: new Date(Date.now() - 86400000 * 2) },
  { _id: '2', anonymousName: 'Quiet Storm', isAnonymous: true, title: 'Does anyone else freeze during triggers?', content: 'I\'ve been working with a therapist but I still freeze completely when something reminds me of what happened. My body just stops. Has anyone found techniques that help in those moments?', category: 'question', hearts: [], comments: [], createdAt: new Date(Date.now() - 86400000) },
  { _id: '3', anonymousName: 'Soft Ember', isAnonymous: true, title: 'Six months without a panic attack 🌟', content: 'I just hit six months. Six whole months without a panic attack. I remember thinking this day would never come. Celebrating quietly today with chamomile tea and kind words to myself. You can get here too.', category: 'milestone', hearts: [], comments: [], createdAt: new Date(Date.now() - 3600000 * 5) },
];

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(seedPosts);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'story', isAnonymous: true, anonymousName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    axios.get(`${API}/community`).then(res => {
      if (res.data.length > 0) setPosts([...res.data, ...seedPosts.slice(0, 1)]);
    }).catch(() => {});
  }, []);

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/community`, form);
      setPosts(prev => [res.data, ...prev]);
      setForm({ title: '', content: '', category: 'story', isAnonymous: true, anonymousName: '' });
      setShowForm(false);
    } catch {
      // add locally for guests
      const local = { ...form, _id: Date.now().toString(), anonymousName: form.anonymousName || 'Anonymous Healer', hearts: [], comments: [], createdAt: new Date() };
      setPosts(prev => [local, ...prev]);
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const heartPost = async (postId) => {
    if (!user) return;
    try {
      const res = await axios.put(`${API}/community/${postId}/heart`);
      setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
    } catch {
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, hearts: p.hearts.length > 0 ? [] : [user.id] } : p));
    }
  };

  const submitComment = async (postId) => {
    if (!comment.trim()) return;
    try {
      const res = await axios.post(`${API}/community/${postId}/comment`, { content: comment, isAnonymous: true, anonymousName: 'Anonymous Healer' });
      setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
    } catch {
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...(p.comments || []), { content: comment, anonymousName: 'Anonymous Healer', createdAt: new Date() }] } : p));
    }
    setComment('');
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Community Circle 💛</h1>
          <p style={styles.subtitle}>A safe, anonymous space to share, listen, and lift each other up. You are never alone here.</p>
        </div>
        <button style={styles.shareBtn} onClick={() => { if (!user) return alert('Please sign in to share your story.'); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Share Your Story'}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Share with the Circle 🌸</h3>
          <p style={styles.formSub}>Your words may be the light someone else needs today.</p>
          <input style={styles.formInput} placeholder="Give your post a gentle title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea style={styles.formTextarea} placeholder="Share your story, question, or words of support..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} />
          <div style={styles.formRow}>
            <select style={styles.formSelect} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="story">📖 Story</option>
              <option value="question">❓ Question</option>
              <option value="support">🤗 Support</option>
              <option value="milestone">🌟 Milestone</option>
            </select>
            <label style={styles.anonLabel}>
              <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({ ...form, isAnonymous: e.target.checked })} />
              <span>Post Anonymously</span>
            </label>
          </div>
          {form.isAnonymous && (
            <input style={styles.formInput} placeholder="Choose a gentle name (e.g. 'Quiet Storm')" value={form.anonymousName} onChange={e => setForm({ ...form, anonymousName: e.target.value })} />
          )}
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sharing...' : 'Share with Love 💛'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={styles.filters}>
        {categories.map(c => (
          <button key={c} style={{ ...styles.filterBtn, ...(filter === c ? styles.filterActive : {}) }} onClick={() => setFilter(c)}>
            {catEmojis[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={styles.postsGrid}>
        {filteredPosts.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Be the first to share in this space 🌸</p>
          </div>
        )}
        {filteredPosts.map(post => (
          <div key={post._id} style={{ ...styles.postCard, borderTop: `4px solid ${catColors[post.category] || '#F4A896'}` }}>
            <div style={styles.postHeader}>
              <div style={styles.postAvatar}>{post.anonymousName?.[0] || 'A'}</div>
              <div>
                <div style={styles.postAuthor}>{post.anonymousName || 'Anonymous Healer'}</div>
                <div style={styles.postMeta}>{catEmojis[post.category]} {post.category} · {timeAgo(post.createdAt)}</div>
              </div>
            </div>
            <h3 style={styles.postTitle}>{post.title}</h3>
            <p style={styles.postContent}>{expandedPost === post._id ? post.content : post.content.slice(0, 160) + (post.content.length > 160 ? '...' : '')}</p>
            {post.content.length > 160 && (
              <button style={styles.readMore} onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}>
                {expandedPost === post._id ? 'Read less' : 'Read more'}
              </button>
            )}

            <div style={styles.postActions}>
              <button style={styles.heartBtn} onClick={() => heartPost(post._id)}>
                💗 {post.hearts?.length || 0}
              </button>
              <button style={styles.commentToggle} onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}>
                💬 {post.comments?.length || 0}
              </button>
            </div>

            {expandedPost === post._id && (
              <div style={styles.commentsSection}>
                {(post.comments || []).map((c, i) => (
                  <div key={i} style={styles.commentItem}>
                    <span style={styles.commentAuthor}>{c.anonymousName || 'Anonymous Healer'}</span>
                    <p style={styles.commentText}>{c.content}</p>
                  </div>
                ))}
                <div style={styles.commentInput}>
                  <input style={styles.commentBox} placeholder="Add a kind word..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment(post._id)} />
                  <button style={styles.commentSend} onClick={() => submitComment(post._id)}>💛</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: 'calc(100vh - 70px)', background: '#FAF6F1', padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  headerContent: { flex: 1 },
  title: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#3B2A1A', marginBottom: '0.5rem' },
  subtitle: { color: '#6B4C35', lineHeight: 1.6, fontSize: '0.95rem', maxWidth: '500px' },
  shareBtn: { padding: '12px 22px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  formCard: { background: 'white', borderRadius: '20px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(201,106,59,0.10)' },
  formTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#3B2A1A', marginBottom: '0.4rem' },
  formSub: { color: '#A07856', fontSize: '0.88rem', marginBottom: '1.2rem' },
  formInput: { width: '100%', padding: '10px 14px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: '#3B2A1A', background: '#FAF6F1', outline: 'none', marginBottom: '0.8rem' },
  formTextarea: { width: '100%', padding: '10px 14px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: '#3B2A1A', background: '#FAF6F1', outline: 'none', resize: 'none', marginBottom: '0.8rem' },
  formRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' },
  formSelect: { padding: '8px 12px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', background: '#FAF6F1', color: '#3B2A1A', cursor: 'pointer' },
  anonLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6B4C35', cursor: 'pointer' },
  submitBtn: { padding: '12px 24px', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' },
  filters: { display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', background: 'white', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', color: '#6B4C35', cursor: 'pointer', transition: 'all 0.2s' },
  filterActive: { background: '#C96A3B', color: 'white', border: '1.5px solid #C96A3B' },
  postsGrid: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  emptyState: { textAlign: 'center', padding: '3rem' },
  emptyText: { color: '#A07856', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' },
  postCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(59,42,26,0.06)' },
  postHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' },
  postAvatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
  postAuthor: { fontWeight: 700, color: '#3B2A1A', fontSize: '0.9rem' },
  postMeta: { fontSize: '0.78rem', color: '#A07856' },
  postTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#3B2A1A', marginBottom: '0.6rem' },
  postContent: { color: '#6B4C35', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: '0.5rem' },
  readMore: { background: 'none', border: 'none', color: '#C96A3B', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: '0.8rem' },
  postActions: { display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(244,168,150,0.2)' },
  heartBtn: { background: 'none', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', cursor: 'pointer', color: '#6B4C35', padding: '4px 8px', borderRadius: '8px' },
  commentToggle: { background: 'none', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', cursor: 'pointer', color: '#6B4C35', padding: '4px 8px', borderRadius: '8px' },
  commentsSection: { marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(244,168,150,0.3)' },
  commentItem: { padding: '0.6rem 0', borderBottom: '1px solid rgba(244,168,150,0.1)' },
  commentAuthor: { fontSize: '0.78rem', fontWeight: 700, color: '#C96A3B' },
  commentText: { fontSize: '0.88rem', color: '#6B4C35', marginTop: '2px', lineHeight: 1.5 },
  commentInput: { display: 'flex', gap: '8px', marginTop: '0.8rem' },
  commentBox: { flex: 1, padding: '8px 12px', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', background: '#FAF6F1', outline: 'none' },
  commentSend: { width: '36px', height: '36px', borderRadius: '50%', background: '#F7D97A', border: 'none', cursor: 'pointer', fontSize: '1rem' },
};

export default Community;
