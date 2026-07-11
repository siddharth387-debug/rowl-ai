import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const questions = [
  { id: 1, text: 'How often have you experienced recurring memories or flashbacks of a distressing event?', category: 'ptsd', emoji: '🔁' },
  { id: 2, text: 'Do you find yourself avoiding people, places, or situations that remind you of painful experiences?', category: 'ptsd', emoji: '🚪' },
  { id: 3, text: 'How often do you feel emotionally numb or disconnected from people around you?', category: 'connection', emoji: '💧' },
  { id: 4, text: 'Have you been experiencing changes in sleep patterns — difficulty sleeping or sleeping too much?', category: 'physical', emoji: '🌙' },
  { id: 5, text: 'How often do you feel overwhelmed by feelings of sadness, grief, or loss?', category: 'grief', emoji: '💔' },
  { id: 6, text: 'Do you find it hard to trust others or feel safe in relationships?', category: 'relationships', emoji: '🔒' },
  { id: 7, text: 'How often do you feel irritable, angry, or have sudden emotional reactions?', category: 'emotional', emoji: '⚡' },
  { id: 8, text: 'Are you able to find moments of joy or hope in your daily life?', category: 'positive', emoji: '☀️' },
];

const scaleLabels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

const stageInfo = {
  beginning: {
    emoji: '🌱', label: 'Beginning', color: '#F4A896',
    message: "You've taken the bravest step — acknowledging where you are. This is where every healing story starts.",
    actions: ['Book a session with a trauma-informed therapist', 'Try the 5-4-3-2-1 grounding exercise', 'Talk to Sera, our AI companion, anytime'],
  },
  processing: {
    emoji: '🌊', label: 'Processing', color: '#F7D97A',
    message: "You're moving through deep waters with real courage. Feeling the weight is part of moving forward.",
    actions: ['Continue regular therapy sessions', 'Explore our PTSD resource library', 'Join a support circle in the community'],
  },
  growing: {
    emoji: '🌿', label: 'Growing', color: '#A8C5A0',
    message: "Something beautiful is unfolding in you. Growth isn't always visible, but it's happening.",
    actions: ['Explore mindfulness and self-care resources', 'Consider group therapy for deeper connection', 'Start a healing journal'],
  },
  thriving: {
    emoji: '🌻', label: 'Thriving', color: '#C96A3B',
    message: "You are blossoming. Your journey is an inspiration — and you can help others find their light too.",
    actions: ['Share your story in the community circle', 'Explore advanced mindfulness practices', "Celebrate every milestone you've reached"],
  },
};

