// Click sound effect utility
export const playClickSound = () => {
  // Create a simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // Hz
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

// Hover sound effect utility - short and pleasant
export const playHoverSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Hz - pleasant mid-high tone
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime); // Subtle volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03); // Very short duration

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.03);
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

