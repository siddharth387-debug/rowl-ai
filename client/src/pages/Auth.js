import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/healing');
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.icon}>🌸</div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.sub}>Your healing space is waiting for you.</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.fields}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>
        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing you in...' : 'Sign In 🌿'}
        </button>
        <p style={styles.switchText}>New here? <Link to="/register" style={styles.switchLink}>Create your safe space →</Link></p>
      </div>
    </div>
  );
};

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/healing');
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.icon}>🌱</div>
          <h1 style={styles.title}>Begin Your Journey</h1>
          <p style={styles.sub}>This is your safe, judgment-free space to heal.</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.roleSelect}>
          <button style={{ ...styles.roleBtn, ...(form.role === 'patient' ? styles.roleActive : {}) }} onClick={() => setForm({ ...form, role: 'patient' })}>
            🌸 I'm seeking support
          </button>
          <button style={{ ...styles.roleBtn, ...(form.role === 'doctor' ? styles.roleActive : {}) }} onClick={() => setForm({ ...form, role: 'doctor' })}>
            💙 I'm a therapist
          </button>
        </div>
        <div style={styles.fields}>
          <div style={styles.field}>
            <label style={styles.label}>Your Name</label>
            <input style={styles.input} placeholder="What shall we call you?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="Create a secure password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>
        <div style={styles.privacyNote}>
          🔒 Your information is private and will never be shared without your consent.
        </div>
        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating your space...' : 'Create My Safe Space 🌸'}
        </button>
        <p style={styles.switchText}>Already with us? <Link to="/login" style={styles.switchLink}>Sign in →</Link></p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(160deg, #FAF6F1 0%, #FDE8DC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { background: 'white', borderRadius: '24px', padding: '2.5rem 2rem', maxWidth: '440px', width: '100%', boxShadow: '0 12px 50px rgba(201,106,59,0.13)' },
  cardTop: { textAlign: 'center', marginBottom: '1.5rem' },
  icon: { fontSize: '2.5rem', marginBottom: '0.8rem' },
  title: { fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#3B2A1A', marginBottom: '0.4rem' },
  sub: { color: '#6B4C35', fontSize: '0.92rem' },
  error: { background: '#FDE8DC', border: '1px solid #F4A896', color: '#8B4513', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1rem' },
  roleSelect: { display: 'flex', gap: '0.6rem', marginBottom: '1.2rem' },
  roleBtn: { flex: 1, padding: '10px', background: '#FAF6F1', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '12px', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', fontWeight: 600, color: '#6B4C35', cursor: 'pointer', transition: 'all 0.2s' },
  roleActive: { background: '#FDE8DC', border: '1.5px solid #C96A3B', color: '#C96A3B' },
  fields: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#3B2A1A' },
  input: { padding: '11px 14px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: '#3B2A1A', background: '#FAF6F1', outline: 'none', transition: 'border 0.2s' },
  privacyNote: { fontSize: '0.8rem', color: '#A07856', background: '#FBF0C0', padding: '8px 12px', borderRadius: '8px', marginBottom: '1rem' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,106,59,0.3)', marginBottom: '1rem' },
  switchText: { textAlign: 'center', fontSize: '0.88rem', color: '#6B4C35' },
  switchLink: { color: '#C96A3B', fontWeight: 700, textDecoration: 'none' },
};
