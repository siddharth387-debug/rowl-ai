import React from 'react';
import { Link } from 'react-router-dom';
import {
  speakCalmingVoice,
  stopCalmingVoice,
  triggerCalmingHeartbeat,
} from '../../utils/sensoryCalm';

export const CrisisSupportBanner = ({ onDismiss, userName }) => (
  <div style={styles.crisisBanner} role="alert">
    <div style={styles.crisisTop}>
      <span style={styles.crisisBadge}>🚨 Immediate Support Available</span>
      {onDismiss && (
        <button onClick={onDismiss} style={styles.dismissBtn} aria-label="Dismiss banner">
          ✕
        </button>
      )}
    </div>
    <p style={styles.crisisText}>
      You don't have to carry this pain alone right now. Please connect with a trained, caring human immediately:
    </p>
    <div style={styles.helplineRow}>
      <a href="tel:9152987821" style={styles.callBtn}>
        📞 Call iCall (9152987821)
      </a>
      <a href="tel:18602662345" style={styles.callBtnSecondary}>
        📞 Vandrevala (1860-2662-345)
      </a>
      <button
        type="button"
        onClick={() => {
          triggerCalmingHeartbeat();
          speakCalmingVoice(userName);
        }}
        style={styles.voiceBtnInline}
      >
        🔊 Hear Sera's Calm Voice
      </button>
    </div>
  </div>
);

