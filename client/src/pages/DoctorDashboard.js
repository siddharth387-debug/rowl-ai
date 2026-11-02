import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('rowl_token')}` },
});

const statusColors = {
  pending: '#F7D97A',
  confirmed: '#A8C5A0',
  completed: '#C96A3B',
  cancelled: '#FAD4CB',
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);

  // Clinical brief modal state
  const [briefModal, setBriefModal] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Session notes state
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Doctor profile settings state
  const [profileForm, setProfileForm] = useState({
    specialization: user?.specialization || 'Trauma & PTSD Specialist',
    bio: user?.bio || '',
    slotsText: (user?.slots || ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']).join(', '),
  });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setProfileForm({
      specialization: user.specialization || 'Trauma & PTSD Specialist',
      bio: user.bio || '',
      slotsText: (user.slots || ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']).join(', '),
    });

    axios
      .get(`${API}/appointments/mine`, authHeaders())
      .then((res) => setAppointments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const updateStatus = async (apptId, newStatus) => {
    try {
      const res = await axios.put(
        `${API}/appointments/${apptId}`,
        { status: newStatus },
        authHeaders()
      );
      setAppointments((prev) => prev.map((a) => (a._id === apptId ? res.data : a)));
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a._id === apptId ? { ...a, status: newStatus } : a))
      );
    }
  };

  const saveSessionNote = async (apptId) => {
    try {
      const res = await axios.put(
        `${API}/appointments/${apptId}`,
        { notes: noteText },
        authHeaders()
      );
      setAppointments((prev) => prev.map((a) => (a._id === apptId ? res.data : a)));
      setEditingNotesId(null);
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a._id === apptId ? { ...a, notes: noteText } : a))
      );
      setEditingNotesId(null);
    }
  };

  const openClinicalBrief = async (appt) => {
    setBriefLoading(true);
    setBriefModal({ appointment: appt, data: null });
    try {
      const res = await axios.get(
        `${API}/appointments/${appt._id}/clinical-brief`,
        authHeaders()
      );
      setBriefModal({ appointment: appt, data: res.data });
    } catch {
      setBriefModal({
        appointment: appt,
        data: {
          patientName: appt.patient?.name || 'Patient',
          healingStage: appt.patient?.healingStage || 'beginning',
          brief: {
            presentingThemes: appt.concern || 'Patient seeking trauma-informed care.',
            moodTrajectory: 'Awaiting initial intake check-in.',
            suggestedFocus: [
              'Build therapeutic rapport and emotional safety',
              'Explore stated session goals gently',
              'Introduce grounding anchor for between-session support',
            ],
          },
        },
      });
    } finally {
      setBriefLoading(false);
    }
  };

  const saveDoctorProfile = async () => {
    const parsedSlots = profileForm.slotsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await axios.put(
        `${API}/users/me`,
        {
          specialization: profileForm.specialization,
          bio: profileForm.bio,
          slots: parsedSlots,
        },
        authHeaders()
      );
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      // ignore error
    }
  };

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <h2>🩺 Clinician Portal</h2>
          <p style={{ margin: '1rem 0', color: '#6B4C35' }}>
            Please <Link to="/login" style={{ color: '#C96A3B', fontWeight: 700 }}>sign in</Link> with your therapist account to manage sessions.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const filteredAppointments =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <span style={styles.badge}>🩺 Clinician Sanctuary Portal</span>
          <h1 style={styles.title}>Welcome, {user.name}</h1>
          <p style={styles.subtitle}>
            Manage patient appointments, review AI pre-session clinical briefs, and record session takeaways.
          </p>
        </div>
        <div style={styles.tabGroup}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'sessions' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('sessions')}
          >
            🗓 Patient Sessions ({appointments.length})
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'practice' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('practice')}
          >
            ⚙️ Practice & Availability
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricNum}>{pendingCount}</span>
          <span style={styles.metricLabel}>⏳ Pending Requests</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricNum}>{confirmedCount}</span>
          <span style={styles.metricLabel}>✅ Confirmed Upcoming</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricNum}>{completedCount}</span>
          <span style={styles.metricLabel}>🌸 Completed Sessions</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricNum}>₹{(confirmedCount + completedCount) * 499}</span>
          <span style={styles.metricLabel}>💛 Session Earnings</span>
        </div>
      </div>

      {activeTab === 'sessions' && (
        <>
          <div style={styles.filterRow}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                style={{ ...styles.filterPill, ...(filter === s ? styles.filterActive : {}) }}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#6B4C35', padding: '2rem' }}>Loading sessions...</p>
          ) : filteredAppointments.length === 0 ? (
            <div style={styles.emptyCard}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#3B2A1A' }}>
                No {filter === 'all' ? '' : filter} sessions in your queue right now 🌸
              </p>
            </div>
          ) : (
            <div style={styles.sessionList}>
              {filteredAppointments.map((appt) => (
                <div key={appt._id} style={styles.sessionCard}>
                  <div style={styles.sessionTop}>
                    <div>
                      <h3 style={styles.patientName}>
                        {appt.patient?.name || 'Patient'}{' '}
                        <span style={styles.stageTag}>
                          🌱 {appt.patient?.healingStage || 'beginning'} stage
                        </span>
                      </h3>
                      <div style={styles.metaRow}>
                        <span>📅 {appt.date ? new Date(appt.date).toLocaleDateString() : 'TBD'}</span>
                        <span>🕐 {appt.timeSlot}</span>
                        <span>
                          {appt.type === 'video' ? '📹 Video' : appt.type === 'chat' ? '💬 Chat' : '🤝 In-Person'}
                        </span>
                        <span style={{ color: appt.paymentStatus === 'paid' ? '#5CB85C' : '#C96A3B', fontWeight: 700 }}>
                          {appt.paymentStatus === 'paid' ? '✅ Paid (₹499)' : '⏳ Unpaid'}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusColors[appt.status] || '#FAD4CB',
                      }}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {appt.concern && (
                    <div style={styles.concernBox}>
                      <strong>Patient's Stated Concern:</strong> "{appt.concern}"
                    </div>
                  )}

                  {appt.notes && editingNotesId !== appt._id && (
                    <div style={styles.notesDisplay}>
                      <strong>📋 Clinical Takeaway / Notes:</strong> {appt.notes}
                    </div>
                  )}

                  {editingNotesId === appt._id && (
                    <div style={styles.notesEditor}>
                      <textarea
                        style={styles.textarea}
                        rows={3}
                        placeholder="Write clinical session notes or gentle post-session takeaways for the patient..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={styles.primaryBtnSmall} onClick={() => saveSessionNote(appt._id)}>
                          Save Note
                        </button>
                        <button style={styles.outlineBtnSmall} onClick={() => setEditingNotesId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={styles.actionsBar}>
                    <button style={styles.briefBtn} onClick={() => openClinicalBrief(appt)}>
                      ✨ AI Pre-Session Clinical Brief
                    </button>
                    <button
                      style={styles.outlineBtnSmall}
                      onClick={() => {
                        setEditingNotesId(appt._id);
                        setNoteText(appt.notes || '');
                      }}
                    >
                      📝 {appt.notes ? 'Edit Note' : 'Add Session Note'}
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                      {appt.status === 'pending' && (
                        <button
                          style={styles.confirmBtn}
                          onClick={() => updateStatus(appt._id, 'confirmed')}
                        >
                          ✓ Confirm Session
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          style={styles.completeBtn}
                          onClick={() => updateStatus(appt._id, 'completed')}
                        >
                          🌸 Mark Completed
                        </button>
                      )}
                      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <button
                          style={styles.cancelBtn}
                          onClick={() => updateStatus(appt._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'practice' && (
        <div style={styles.practiceCard}>
          <h3 style={styles.practiceTitle}>Your Therapist Profile & Time Slots</h3>
          <div style={styles.formField}>
            <label style={styles.label}>Clinical Specialization</label>
            <input
              style={styles.input}
              value={profileForm.specialization}
              onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
            />
          </div>
          <div style={styles.formField}>
            <label style={styles.label}>Compassionate Bio</label>
            <textarea
              style={styles.textarea}
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            />
          </div>
          <div style={styles.formField}>
            <label style={styles.label}>Available Time Slots (comma-separated)</label>
            <input
              style={styles.input}
              value={profileForm.slotsText}
              onChange={(e) => setProfileForm({ ...profileForm, slotsText: e.target.value })}
              placeholder="9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM"
            />
          </div>
          <button style={styles.primaryBtnSmall} onClick={saveDoctorProfile}>
            {profileSaved ? '✅ Profile Updated!' : 'Save Availability & Profile'}
          </button>
        </div>
      )}

      {/* AI Clinical Brief Modal */}
      {briefModal && (
        <div style={styles.modalOverlay} onClick={() => setBriefModal(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.badge}>✨ AI Continuity-of-Care Brief (Temp: 0.2)</span>
              <button style={styles.closeBtn} onClick={() => setBriefModal(null)}>✕</button>
            </div>
            <h2 style={styles.modalTitle}>
              Pre-Session Intake: {briefModal.data?.patientName || briefModal.appointment.patient?.name || 'Patient'}
            </h2>
            {briefLoading ? (
              <p style={{ color: '#6B4C35', padding: '1.5rem 0' }}>
                Synthesizing patient healing stage, mood check-ins, and Sera themes...
              </p>
            ) : (
              <div style={styles.briefBody}>
                <div style={styles.briefBlock}>
                  <h4 style={styles.briefHeading}>🌱 Presenting Themes & Context</h4>
                  <p style={styles.briefText}>{briefModal.data?.brief?.presentingThemes}</p>
                </div>
                <div style={styles.briefBlock}>
                  <h4 style={styles.briefHeading}>📊 Recent Mood Trajectory</h4>
                  <p style={styles.briefText}>{briefModal.data?.brief?.moodTrajectory}</p>
                </div>
                <div style={styles.briefBlock}>
                  <h4 style={styles.briefHeading}>🩺 Suggested Trauma-Informed Session Focus</h4>
                  <ul style={styles.focusList}>
                    {(briefModal.data?.brief?.suggestedFocus || []).map((item, idx) => (
                      <li key={idx} style={styles.focusItem}>{item}</li>
                    ))}
                  </ul>
                </div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  badge: { display: 'inline-block', background: '#FBF0C0', color: '#8B4513', padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' },
  title: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#3B2A1A', marginBottom: '0.3rem' },
  subtitle: { color: '#6B4C35', fontSize: '0.95rem' },
  tabGroup: { display: 'flex', gap: '0.6rem' },
  tabBtn: { padding: '10px 18px', background: 'white', border: '1.5px solid rgba(201,106,59,0.3)', borderRadius: '22px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#6B4C35', cursor: 'pointer' },
  tabActive: { background: '#C96A3B', color: 'white', borderColor: '#C96A3B' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  metricCard: { background: 'white', borderRadius: '18px', padding: '1.3rem', boxShadow: '0 4px 16px rgba(59,42,26,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' },
  metricNum: { fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#3B2A1A' },
  metricLabel: { fontSize: '0.84rem', color: '#6B4C35', fontWeight: 600 },
  filterRow: { display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
  filterPill: { padding: '6px 14px', background: 'white', border: '1px solid rgba(201,106,59,0.25)', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 600, color: '#6B4C35', cursor: 'pointer' },
  filterActive: { background: '#3B2A1A', color: 'white' },
  emptyCard: { background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(59,42,26,0.06)' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sessionCard: { background: 'white', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(59,42,26,0.07)', display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  sessionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  patientName: { fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#3B2A1A', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  stageTag: { fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem', background: '#FAF6F1', color: '#C96A3B', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 },
  metaRow: { display: 'flex', gap: '1rem', fontSize: '0.84rem', color: '#6B4C35', marginTop: '6px', flexWrap: 'wrap' },
  statusBadge: { padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700, color: '#3B2A1A', textTransform: 'capitalize' },
  concernBox: { background: '#FAF6F1', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', color: '#6B4C35', borderLeft: '3px solid #F4A896' },
  notesDisplay: { background: '#F4F9F3', padding: '10px 14px', borderRadius: '10px', fontSize: '0.86rem', color: '#3B2A1A', borderLeft: '3px solid #A8C5A0' },
  notesEditor: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(201,106,59,0.35)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', background: '#FAF6F1' },
  actionsBar: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.6rem', borderTop: '1px solid rgba(244,168,150,0.2)' },
  briefBtn: { padding: '8px 14px', background: '#FBF0C0', color: '#8B4513', border: '1px solid #C96A3B', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  primaryBtnSmall: { padding: '8px 16px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  outlineBtnSmall: { padding: '7px 14px', background: 'white', color: '#6B4C35', border: '1px solid rgba(201,106,59,0.35)', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  confirmBtn: { padding: '8px 16px', background: '#5CB85C', color: 'white', border: 'none', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  completeBtn: { padding: '8px 16px', background: '#C96A3B', color: 'white', border: 'none', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '8px 14px', background: '#FFF5F2', color: '#A63A2B', border: '1px solid #E26D5C', borderRadius: '18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  practiceCard: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 16px rgba(59,42,26,0.06)', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  practiceTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#3B2A1A' },
  formField: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.86rem', fontWeight: 700, color: '#3B2A1A' },
  input: { padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(201,106,59,0.35)', fontFamily: 'Nunito, sans-serif', fontSize: '0.92rem', background: '#FAF6F1' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(59,42,26,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem' },
  modalCard: { background: 'white', borderRadius: '24px', padding: '2rem', maxWidth: '560px', width: '100%', boxShadow: '0 16px 50px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#6B4C35' },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.45rem', color: '#3B2A1A', marginBottom: '1.2rem' },
  briefBody: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  briefBlock: { background: '#FAF6F1', padding: '1rem 1.2rem', borderRadius: '14px', borderLeft: '3.5px solid #C96A3B' },
  briefHeading: { fontSize: '0.9rem', color: '#3B2A1A', marginBottom: '0.35rem', fontWeight: 700 },
  briefText: { fontSize: '0.88rem', color: '#6B4C35', lineHeight: 1.55 },
  focusList: { margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  focusItem: { fontSize: '0.88rem', color: '#6B4C35', lineHeight: 1.5 },
};

export default DoctorDashboard;
