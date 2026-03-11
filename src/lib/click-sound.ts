// Enhanced click sound effect utility - more impressive
export const playClickSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Main click tone
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.value = 900; // Hz
    oscillator1.type = 'sine';
    gainNode1.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.12);
    
    // Secondary harmonic for richness
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.frequency.value = 1350; // Hz - harmonic
    oscillator2.type = 'sine';
    gainNode2.gain.setValueAtTime(0.12, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

// Enhanced hover sound effect utility - professional and deep
export const playHoverSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Deep bass foundation
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    
    // Deep frequency sweep - more professional
    oscillator1.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(280, audioContext.currentTime + 0.12);
    
    gainNode1.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.12);
    
    // Mid-range harmonic for richness
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.type = 'sine';
    
    // Mid-range sweep
    oscillator2.frequency.setValueAtTime(420, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(560, audioContext.currentTime + 0.12);
    
    gainNode2.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.12);
  } catch (e) {
    // Silently fail if audio context is not available
  }
};