export const EmergencyCalmModal = ({ isOpen, userName, sosStatus, emergencyContact, onClose }) => {
  if (!isOpen) return null;

  const contactName = sosStatus?.contactName || emergencyContact?.name || '';
  const contactPhone = sosStatus?.contactPhone || emergencyContact?.phone || '';
  const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

  return (
    <div style={modalStyles.overlay} role="dialog" aria-modal="true">
      <div style={modalStyles.card}>
        <div style={modalStyles.pulseCircle}>🌸</div>
        <h2 style={modalStyles.title}>Pause With Me Right Now</h2>
        <p style={modalStyles.subtitle}>
          You have been carrying so much pain today. Let's pause everything for 30 seconds, feel your feet on the floor, and breathe together.
        </p>

        {contactName && (
          <div style={modalStyles.sosDispatchedBadge}>
            🚨 Automatic SOS Check-In Alert triggered for your Trusted Contact: <strong>{contactName}</strong>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            triggerCalmingHeartbeat();
            speakCalmingVoice(userName);
          }}
          style={modalStyles.voiceBtn}
        >
          🔊 Replay Calming Voice & Heartbeat Pulse
        </button>

        <div style={modalStyles.emergencyActions}>
          {cleanPhone && (
            <>
              <a href={`tel:${cleanPhone}`} style={modalStyles.trustedBtn}>
                💛 Call {contactName || 'Trusted Contact'} ({contactPhone})
              </a>
              <a
                href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent("Hey, I'm going through a really overwhelming moment right now and could really use your support.")}`}
                target="_blank"
                rel="noreferrer"
                style={modalStyles.whatsappBtn}
              >
                💬 Send 1-Tap WhatsApp SOS to {contactName || 'Trusted Contact'}
              </a>
            </>
          )}
          <a href="tel:9152987821" style={modalStyles.sosBtn}>
            🚨 Call iCall Helpline (9152987821)
          </a>
          <a href="tel:112" style={modalStyles.sosSecondaryBtn}>
            📞 Call 112 Emergency Services
          </a>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCalmingVoice();
            onClose();
          }}
          style={modalStyles.closeBtn}
        >
          I am calmer now — return to chat
        </button>
      </div>
    </div>
  );
};

export const ActionCardWidget = ({ card }) => {
  if (!card || !card.title) return null;

  return (
    <div style={styles.actionCard}>
      <div style={styles.actionTitle}>{card.title}</div>
      {card.description && <p style={styles.actionDesc}>{card.description}</p>}
      <Link to={card.link || '/resources'} style={styles.actionCta}>
        {card.ctaText || 'Explore →'}
      </Link>
    </div>
  );
};

const styles = {
  crisisBanner: {
    background: '#FFF5F2',
    borderBottom: '2px solid #E26D5C',
    padding: '0.9rem 1.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  crisisTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crisisBadge: {
    fontWeight: 700,
    fontSize: '0.84rem',
    color: '#A63A2B',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: '#A07856',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  crisisText: {
    fontSize: '0.86rem',
    color: '#3B2A1A',
    lineHeight: 1.45,
  },
  helplineRow: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    marginTop: '0.2rem',
  },
  callBtn: {
    padding: '7px 14px',
    background: '#C96A3B',
    color: 'white',
    borderRadius: '18px',
    fontSize: '0.82rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
  callBtnSecondary: {
    padding: '7px 14px',
    background: 'white',
    color: '#8B4513',
    border: '1.5px solid #C96A3B',
    borderRadius: '18px',
    fontSize: '0.82rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
  voiceBtnInline: {
    padding: '7px 14px',
    background: '#FBF0C0',
    color: '#8B4513',
    border: '1.5px solid #C96A3B',
    borderRadius: '18px',
    fontSize: '0.82rem',
    fontWeight: 700,
    fontFamily: 'Nunito, sans-serif',
    cursor: 'pointer',
  },
  actionCard: {
    marginTop: '0.75rem',
    padding: '0.85rem 1rem',
    background: '#FAF6F1',
    borderRadius: '12px',
    borderLeft: '3.5px solid #C96A3B',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  actionTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
    fontSize: '0.92rem',
    color: '#3B2A1A',
  },
  actionDesc: {
    fontSize: '0.82rem',
    color: '#6B4C35',
    lineHeight: 1.45,
  },
  actionCta: {
    alignSelf: 'flex-start',
    marginTop: '0.2rem',
    padding: '6px 14px',
    background: '#C96A3B',
    color: 'white',
    borderRadius: '16px',
    fontSize: '0.78rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(59, 42, 26, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1.5rem',
  },
  card: {
    background: '#FAF6F1',
    borderRadius: '28px',
    padding: '2.5rem 2rem',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    border: '2px solid #F4A896',
  },
  pulseCircle: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #F4A896, #C96A3B)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.4rem',
    margin: '0 auto 1.2rem',
    boxShadow: '0 8px 25px rgba(201,106,59,0.4)',
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '1.6rem',
    color: '#3B2A1A',
    marginBottom: '0.6rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6B4C35',
    lineHeight: 1.6,
    marginBottom: '1.4rem',
  },
  voiceBtn: {
    width: '100%',
    padding: '12px',
    background: '#FBF0C0',
    color: '#8B4513',
    border: '1.5px solid #C96A3B',
    borderRadius: '20px',
    fontFamily: 'Nunito, sans-serif',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  emergencyActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginBottom: '1.2rem',
  },
  sosDispatchedBadge: {
    background: '#FFF5F2',
    border: '1.5px solid #E26D5C',
    color: '#A63A2B',
    padding: '8px 12px',
    borderRadius: '12px',
    fontSize: '0.82rem',
    marginBottom: '0.9rem',
    lineHeight: 1.4,
  },
  trustedBtn: {
    padding: '12px',
    background: '#3B2A1A',
    color: 'white',
    borderRadius: '22px',
    fontWeight: 700,
    fontSize: '0.92rem',
    textDecoration: 'none',
  },
  whatsappBtn: {
    padding: '11px',
    background: '#E8F8EE',
    color: '#1E6F43',
    border: '1.5px solid #25D366',
    borderRadius: '22px',
    fontWeight: 700,
    fontSize: '0.86rem',
    textDecoration: 'none',
  },
  sosBtn: {
    padding: '13px',
    background: '#C96A3B',
    color: 'white',
    borderRadius: '22px',
    fontWeight: 700,
    fontSize: '0.95rem',
    textDecoration: 'none',
  },
  sosSecondaryBtn: {
    padding: '11px',
    background: 'white',
    color: '#A63A2B',
    border: '1.5px solid #E26D5C',
    borderRadius: '22px',
    fontWeight: 700,
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#A07856',
    textDecoration: 'underline',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
