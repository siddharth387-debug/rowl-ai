import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const BreathingCircle = () => {
  return (
    <div style={styles.breatheWrap}>
      <div style={styles.breatheOuter}>
        <div style={styles.breatheMiddle}>
          <div style={styles.breatheInner}>
            <span style={styles.breatheText}>breathe</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        @keyframes breathe2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.25); opacity: 0.8; }
        }
        @keyframes breathe3 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .breathe-outer { animation: breathe 6s ease-in-out infinite; }
        .breathe-middle { animation: breathe2 6s ease-in-out infinite; }
        .breathe-inner { animation: breathe3 6s ease-in-out infinite; }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-title { animation: floatUp 1s ease forwards; }
        .hero-sub { animation: floatUp 1s 0.3s ease forwards; opacity: 0; }
        .hero-ctas { animation: floatUp 1s 0.6s ease forwards; opacity: 0; }
        .module-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(201,106,59,0.18) !important; }
        .module-card { transition: all 0.3s ease !important; }
        .story-card:hover { transform: translateY(-3px); }
        .story-card { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

const modules = [
  { icon: '🌱', title: 'Healing Journey', desc: 'Assess your emotional wellbeing and get a personalized healing path crafted just for you.', link: '/healing', color: '#F4A896' },
  { icon: '💛', title: 'Community Circle', desc: 'Share your story, find your people, and offer warmth to others walking similar paths.', link: '/community', color: '#F7D97A' },
  { icon: '🤝', title: 'Talk to Sera', desc: 'Our empathetic AI companion listens without judgment, any hour you need a gentle presence.', link: '/chatbot', color: '#FAD4CB' },
  { icon: '📚', title: 'Resource Library', desc: 'Thoughtfully curated articles, exercises, and tools rooted in evidence-based psychology.', link: '/resources', color: '#FBF0C0' },
  { icon: '🗓', title: 'Meet a Therapist', desc: 'Connect with verified trauma-informed therapists who understand your unique journey.', link: '/appointments', color: '#F4A896' },
  { icon: '🌸', title: 'Mindful Journal', desc: 'Document your healing milestones, track moods, and celebrate every step forward.', link: '/healing', color: '#F7D97A' },
];

const stories = [
  { quote: "I came here shattered. Rowl helped me find my pieces again — gently, without rushing.", name: "Anjali S.", stage: "Now Thriving 🌻" },
  { quote: "The chatbot Sera was there at 3am when I had no one. That kind of care is rare.", name: "Rohan M.", stage: "Growing 🌿" },
  { quote: "Talking to a therapist through Rowl changed everything. I feel seen for the first time.", name: "Priya K.", stage: "Processing 💛" },
];

const Home = () => {
  return (
    <div style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div className="hero-title">
            <p style={styles.eyebrow}>A sanctuary for tender hearts 🌸</p>
            <h1 style={styles.heroTitle}>You Are Not<br /><span style={styles.heroAccent}>Broken.</span><br />You Are Healing.</h1>
          </div>
          <p className="hero-sub" style={styles.heroSub}>
            Rowl is a warm, AI-assisted mental wellness space for those navigating heartbreak, trauma, and PTSD.
            You deserve compassionate support — and it starts right here.
          </p>
          <div className="hero-ctas" style={styles.ctas}>
            <Link to="/healing" style={styles.primaryBtn}>Begin Your Journey 🌱</Link>
            <Link to="/chatbot" style={styles.secondaryBtn}>Talk to Sera Now</Link>
          </div>
        </div>
        <div style={styles.heroVisual}>
          <BreathingCircle />
        </div>
      </section>

      {/* MODULES */}
      <section style={styles.modulesSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Your Healing Sanctuary</h2>
          <p style={styles.sectionSub}>Six thoughtfully designed spaces, each one built with your heart in mind.</p>
        </div>
        <div style={styles.modulesGrid}>
          {modules.map((m, i) => (
            <Link to={m.link} key={i} className="module-card" style={{ ...styles.moduleCard, background: m.color + '33' }}>
              <div style={{ ...styles.moduleIconBg, background: m.color }}>
                <span style={styles.moduleIcon}>{m.icon}</span>
              </div>
              <h3 style={styles.moduleTitle}>{m.title}</h3>
              <p style={styles.moduleDesc}>{m.desc}</p>
              <span style={styles.moduleArrow}>Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* AFFIRMATION BANNER */}
      <section style={styles.affirmSection}>
        <div style={styles.affirmInner}>
          <h2 style={styles.affirmTitle}>"Healing is not a destination. It's a gentle unfolding."</h2>
          <p style={styles.affirmSub}>Every moment you choose to care for yourself is an act of profound courage.</p>
        </div>
      </section>

      {/* COMMUNITY STORIES */}
      <section style={styles.storiesSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Hearts That Found Light</h2>
          <p style={styles.sectionSub}>Real words from real people on their healing journeys.</p>
        </div>
        <div style={styles.storiesGrid}>
          {stories.map((s, i) => (
            <div key={i} className="story-card" style={styles.storyCard}>
              <div style={styles.storyQuoteIcon}>"</div>
              <p style={styles.storyQuote}>{s.quote}</p>
              <div style={styles.storyMeta}>
                <span style={styles.storyName}>{s.name}</span>
                <span style={styles.storyStage}>{s.stage}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER SECTION */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Take the First Step?</h2>
        <p style={styles.ctaSub}>You don't have to be okay right now. You just have to begin.</p>
        <div style={styles.ctaBtns}>
          <Link to="/register" style={styles.primaryBtn}>Create Your Safe Space 🌸</Link>
          <Link to="/chatbot" style={styles.secondaryBtn}>Just Talk, No Sign Up</Link>
        </div>
      </section>

      <style>{`
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(1.32); opacity: 1; } }
        @keyframes breathe2 { 0%, 100% { transform: scale(1); opacity: 0.35; } 50% { transform: scale(1.22); opacity: 0.85; } }
        @keyframes breathe3 { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      `}</style>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh' },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5rem 4rem 4rem', gap: '3rem', background: 'linear-gradient(135deg, #FAF6F1 0%, #FDF0E8 50%, #FAF6F1 100%)', flexWrap: 'wrap' },
  heroContent: { flex: 1, minWidth: '300px' },
  eyebrow: { fontSize: '1rem', color: '#C96A3B', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.5px' },
  heroTitle: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: 1.15, color: '#3B2A1A', marginBottom: '1.5rem' },
  heroAccent: { color: '#C96A3B', fontStyle: 'italic' },
  heroSub: { fontSize: '1.1rem', color: '#6B4C35', lineHeight: 1.7, maxWidth: '480px', marginBottom: '2.5rem' },
  ctas: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  primaryBtn: { padding: '14px 28px', background: '#C96A3B', color: 'white', borderRadius: '30px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-block', transition: 'transform 0.2s', boxShadow: '0 6px 20px rgba(201,106,59,0.3)' },
  secondaryBtn: { padding: '14px 28px', background: 'transparent', border: '2px solid #C96A3B', color: '#C96A3B', borderRadius: '30px', fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-block' },
  heroVisual: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '280px' },
  breatheWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  breatheOuter: { width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(244,168,150,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathe 6s ease-in-out infinite' },
  breatheMiddle: { width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(247,217,122,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathe2 6s ease-in-out infinite' },
  breatheInner: { width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, #F4A896, #C96A3B)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathe3 6s ease-in-out infinite', boxShadow: '0 8px 30px rgba(201,106,59,0.4)' },
  breatheText: { color: 'white', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 400, letterSpacing: '1px' },
  modulesSection: { padding: '5rem 4rem', background: '#FAF6F1' },
  sectionHeader: { textAlign: 'center', marginBottom: '3rem' },
  sectionTitle: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: '#3B2A1A', marginBottom: '0.8rem' },
  sectionSub: { color: '#6B4C35', fontSize: '1.05rem', lineHeight: 1.6 },
  modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  moduleCard: { padding: '2rem', borderRadius: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px solid rgba(201,106,59,0.1)' },
  moduleIconBg: { width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  moduleIcon: { fontSize: '1.5rem' },
  moduleTitle: { fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#3B2A1A' },
  moduleDesc: { color: '#6B4C35', fontSize: '0.92rem', lineHeight: 1.6, flex: 1 },
  moduleArrow: { color: '#C96A3B', fontWeight: 700, fontSize: '0.9rem' },
  affirmSection: { background: 'linear-gradient(135deg, #C96A3B, #8B4513)', padding: '4rem 2rem' },
  affirmInner: { maxWidth: '700px', margin: '0 auto', textAlign: 'center' },
  affirmTitle: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'white', marginBottom: '1rem', fontStyle: 'italic', fontWeight: 400 },
  affirmSub: { color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.6 },
  storiesSection: { padding: '5rem 4rem', background: '#FDF7F2' },
  storiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  storyCard: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(59,42,26,0.07)', border: '1px solid rgba(244,168,150,0.2)' },
  storyQuoteIcon: { fontFamily: 'Georgia, serif', fontSize: '3rem', color: '#F4A896', lineHeight: 1, marginBottom: '0.5rem' },
  storyQuote: { color: '#6B4C35', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' },
  storyMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  storyName: { fontWeight: 700, color: '#3B2A1A', fontSize: '0.9rem' },
  storyStage: { fontSize: '0.82rem', color: '#C96A3B', fontWeight: 600 },
  ctaSection: { padding: '5rem 4rem', textAlign: 'center', background: 'linear-gradient(180deg, #FAF6F1, #FDE8DC)' },
  ctaTitle: { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#3B2A1A', marginBottom: '1rem' },
  ctaSub: { color: '#6B4C35', fontSize: '1.05rem', marginBottom: '2rem' },
  ctaBtns: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
};

export default Home;
