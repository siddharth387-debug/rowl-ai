import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const seedDoctors = [
  { _id: 'd1', name: 'Dr. Priya Menon', specialization: 'Trauma & PTSD', bio: 'Specialist in somatic trauma therapy and EMDR. 12 years supporting survivors of relational trauma.', rating: 4.9, slots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'], avatar: '🌸' },
  { _id: 'd2', name: 'Dr. Arun Sharma', specialization: 'Grief & Loss', bio: 'Compassionate grief counselor helping people find meaning after loss, heartbreak, and major life transitions.', rating: 4.8, slots: ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'], avatar: '🌿' },
  { _id: 'd3', name: 'Dr. Lakshmi Rao', specialization: 'Anxiety & Relationships', bio: 'CBT and attachment-based therapist. Specializes in healing relationship trauma and anxiety disorders.', rating: 4.9, slots: ['9:30 AM', '12:00 PM', '2:30 PM', '4:30 PM'], avatar: '💛' },
  { _id: 'd4', name: 'Dr. Meera Pillai', specialization: 'Heartbreak & Identity', bio: 'Psychologist focused on self-discovery after painful relationships and rebuilding a sense of self.', rating: 4.7, slots: ['8:30 AM', '11:30 AM', '1:30 PM', '3:30 PM'], avatar: '🌺' },
];

const sessionTypes = [
  { type: 'video', label: '📹 Video Call', desc: 'Face-to-face from your safe space' },
  { type: 'chat', label: '💬 Text Chat', desc: 'Written conversation, no camera needed' },
  { type: 'in-person', label: '🤝 In-Person', desc: 'Visit the clinic directly' },
];

// Helper — always pulls the latest token from localStorage so it's never stale
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rowl_token')}` }
});

