export const speakCalmingVoice = (userName = '') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const firstName = userName ? `${userName.split(' ')[0]}, ` : '';
  const script = `${firstName}please pause with me for just a moment. Drop your shoulders. Feel your feet on the floor. You are safe in this exact moment. Breathe in slowly with me... one, two, three, four. Hold gently. And slowly let it out. You matter deeply, and I am right here with you.`;

  const utterance = new SpeechSynthesisUtterance(script);
  utterance.rate = 0.82;
  utterance.pitch = 1.05;

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
