/**
 * Click sound effect utility with audio context unlock pattern
 * Safe to call anywhere - silently no-ops until audio is unlocked
 */

let audioContextInstance: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Initialize audio context on first user gesture
 */
function initializeAudioContext() {
  if (isAudioUnlocked || audioContextInstance?.state === 'running') {
    return;
  }

  try {
    if (!audioContextInstance) {
      audioContextInstance = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (audioContextInstance.state === 'suspended') {
      audioContextInstance.resume().then(() => {
        isAudioUnlocked = true;
      });
    } else {
      isAudioUnlocked = true;
    }
  } catch (err) {
    console.error('[click-sound] Failed to initialize audio context:', err);
  }
}

/**
 * Attach one-time listeners for audio unlock
 */
function attachAudioUnlockListeners() {
  const handleGesture = () => {
    initializeAudioContext();
    document.removeEventListener('click', handleGesture);
    document.removeEventListener('keydown', handleGesture);
  };

  document.addEventListener('click', handleGesture);
  document.addEventListener('keydown', handleGesture);
}

// Initialize listeners on module load
if (typeof window !== 'undefined') {
  attachAudioUnlockListeners();
}

/**
 * Play click sound - safe to call anywhere
 */
export const playClickSound = () => {
  try {
    if (!isAudioUnlocked || !audioContextInstance) {
      return;
    }

    const ctx = audioContextInstance;

    // Main click tone
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);

    oscillator1.frequency.value = 900; // Hz
    oscillator1.type = 'sine';
    gainNode1.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.12);

    // Secondary harmonic for richness
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.frequency.value = 1350; // Hz - harmonic
    oscillator2.type = 'sine';
    gainNode2.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.1);
  } catch (err) {
    console.error('[click-sound] Failed to play click sound:', err);
  }
};

/**
 * Play hover sound - safe to call anywhere
 */
export const playHoverSound = () => {
  try {
    if (!isAudioUnlocked || !audioContextInstance) {
      return;
    }

    const ctx = audioContextInstance;

    // High-pitched ting tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = 1200; // High frequency for "ting"

    // Very short and sharp attack/decay
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (err) {
    console.error('[click-sound] Failed to play hover sound:', err);
  }
};

