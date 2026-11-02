import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import{useChatSession} from '../hooks/useChatSession';
import { CrisisSupportBanner, ActionCardWidget, EmergencyCalmModal } from '../components/chat/ChatWidgets';

const moods = ['😔 Sad', '😰 Anxious', '😡 Angry', '😶 Numb', '🙂 Okay', '🌟 Good'];

const quickPrompts = [
  "I'm feeling overwhelmed right now",
  "I can't stop thinking about the past",
  "I feel so alone and broken",
  "I'm having trouble sleeping",
  "I need someone to talk to",
  "I want to understand my trauma",
];

const Chatbot = () => {
  const { user } = useAuth();
 const[input,setInput]=useState('');
 const messagesEnd=useRef(null);
  const {
    messages,
    loading,
    crisisActive,
    setCrisisActive,
    calmModeOpen,
    setCalmModeOpen,
    sosStatus,
    setSelectedMood,
    showMoods,
    sendMessage,
    startNewSession,
  } = useChatSession(user);
 
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const handleSend=(text)=>{
  const msg=text || input;
  if(!msg.trim())return;
  if(!text)setInput('');
  sendMessage(msg);
 };
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    sendMessage(`I'm feeling ${mood} today`,mood);
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.seraAvatar}>🌸</div>
        <div>
          <h2 style={styles.seraName}>Sera</h2>
          <div style={styles.seraStatus}><span style={styles.statusDot}></span> Always here for you</div>
        </div>
        <div style={styles.headerBadge}>AI Companion · Confidential</div>
        <button onClick={startNewSession} style={styles.newChatBtn}>New Chat  ↺</button>
      </div>
      {crisisActive && <CrisisSupportBanner onDismiss={()=>setCrisisActive(false)} userName={user?.name} />}
      <EmergencyCalmModal
        isOpen={calmModeOpen}
        userName={user?.name}
        sosStatus={sosStatus}
        emergencyContact={user?.emergencyContact}
        onClose={() => setCalmModeOpen(false)}
      />

      <div style={styles.chatArea}>
        {/* Mood selector */}
        {showMoods && (
          <div style={styles.moodSection}>
            <p style={styles.moodPrompt}>How are you feeling right now?</p>
            <div style={styles.moodGrid}>
              {moods.map(m => (
                <button key={m} onClick={() => handleMoodSelect(m)} style={styles.moodBtn}>{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.messageRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.sender === 'ai' && <div style={styles.aiBubbleIcon}>🌸</div>}
              <div style={{ ...styles.bubble, ...(msg.sender === 'user' ? styles.userBubble : styles.aiBubble) }}>
                <p style={styles.bubbleText}>{msg.message}</p>
                {msg.sender === 'ai' && msg.actionCard && <ActionCardWidget card={msg.actionCard}/>}
                <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
              <div style={styles.aiBubbleIcon}>🌸</div>
              <div style={styles.aiBubble}>
                <div style={styles.typingDots}>
                  <span style={styles.dot}></span><span style={styles.dot}></span><span style={styles.dot}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>
      </div>

      {/* Quick prompts */}
      <div style={styles.quickSection}>
        <div style={styles.quickScroll}>
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => handleSend(p)} style={styles.quickBtn}>{p}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Share what's in your heart..."
        />
        <button style={styles.sendBtn} onClick={() => handleSend()} disabled={loading}>
          {loading ? '...' : '💛'}
        </button>
      </div>

      <p style={styles.disclaimer}>Sera is an AI companion, not a licensed therapist. In crisis, please call iCall: 9152987821</p>

      <style>{`
        @keyframes blink { 0%,80%,100% { opacity:0 } 40% { opacity:1 } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#FAF6F1', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 1.5rem', background: 'white', borderBottom: '1px solid rgba(244,168,150,0.2)', boxShadow: '0 2px 10px rgba(201,106,59,0.06)' },
  seraAvatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 },
  seraName: { fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#3B2A1A' },
  seraStatus: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#6B4C35' },
  statusDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#5CB85C', display: 'inline-block' },
  headerBadge: { marginLeft: 'auto', fontSize: '0.75rem', background: '#FBF0C0', color: '#8B4513', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 },
  newChatBtn: { padding: '5px 12px', background: '#FAF6F1', border: '1px solid rgba(201,106,59,0.35)', borderRadius: '16px', fontSize: '0.75rem', color: '#6B4C35', fontWeight: 600, cursor: 'pointer' },
  chatArea: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  moodSection: { padding: '1.5rem', textAlign: 'center', background: 'rgba(247,217,122,0.15)', borderBottom: '1px solid rgba(247,217,122,0.3)' },
  moodPrompt: { fontFamily: 'Playfair Display, serif', color: '#3B2A1A', marginBottom: '0.8rem', fontSize: '1rem' },
  moodGrid: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' },
  moodBtn: { padding: '8px 14px', background: 'white', border: '1.5px solid rgba(244,168,150,0.5)', borderRadius: '20px', color: '#3B2A1A', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
  messages: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px', animation: 'fadeIn 0.3s ease' },
  aiBubbleIcon: { fontSize: '1.2rem', flexShrink: 0 },
  bubble: { maxWidth: '72%', padding: '0.9rem 1.2rem', borderRadius: '18px', position: 'relative' },
  aiBubble: { background: 'white', borderBottomLeftRadius: '4px', boxShadow: '0 2px 12px rgba(59,42,26,0.08)', border: '1px solid rgba(244,168,150,0.2)' },
  userBubble: { background: 'linear-gradient(135deg,#C96A3B,#8B4513)', color: 'white', borderBottomRightRadius: '4px' },
  bubbleText: { fontSize: '0.95rem', lineHeight: 1.6, color: 'inherit' },
  timestamp: { fontSize: '0.7rem', opacity: 0.5, display: 'block', textAlign: 'right', marginTop: '4px' },
  typingDots: { display: 'flex', gap: '4px', padding: '4px 0' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: '#F4A896', animation: 'blink 1.4s infinite both', animationDelay: '0s' },
  quickSection: { padding: '0.6rem 1rem', background: 'rgba(244,168,150,0.1)', borderTop: '1px solid rgba(244,168,150,0.2)' },
  quickScroll: { display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' },
  quickBtn: { whiteSpace: 'nowrap', padding: '6px 12px', background: 'white', border: '1.5px solid rgba(244,168,150,0.5)', borderRadius: '20px', color: '#6B4C35', fontFamily: 'Nunito, sans-serif', fontSize: '0.8rem', cursor: 'pointer' },
  inputArea: { display: 'flex', gap: '0.8rem', padding: '1rem 1.2rem', background: 'white', borderTop: '1px solid rgba(244,168,150,0.2)', alignItems: 'center' },
  input: { flex: 1, padding: '12px 18px', borderRadius: '25px', border: '2px solid rgba(244,168,150,0.4)', fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', background: '#FAF6F1', color: '#3B2A1A', outline: 'none' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#F4A896,#C96A3B)', border: 'none', fontSize: '1.3rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,106,59,0.3)' },
  disclaimer: { textAlign: 'center', fontSize: '0.72rem', color: '#A07856', padding: '6px', background: '#FAF6F1' },
};

export default Chatbot;
