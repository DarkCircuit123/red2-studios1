// Enhanced click sound effect utility - more impressive
import { GlobalAudioManager } from './audio-manager';

export const playClickSound = () => {
  try {
    const manager = GlobalAudioManager.getInstance();
    
    // Check if audio is enabled
    if (!manager.isAudioEnabledState()) {
      return;
    }

    // Resume audio context if needed
    manager.resumeAudioContext().catch(() => {});

    const audioContext = manager.getAudioContext();
    if (!audioContext) {
      // Fallback: create new context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      playClickSoundWithContext(ctx);
    } else {
      playClickSoundWithContext(audioContext);
    }
  } catch (e) {
    console.warn('Click sound failed:', e);
  }
};

function playClickSoundWithContext(audioContext: AudioContext) {
  try {
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3; // Reduce volume for click
    masterGain.connect(audioContext.destination);
    
    // Main click tone
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(masterGain);
    
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
    gainNode2.connect(masterGain);
    
    oscillator2.frequency.value = 1350; // Hz - harmonic
    oscillator2.type = 'sine';
    gainNode2.gain.setValueAtTime(0.12, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.warn('Click sound synthesis failed:', e);
  }
}

// Short, sharp "ting" sound effect for hover
export const playHoverSound = () => {
  try {
    const manager = GlobalAudioManager.getInstance();
    
    // Check if audio is enabled
    if (!manager.isAudioEnabledState()) {
      return;
    }

    // Resume audio context if needed
    manager.resumeAudioContext().catch(() => {});

    const audioContext = manager.getAudioContext();
    if (!audioContext) {
      // Fallback: create new context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      playHoverSoundWithContext(ctx);
    } else {
      playHoverSoundWithContext(audioContext);
    }
  } catch (e) {
    console.warn('Hover sound failed:', e);
  }
};

function playHoverSoundWithContext(audioContext: AudioContext) {
  try {
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.2; // Reduce volume for hover
    masterGain.connect(audioContext.destination);
    
    // High-pitched ting tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 1200; // High frequency for "ting"
    
    // Very short and sharp attack/decay
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    console.warn('Hover sound synthesis failed:', e);
  }
}

