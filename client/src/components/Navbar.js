import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/', label: '🏠 Home' },
    { to: '/healing', label: '🌱 Healing Journey' },
    { to: '/community', label: '💛 Community' },
    { to: '/chatbot', label: '🤝 Talk to Sera' },
    { to: '/resources', label: '📚 Resources' },
    { to: '/appointments', label: '🗓 Appointments' },
  ];

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        <span style={styles.logoIcon}>🌸</span>
        <span style={styles.logoText}>Rowl <span style={styles.logoAi}>AI</span></span>
      </Link>

      <div style={styles.links}>
        {navLinks.map(l => (
          <Link key={l.to} to={l.to} style={styles.link}>{l.label}</Link>
        ))}
      </div>

      <div style={styles.actions}>
        {user ? (
          <div style={styles.userArea}>
            <span style={styles.greeting}>Hi, {user.name?.split(' ')[0]} 🌿</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
          </div>
        ) : (
          <div style={styles.authBtns}>
            <Link to="/login" style={styles.loginBtn}>Sign In</Link>
            <Link to="/register" style={styles.registerBtn}>Join Us 🌸</Link>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <button style={styles.burger} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={styles.mobileLink} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          {user ? (
            <button onClick={handleLogout} style={styles.mobileLogout}>Sign Out</button>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Join Us 🌸</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: '70px', background: 'rgba(250,246,241,0.96)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 20px rgba(201,106,59,0.10)', position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  logoIcon: { fontSize: '1.8rem' },
  logoText: { fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#3B2A1A' },
  logoAi: { color: '#C96A3B' },
  links: { display: 'flex', gap: '0.2rem', '@media(maxWidth:768px)': { display: 'none' } },
  link: { padding: '6px 10px', borderRadius: '8px', color: '#6B4C35', fontWeight: 500, fontSize: '0.85rem', transition: 'all 0.2s', textDecoration: 'none', whiteSpace: 'nowrap' },
  actions: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userArea: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  greeting: { fontSize: '0.9rem', color: '#C96A3B', fontWeight: 600 },
  logoutBtn: { padding: '6px 14px', background: 'transparent', border: '1.5px solid #C96A3B', color: '#C96A3B', borderRadius: '20px', fontSize: '0.85rem', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  authBtns: { display: 'flex', gap: '8px' },
  loginBtn: { padding: '6px 14px', background: 'transparent', border: '1.5px solid #C96A3B', color: '#C96A3B', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none' },
  registerBtn: { padding: '6px 16px', background: '#C96A3B', color: 'white', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 },
  burger: { display: 'none', background: 'none', border: 'none', fontSize: '1.5rem', color: '#3B2A1A', cursor: 'pointer' },
  mobileMenu: { display: 'none', position: 'absolute', top: '70px', left: 0, right: 0, background: '#FAF6F1', padding: '1rem', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
  mobileLink: { padding: '10px', color: '#3B2A1A', textDecoration: 'none', fontWeight: 500 },
  mobileLogout: { padding: '10px', background: 'none', border: 'none', color: '#C96A3B', fontWeight: 600, textAlign: 'left', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
};

export default Navbar;
