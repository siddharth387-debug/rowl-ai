import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.inner}>
      <div style={styles.brand}>
        <span style={styles.logo}>🌸 Rowl AI</span>
        <p style={styles.tagline}>A sanctuary for tender hearts, built with love and science.</p>
        <p style={styles.crisis}>In crisis? Call <strong>iCall: 9152987821</strong> | <strong>Vandrevala Foundation: 1860-2662-345</strong></p>
      </div>
      <div style={styles.links}>
        <div style={styles.linkCol}>
          <h4 style={styles.colTitle}>Modules</h4>
          <Link to="/healing" style={styles.link}>🌱 Healing Journey</Link>
          <Link to="/community" style={styles.link}>💛 Community</Link>
          <Link to="/chatbot" style={styles.link}>🤝 Talk to Sera</Link>
          <Link to="/resources" style={styles.link}>📚 Resources</Link>
          <Link to="/appointments" style={styles.link}>🗓 Appointments</Link>
        </div>
        <div style={styles.linkCol}>
          <h4 style={styles.colTitle}>Support</h4>
        <span style={styles.link}>Privacy Policy</span>
       <span style={styles.link}>Terms of Use</span>
       <span style={styles.link}>Contact Us</span>
       <span style={styles.link}>About Rowl</span>
        </div>
      </div>
    </div>
    <div style={styles.bottom}>
      <p style={styles.disclaimer}>
        Rowl AI is a supportive wellness platform and does not provide medical diagnosis or crisis intervention.
        Always consult a licensed professional for clinical support.
      </p>
      <p style={styles.copy}>© 2024 Rowl AI · Made with 💛 and deep care</p>
    </div>
  </footer>
);

const styles = {
  footer: { background: '#3B2A1A', color: 'white', padding: '3rem 3rem 1.5rem' },
  inner: { display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '2rem' },
  brand: { flex: 2, minWidth: '220px' },
  logo: { fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', display: 'block', marginBottom: '0.8rem' },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.8rem' },
  crisis: { fontSize: '0.8rem', color: '#F4A896', lineHeight: 1.6, background: 'rgba(244,168,150,0.1)', padding: '8px 12px', borderRadius: '8px' },
  links: { flex: 3, display: 'flex', gap: '3rem', flexWrap: 'wrap' },
  linkCol: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  colTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#F4A896', marginBottom: '0.3rem' },
  link: { color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', textDecoration: 'none', transition: 'color 0.2s' },
  bottom: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center' },
  disclaimer: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem', lineHeight: 1.5 },
  copy: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' },
};

export default Footer;
