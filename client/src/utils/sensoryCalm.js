/**
 * Plays a gentle 432Hz + 528Hz harmonic calming chime using the Browser Web Audio API.
 * Works on both laptops and phones without external audio files.
 */
export const playCalmingChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [432, 528].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.25);

      gain.gain.setValueAtTime(0.001, now + idx * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.25 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.25 + 2.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.25);
      osc.stop(now + idx * 0.25 + 2.9);
    });
  } catch {
    // Ignore if audio context is blocked
  }
};

export const speakCalmingVoice = (userName = '') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  playCalmingChime();
  window.speechSynthesis.cancel();

  const firstName = userName ? `${userName.split(' ')[0]}, ` : '';
  const script = `${firstName}please pause with me for just a moment. Drop your shoulders. Feel your feet on the floor. You are safe in this exact moment. Breathe in slowly with me... one, two, three, four. Hold gently. And slowly let it out. You matter deeply, and I am right here with you.`;

  const utterance = new SpeechSynthesisUtterance(script);
  utterance.rate = 0.82;
  utterance.pitch = 1.05;

  // Pick a warm natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Female'))
  );
  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
};

export const stopCalmingVoice = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const triggerCalmingHeartbeat = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([
      200, 150, 200, 1200,
      200, 150, 200, 1200,
      200, 150, 200, 1200,
      200, 150, 200,
    ]);
  }
};