const Appointments = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState(seedDoctors);
  const [selected, setSelected] = useState(null);
  const [sessionType, setSessionType] = useState('video');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [concern, setConcern] = useState('');
  const [step, setStep] = useState('browse');
  const [myAppointments, setMyAppointments] = useState([]);
  const [tab, setTab] = useState('find');
  const [booked, setBooked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    axios.get(`${API}/users/doctors`, authHeaders())
      .then(res => { if (res.data.length > 0) setDoctors([...res.data, ...seedDoctors.slice(0, 2)]); })
      .catch(() => {});

    if (user) {
      axios.get(`${API}/appointments/mine`, authHeaders())
        .then(res => setMyAppointments(res.data))
        .catch(() => {});
    }
  }, [user]);

  const handleBook = async () => {
  if (!user) return;
  setPayError('');
  setPaying(true);

  try {
    const isSeedDoctor = selected._id.startsWith('d') && selected._id.length <= 3;

    let appointment;
    if (isSeedDoctor) {
      appointment = {
        _id: 'demo_' + Date.now(),
        doctor: selected,
        date,
        timeSlot: slot,
        type: sessionType,
        concern,
        status: 'pending',
        paymentStatus: 'unpaid',
      };
    } else {
      const apptRes = await axios.post(
        `${API}/appointments`,
        { doctor: selected._id, date: new Date(date), timeSlot: slot, type: sessionType, concern },
        authHeaders()
      );
      appointment = apptRes.data;
    }

    // Step 2: Create Razorpay order
    const orderRes = await axios.post(
      `${API}/payments/create-order`,
      { purpose: 'appointment' },
      authHeaders()
    );
    const { orderId, amount, currency, keyId } = orderRes.data;

    // Step 3: Open Razorpay checkout
    const options = {
      key: keyId,
      amount,
      currency,
      name: 'Rowl AI',
      description: `Therapy session with ${selected.name}`,
      order_id: orderId,
      theme: { color: '#C96A3B' },
      prefill: { name: user.name, email: user.email },
      handler: async function (response) {
        try {
          await axios.post(
            `${API}/payments/verify`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointment._id,
            },
            authHeaders()
          );
          setMyAppointments(prev => [{ ...appointment, status: 'confirmed', paymentStatus: 'paid' }, ...prev]);
          setBooked(true);
          setStep('confirm');
        } catch {
          setPayError('Payment was made but verification failed. Please contact support.');
        }
        setPaying(false);
      },
      modal: {
        ondismiss: function () {
          setPayError('Payment was cancelled. Your session is saved as pending.');
          setMyAppointments(prev => [appointment, ...prev]);
          setPaying(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error('Booking error:', err.response?.data || err.message);
    setPayError('Something went wrong while starting your booking. Please try again.');
    setPaying(false);
  }
};

  const statusColors = { pending: '#F7D97A', confirmed: '#A8C5A0', completed: '#C96A3B', cancelled: '#FAD4CB' };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.title}>Connect with a Therapist 🗓</h1>
        <p style={styles.subtitle}>Our verified, trauma-informed therapists are here for you with warmth, expertise, and zero judgment.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'find' ? styles.tabActive : {}) }} onClick={() => { setTab('find'); setStep('browse'); }}>
          🔍 Find a Therapist
        </button>
        {user && (
          <button style={{ ...styles.tab, ...(tab === 'mine' ? styles.tabActive : {}) }} onClick={() => setTab('mine')}>
            🗓 My Sessions ({myAppointments.length})
          </button>
        )}
      </div>

      {/* BROWSE DOCTORS */}
      {tab === 'find' && step === 'browse' && (
        <div style={styles.doctorGrid}>
          {doctors.map(doc => (
            <div key={doc._id} style={styles.docCard}>
              <div style={styles.docHeader}>
                <div style={styles.docAvatar}>{doc.avatar || '🌸'}</div>
                <div>
                  <h3 style={styles.docName}>{doc.name}</h3>
                  <span style={styles.docSpec}>{doc.specialization}</span>
                </div>
                <div style={styles.docRating}>⭐ {doc.rating}</div>
              </div>
              <p style={styles.docBio}>{doc.bio}</p>
              <div style={styles.docSlots}>
                {(doc.slots || []).slice(0, 3).map(s => (
                  <span key={s} style={styles.slotChip}>{s}</span>
                ))}
                {(doc.slots?.length || 0) > 3 && (
                  <span style={styles.slotChip}>+{doc.slots.length - 3} more</span>
                )}
              </div>
              <button
                style={styles.bookBtn}
                onClick={() => {
                  if (!user) { alert('Please sign in to book a session.'); return; }
                  setSelected(doc);
                  setStep('book');
                  setPayError('');
                }}
              >
                Book a Session 🌸
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING FORM */}
      {tab === 'find' && step === 'book' && selected && (
        <div style={styles.bookSection}>
          <button style={styles.backBtn} onClick={() => setStep('browse')}>← Back</button>
          <div style={styles.bookCard}>
            <div style={styles.bookDocHeader}>
              <div style={styles.bookDocAvatar}>{selected.avatar || '🌸'}</div>
              <div>
                <h3 style={styles.bookDocName}>Booking with {selected.name}</h3>
                <p style={styles.bookDocSpec}>{selected.specialization}</p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Session Type</label>
              <div style={styles.sessionTypes}>
                {sessionTypes.map(t => (
                  <button
                    key={t.type}
                    style={{ ...styles.sessionTypeBtn, ...(sessionType === t.type ? styles.sessionTypeActive : {}) }}
                    onClick={() => setSessionType(t.type)}
                  >
                    <span>{t.label}</span>
                    <small style={{ color: sessionType === t.type ? 'white' : '#A07856' }}>{t.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Preferred Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Time Slot</label>
                <select style={styles.input} value={slot} onChange={e => setSlot(e.target.value)}>
                  <option value="">Choose a time</option>
                  {(selected.slots || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                What would you like support with? <span style={styles.optional}>(optional)</span>
              </label>
              <textarea
                style={styles.textarea}
                rows={3}
                placeholder="Share as much or as little as you feel comfortable with..."
                value={concern}
                onChange={e => setConcern(e.target.value)}
              />
            </div>

            <div style={styles.bookNote}>
              🔒 Your information is private and only shared with your therapist.
            </div>

            <div style={styles.priceRow}>
              <span style={styles.priceLabel}>Session Fee</span>
              <span style={styles.priceValue}>₹499</span>
            </div>

            {payError && <div style={styles.payError}>{payError}</div>}

            <button
              style={styles.confirmBtn}
              onClick={handleBook}
              disabled={!date || !slot || paying}
            >
              {paying ? 'Opening secure payment...' : 'Proceed to Pay ₹499 💛'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMED */}
      {step === 'confirm' && booked && (
        <div style={styles.confirmSection}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmEmoji}>🌸</div>
            <h2 style={styles.confirmTitle}>You are booked!</h2>
            <p style={styles.confirmSub}>
              Your session with <strong>{selected?.name}</strong> has been requested for{' '}
              <strong>{date}</strong> at <strong>{slot}</strong>.
            </p>
            <p style={styles.confirmNote}>
              You will receive a confirmation once your therapist approves. Be kind to yourself in the meantime. 💛
            </p>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmActionBtn} onClick={() => { setTab('mine'); setStep('browse'); }}>
                View My Sessions
              </button>
              <button style={styles.confirmSecBtn} onClick={() => { setStep('browse'); setBooked(false); setSelected(null); }}>
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY APPOINTMENTS */}
      {tab === 'mine' && (
        <div style={styles.myAppSection}>
          {!user ? (
            <div style={styles.signInPrompt}>
              <p>Please <Link to="/login" style={{ color: '#C96A3B', fontWeight: 700 }}>sign in</Link> to view your sessions.</p>
            </div>
          ) : myAppointments.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No sessions yet. Your healing journey awaits 🌸</p>
              <button style={styles.findTherapistBtn} onClick={() => setTab('find')}>Find a Therapist</button>
            </div>
          ) : (
            <div style={styles.apptList}>
              {myAppointments.map(appt => (
                <div key={appt._id} style={styles.apptCard}>
                  <div style={styles.apptHeader}>
                    <div>
                      <h3 style={styles.apptDoc}>{appt.doctor?.name || selected?.name || 'Your Therapist'}</h3>
                      <p style={styles.apptSpec}>{appt.doctor?.specialization || selected?.specialization || ''}</p>
                    </div>
                    <span style={{ ...styles.statusBadge, background: statusColors[appt.status] || '#FAD4CB' }}>
                      {appt.status}
                    </span>
                  </div>
                  {appt.paymentStatus && (
                    <span style={{ ...styles.paymentBadge, color: appt.paymentStatus === 'paid' ? '#5CB85C' : '#C96A3B' }}>
                      {appt.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}
                    </span>
                  )}
                  <div style={styles.apptMeta}>
                    <span>📅 {appt.date ? new Date(appt.date).toLocaleDateString() : 'TBD'}</span>
                    <span>🕐 {appt.timeSlot}</span>
                    <span>{appt.type === 'video' ? '📹' : appt.type === 'chat' ? '💬' : '🤝'} {appt.type}</span>
                  </div>
                  {appt.concern && <p style={styles.apptConcern}>"{appt.concern}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: 'calc(100vh - 70px)', background: '#FAF6F1', padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  pageHeader: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#3B2A1A', marginBottom: '0.5rem' },
  subtitle: { color: '#6B4C35', fontSize: '1rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' },
  tabs: { display: 'flex', gap: '0.8rem', marginBottom: '2rem' },
  tab: { padding: '10px 20px', background: 'white', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#6B4C35', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: '#C96A3B', color: 'white', border: '1.5px solid #C96A3B' },
  doctorGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' },
  docCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(59,42,26,0.08)', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  docHeader: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  docAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 },
  docName: { fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#3B2A1A' },
  docSpec: { fontSize: '0.8rem', color: '#C96A3B', fontWeight: 600 },
  docRating: { marginLeft: 'auto', fontSize: '0.85rem', color: '#8B4513', fontWeight: 700, whiteSpace: 'nowrap' },
  docBio: { color: '#6B4C35', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 },
  docSlots: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  slotChip: { padding: '3px 8px', background: '#FBF0C0', borderRadius: '8px', fontSize: '0.75rem', color: '#8B4513', fontWeight: 600 },
  bookBtn: { padding: '10px', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', border: 'none', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer', marginTop: 'auto' },
  bookSection: { maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#C96A3B', fontFamily: 'Nunito, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', textDecoration: 'underline' },
  bookCard: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 8px 30px rgba(201,106,59,0.1)', display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  bookDocHeader: { display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(244,168,150,0.2)' },
  bookDocAvatar: { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' },
  bookDocName: { fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#3B2A1A' },
  bookDocSpec: { color: '#C96A3B', fontSize: '0.85rem', fontWeight: 600 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontWeight: 700, fontSize: '0.9rem', color: '#3B2A1A' },
  optional: { fontWeight: 400, color: '#A07856', fontSize: '0.82rem' },
  sessionTypes: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' },
  sessionTypeBtn: { flex: 1, minWidth: '150px', padding: '10px 14px', background: '#FAF6F1', border: '1.5px solid rgba(244,168,150,0.3)', borderRadius: '12px', fontFamily: 'Nunito, sans-serif', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#3B2A1A' },
  sessionTypeActive: { background: '#C96A3B', color: 'white', border: '1.5px solid #C96A3B' },
  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  input: { padding: '10px 14px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', fontSize: '0.92rem', color: '#3B2A1A', background: '#FAF6F1', outline: 'none', flex: 1, minWidth: '140px' },
  textarea: { padding: '10px 14px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '10px', fontFamily: 'Nunito, sans-serif', fontSize: '0.92rem', color: '#3B2A1A', background: '#FAF6F1', outline: 'none', resize: 'none', width: '100%' },
  bookNote: { fontSize: '0.82rem', color: '#A07856', background: '#FBF0C0', padding: '8px 12px', borderRadius: '8px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#FAF6F1', borderRadius: '12px', border: '1.5px dashed rgba(201,106,59,0.3)' },
  priceLabel: { fontWeight: 700, color: '#3B2A1A', fontSize: '0.92rem' },
  priceValue: { fontWeight: 700, color: '#C96A3B', fontSize: '1.2rem' },
  payError: { fontSize: '0.85rem', color: '#8B4513', background: '#FDE8DC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #F4A896' },
  confirmBtn: { padding: '14px', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,106,59,0.3)' },
  confirmSection: { display: 'flex', justifyContent: 'center', padding: '2rem 0' },
  confirmCard: { background: 'white', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '500px', width: '100%', boxShadow: '0 8px 40px rgba(201,106,59,0.12)', textAlign: 'center' },
  confirmEmoji: { fontSize: '3rem', marginBottom: '1rem' },
  confirmTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#3B2A1A', marginBottom: '0.8rem' },
  confirmSub: { color: '#6B4C35', lineHeight: 1.7, marginBottom: '1rem' },
  confirmNote: { color: '#A07856', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1.5rem' },
  confirmBtns: { display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' },
  confirmActionBtn: { padding: '12px 22px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' },
  confirmSecBtn: { padding: '12px 22px', background: 'transparent', border: '2px solid #C96A3B', color: '#C96A3B', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 600, cursor: 'pointer' },
  myAppSection: { maxWidth: '700px', margin: '0 auto' },
  signInPrompt: { textAlign: 'center', padding: '3rem', color: '#6B4C35', fontSize: '1rem' },
  emptyState: { textAlign: 'center', padding: '3rem' },
  emptyText: { color: '#6B4C35', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: '1.5rem' },
  findTherapistBtn: { padding: '12px 24px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '25px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' },
  apptList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  apptCard: { background: 'white', borderRadius: '16px', padding: '1.4rem', boxShadow: '0 4px 16px rgba(59,42,26,0.07)', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  apptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  apptDoc: { fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#3B2A1A' },
  apptSpec: { fontSize: '0.8rem', color: '#C96A3B', fontWeight: 600 },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#3B2A1A', textTransform: 'capitalize' },
  paymentBadge: { fontSize: '0.78rem', fontWeight: 700 },
  apptMeta: { display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6B4C35', flexWrap: 'wrap' },
  apptConcern: { color: '#A07856', fontSize: '0.85rem', fontStyle: 'italic', borderLeft: '3px solid #F4A896', paddingLeft: '0.8rem' },
};

export default Appointments;