const HealingJourney = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState('intro'); // intro | assessment | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalMood, setJournalMood] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  const handleAnswer = (score) => {
    const newAnswers = { ...answers, [questions[current].id]: score };
    setAnswers(newAnswers);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    setPhase('result');
    try {
      if (user) {
        const res = await axios.post(`${API}/assessment/submit`, { answers: finalAnswers });
        setResult(res.data);
      } else {
        // Local scoring for guests
        let total = 0, count = 0;
        for (const [qId, score] of Object.entries(finalAnswers)) {
          const q = questions.find(q => q.id === parseInt(qId));
          total += q?.category === 'positive' ? (6 - score) : score;
          count++;
        }
        const avg = total / count;
        let stage = 'beginning';
        if (avg <= 2) stage = 'thriving';
        else if (avg <= 3) stage = 'growing';
        else if (avg <= 4) stage = 'processing';
        setResult({ healingStage: stage, score: avg, recommendations: stageInfo[stage] });
      }
    } catch {
      setResult({ healingStage: 'beginning', score: 4, recommendations: stageInfo['beginning'] });
    }
    setLoading(false);
  };

  const saveJournal = async () => {
    if (!user || !journalText.trim()) return;
    try {
      await axios.post(`${API}/users/journal`, { content: journalText, mood: journalMood });
      setJournalSaved(true);
    } catch { setJournalSaved(false); }
  };

  const progress = ((current) / questions.length) * 100;

  return (
    <div style={styles.page}>
      {/* INTRO */}
      {phase === 'intro' && (
        <div style={styles.introSection}>
          <div style={styles.introCard}>
            <div style={styles.introEmoji}>🌱</div>
            <h1 style={styles.introTitle}>Your Healing Journey</h1>
            <p style={styles.introSub}>
              This gentle assessment helps us understand where you are in your emotional wellbeing journey.
              There are no right or wrong answers — only honest ones.
            </p>
            <div style={styles.introNote}>
              <span>🔒</span>
              <span>Your responses are private and used only to personalize your experience.</span>
            </div>
            <div style={styles.introStats}>
              <div style={styles.stat}><strong>8</strong><span>gentle questions</span></div>
              <div style={styles.statDivider} />
              <div style={styles.stat}><strong>~3 min</strong><span>to complete</span></div>
              <div style={styles.statDivider} />
              <div style={styles.stat}><strong>100%</strong><span>confidential</span></div>
            </div>
            <button style={styles.startBtn} onClick={() => setPhase('assessment')}>
              Begin Gently 🌸
            </button>
            {!user && (
              <p style={styles.guestNote}>
                <Link to="/register" style={styles.guestLink}>Create an account</Link> to save your results and track your progress over time.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ASSESSMENT */}
      {phase === 'assessment' && (
        <div style={styles.assessSection}>
          {/* Progress */}
          <div style={styles.progressWrap}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressLabel}>{current + 1} of {questions.length}</span>
          </div>

          <div style={styles.questionCard}>
            <div style={styles.questionEmoji}>{questions[current].emoji}</div>
            <h2 style={styles.questionText}>{questions[current].text}</h2>
            <p style={styles.scaleHint}>Tap the option that feels most true for you</p>
            <div style={styles.scaleButtons}>
              {scaleLabels.map((label, i) => (
                <button
                  key={i}
                  style={styles.scaleBtn}
                  onClick={() => handleAnswer(i + 1)}
                >
                  <span style={styles.scaleBtnNum}>{i + 1}</span>
                  <span style={styles.scaleBtnLabel}>{label}</span>
                </button>
              ))}
            </div>

            {current > 0 && (
              <button style={styles.backBtn} onClick={() => setCurrent(current - 1)}>← Back</button>
            )}
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && (
        <div style={styles.resultSection}>
          {loading ? (
            <div style={styles.loadingWrap}>
              <div style={styles.loadingCircle}>🌸</div>
              <p style={styles.loadingText}>Understanding your heart...</p>
            </div>
          ) : result && (
            <>
              <div style={styles.resultCard}>
                <div style={{ ...styles.stageEmoji, background: stageInfo[result.healingStage]?.color + '30' }}>
                  {stageInfo[result.healingStage]?.emoji}
                </div>
                <h2 style={styles.stageLabel}>You Are {stageInfo[result.healingStage]?.label}</h2>
                <p style={styles.stageMessage}>{stageInfo[result.healingStage]?.message}</p>

                <div style={styles.actionsSection}>
                  <h3 style={styles.actionsTitle}>Your Personalized Next Steps</h3>
                  <div style={styles.actionsList}>
                    {(result.recommendations?.actions || stageInfo[result.healingStage]?.actions || []).map((action, i) => (
                      <div key={i} style={styles.actionItem}>
                        <span style={styles.actionIcon}>✦</span>
                        <span style={styles.actionText}>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.resultCtas}>
                  <Link to="/chatbot" style={styles.resultBtn}>Talk to Sera 🌸</Link>
                  <Link to="/appointments" style={styles.resultBtnOutline}>Book a Therapist</Link>
                </div>
              </div>

              {/* Journal section */}
              <div style={styles.journalCard}>
                <h3 style={styles.journalTitle}>📓 How are you feeling right now?</h3>
                <p style={styles.journalSub}>Write whatever comes to mind — this is your private space.</p>
                <textarea
                  style={styles.journalInput}
                  placeholder="I'm feeling..."
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  rows={4}
                />
                <div style={styles.journalMoods}>
                  {['😔', '😰', '😶', '🙂', '🌟'].map(m => (
                    <button key={m} style={{ ...styles.moodPill, background: journalMood === m ? '#F4A896' : 'white' }} onClick={() => setJournalMood(m)}>{m}</button>
                  ))}
                </div>
                {user ? (
                  journalSaved
                    ? <p style={styles.savedMsg}>✅ Saved to your journal!</p>
                    : <button style={styles.saveJournalBtn} onClick={saveJournal}>Save Entry 💛</button>
                ) : (
                  <p style={styles.guestNote}><Link to="/register" style={styles.guestLink}>Sign up</Link> to save journal entries.</p>
                )}
              </div>

              <button style={styles.retakeBtn} onClick={() => { setPhase('intro'); setCurrent(0); setAnswers({}); setResult(null); setJournalSaved(false); }}>
                Retake Assessment
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(160deg, #FAF6F1 0%, #FDE8DC 100%)', padding: '2rem 1rem' },
  introSection: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
  introCard: { background: 'white', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '560px', width: '100%', boxShadow: '0 8px 40px rgba(201,106,59,0.12)', textAlign: 'center' },
  introEmoji: { fontSize: '3rem', marginBottom: '1rem' },
  introTitle: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#3B2A1A', marginBottom: '1rem' },
  introSub: { color: '#6B4C35', lineHeight: 1.7, fontSize: '1rem', marginBottom: '1.5rem' },
  introNote: { display: 'flex', alignItems: 'center', gap: '8px', background: '#FBF0C0', padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', color: '#8B4513', marginBottom: '1.5rem', textAlign: 'left' },
  introStats: { display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  statDivider: { width: '1px', background: 'rgba(201,106,59,0.2)', alignSelf: 'stretch' },
  startBtn: { padding: '14px 32px', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', color: 'white', border: 'none', borderRadius: '30px', fontFamily: 'Nunito, sans-serif', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,106,59,0.3)', marginBottom: '1rem' },
  guestNote: { fontSize: '0.85rem', color: '#A07856', marginTop: '0.5rem' },
  guestLink: { color: '#C96A3B', fontWeight: 700 },
  assessSection: { maxWidth: '600px', margin: '0 auto', padding: '1rem' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  progressBar: { flex: 1, height: '6px', background: 'rgba(244,168,150,0.3)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#F4A896,#C96A3B)', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressLabel: { fontSize: '0.85rem', color: '#A07856', whiteSpace: 'nowrap' },
  questionCard: { background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 8px 40px rgba(201,106,59,0.1)', textAlign: 'center' },
  questionEmoji: { fontSize: '2.5rem', marginBottom: '1.2rem' },
  questionText: { fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#3B2A1A', lineHeight: 1.5, marginBottom: '1rem' },
  scaleHint: { fontSize: '0.85rem', color: '#A07856', marginBottom: '1.5rem' },
  scaleButtons: { display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' },
  scaleBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 16px', background: '#FAF6F1', border: '2px solid rgba(244,168,150,0.3)', borderRadius: '14px', cursor: 'pointer', minWidth: '70px', transition: 'all 0.2s', fontFamily: 'Nunito, sans-serif' },
  scaleBtnNum: { fontSize: '1.3rem', fontWeight: 700, color: '#C96A3B' },
  scaleBtnLabel: { fontSize: '0.72rem', color: '#6B4C35', fontWeight: 600 },
  backBtn: { background: 'none', border: 'none', color: '#A07856', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' },
  resultSection: { maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  loadingWrap: { textAlign: 'center', padding: '4rem' },
  loadingCircle: { fontSize: '3rem', animation: 'spin 2s linear infinite', display: 'inline-block' },
  loadingText: { color: '#6B4C35', marginTop: '1rem', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' },
  resultCard: { background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 8px 40px rgba(201,106,59,0.12)', textAlign: 'center' },
  stageEmoji: { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.2rem' },
  stageLabel: { fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#3B2A1A', marginBottom: '0.8rem' },
  stageMessage: { color: '#6B4C35', lineHeight: 1.7, fontSize: '1rem', marginBottom: '2rem', fontStyle: 'italic' },
  actionsSection: { textAlign: 'left', background: '#FAF6F1', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' },
  actionsTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#3B2A1A', marginBottom: '1rem' },
  actionsList: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  actionItem: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  actionIcon: { color: '#C96A3B', fontWeight: 700, marginTop: '2px', flexShrink: 0 },
  actionText: { color: '#6B4C35', fontSize: '0.92rem', lineHeight: 1.5 },
  resultCtas: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  resultBtn: { padding: '12px 24px', background: '#C96A3B', color: 'white', borderRadius: '25px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Nunito, sans-serif' },
  resultBtnOutline: { padding: '12px 24px', border: '2px solid #C96A3B', color: '#C96A3B', borderRadius: '25px', textDecoration: 'none', fontWeight: 600, fontFamily: 'Nunito, sans-serif' },
  journalCard: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(201,106,59,0.08)' },
  journalTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#3B2A1A', marginBottom: '0.4rem' },
  journalSub: { color: '#A07856', fontSize: '0.88rem', marginBottom: '1rem' },
  journalInput: { width: '100%', padding: '12px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '12px', fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: '#3B2A1A', background: '#FAF6F1', resize: 'none', outline: 'none', marginBottom: '0.8rem' },
  journalMoods: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  moodPill: { padding: '6px 12px', border: '1.5px solid rgba(244,168,150,0.4)', borderRadius: '20px', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s' },
  saveJournalBtn: { padding: '10px 22px', background: '#F7D97A', color: '#8B4513', border: 'none', borderRadius: '20px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' },
  savedMsg: { color: '#5CB85C', fontWeight: 600, fontSize: '0.9rem' },
  retakeBtn: { background: 'none', border: 'none', color: '#A07856', textDecoration: 'underline', fontFamily: 'Nunito, sans-serif', cursor: 'pointer', alignSelf: 'center', fontSize: '0.9rem' },
};

export default HealingJourney;
