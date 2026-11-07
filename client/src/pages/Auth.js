import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password OTP states
  const [resetMode, setResetMode] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = request OTP, 2 = verify OTP & new password
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpPreviewUrl, setOtpPreviewUrl] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const u = await login(form.email, form.password);
      navigate(u?.role === 'doctor' ? '/doctor-dashboard' : '/healing');
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!form.email.trim()) {
      setError('Please enter your registered email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setOtpPreviewUrl('');
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email: form.email });
      setSuccessMsg(res.data.message || '6-digit OTP sent to your email!');
      if (res.data.emailPreviewUrl) {
        setOtpPreviewUrl(res.data.emailPreviewUrl);
      }
      setOtpStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not send OTP. Please check your email.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!otpCode.trim() || !newPassword.trim()) {
      setError('Please enter the 6-digit OTP and your new password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/reset-password`, {
        email: form.email,
        otp: otpCode,
        newPassword,
      });
      setSuccessMsg(res.data.message || 'Password updated! You can now sign in.');
      setResetMode(false);
      setOtpStep(1);
      setOtpCode('');
      setNewPassword('');
      setOtpPreviewUrl('');
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid or expired OTP.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.icon}>{resetMode ? '🔐' : '🌸'}</div>
          <h1 style={styles.title}>{resetMode ? 'Reset Password' : 'Welcome Back'}</h1>
          <p style={styles.sub}>
            {resetMode
              ? 'We will send a 6-digit verification code to your registered email.'
              : 'Your healing space is waiting for you.'}
          </p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        {successMsg && (
          <div style={{ ...styles.error, background: '#E8F8EE', borderColor: '#25D366', color: '#1E6F43' }}>
            <div>✅ {successMsg}</div>
            {otpPreviewUrl && (
              <a
                href={otpPreviewUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '6px', color: '#C96A3B', fontWeight: 700, textDecoration: 'underline' }}
              >
                📧 View 6-Digit OTP Email →
              </a>
            )}
          </div>
        )}

        {!resetMode ? (
          <>
            <div style={styles.fields}>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.label}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#C96A3B', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>
            <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing you in...' : 'Sign In 🌿'}
            </button>
          </>
        ) : (
          <>
            <div style={styles.fields}>
              <div style={styles.field}>
                <label style={styles.label}>Registered Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {otpStep === 2 && (
                <>
                  <div style={styles.field}>
                    <label style={styles.label}>6-Digit Verification OTP</label>
                    <input
                      style={{ ...styles.input, letterSpacing: '4px', fontWeight: 700, textAlign: 'center' }}
                      placeholder="123456"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>New Password (min 6 characters)</label>
                    <input
                      style={styles.input}
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    />
                  </div>
                </>
              )}
            </div>
            {otpStep === 1 ? (
              <button style={styles.btn} onClick={handleRequestOtp} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send 6-Digit OTP 📧'}
              </button>
            ) : (
              <button style={styles.btn} onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Updating Password...' : 'Verify OTP & Update Password 🔒'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setOtpStep(1);
                setError('');
              }}
              style={{ width: '100%', background: 'none', border: 'none', color: '#6B4C35', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', marginBottom: '0.8rem' }}
            >
              ← Back to Sign In
            </button>
          </>
        )}

        <p style={styles.switchText}>New here? <Link to="/register" style={styles.switchLink}>Create your safe space →</Link></p>
      </div>
    </div>
  );
};

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyEmail: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const u = await register(form.name, form.email, form.password, form.role, {
        phone: form.phone,
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          email: form.emergencyEmail,
        },
      });
      navigate(u?.role === 'doctor' ? '/doctor-dashboard' : '/healing');
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
          {form.role === 'patient' && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Your Phone Number (Optional · For Safety Check-Ins)</label>
                <input style={styles.input} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ ...styles.privacyNote, background: '#FAF6F1', border: '1px solid rgba(201,106,59,0.25)', marginBottom: 0 }}>
                <div style={{ fontWeight: 700, color: '#3B2A1A', marginBottom: '6px' }}>🤝 Trusted Safety Contact (For Crisis SOS)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input style={styles.input} placeholder="Trusted person's name (e.g. Mom, Best Friend)" value={form.emergencyName} onChange={e => setForm({ ...form, emergencyName: e.target.value })} />
                  <input style={styles.input} type="tel" placeholder="Trusted person's phone (+91...)" value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} />
                  <input style={styles.input} type="email" placeholder="Trusted person's email (for SOS alert)" value={form.emergencyEmail} onChange={e => setForm({ ...form, emergencyEmail: e.target.value })} />
                </div>
              </div>
            </>
          )}
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
