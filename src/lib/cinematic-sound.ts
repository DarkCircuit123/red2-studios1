/**
 * Cinematic Sound Design Engine
 * Premium audio synthesis for RED² Studios production logo
 * Creates a deep, orchestral, minimal cinematic experience
 */

interface SoundLayer {
  frequency: number;
  duration: number;
  delay: number;
  type: 'sine' | 'square' | 'triangle' | 'sawtooth';
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export class CinematicSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.12; // Subtle volume level
      this.masterGain.connect(this.audioContext.destination);
      
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  public async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Failed to resume audio context:', e);
      }
    }
  }

  private playOscillator(layer: SoundLayer) {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    setTimeout(() => {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Connect audio graph
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain!);

        // Configure oscillator
        oscillator.type = layer.type;
        oscillator.frequency.value = layer.frequency;

        // Configure filter for warmth
        filter.type = 'lowpass';
        filter.frequency.value = 8000;
        filter.Q.value = 1;

        // Volume envelope
        const fadeInTime = layer.fadeIn || 0.05;
        const fadeOutTime = layer.fadeOut || 0.1;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(layer.volume, now + fadeInTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + layer.duration - fadeOutTime);

        oscillator.start(now);
        oscillator.stop(now + layer.duration);
      } catch (e) {
        console.warn('Oscillator playback error:', e);
      }
    }, layer.delay);
  }

  /**
   * Play the complete RED² Studios cinematic intro sound
   * ~4 second orchestral composition with minimal, premium aesthetic
   */
  public playIntroSound() {
    if (!this.isInitialized) {
      this.initializeAudioContext();
    }

    // PHASE 1: Deep Rising Whoosh (0.3s - 1.0s)
    // Multi-layered frequency sweep creating depth
    this.playOscillator({
      frequency: 200,
      duration: 0.7,
      delay: 300,
      type: 'sine',
      volume: 0.18,
      fadeIn: 0.1,
      fadeOut: 0.2,
    });

    this.playOscillator({
      frequency: 140,
      duration: 0.7,
      delay: 320,
      type: 'sine',
      volume: 0.15,
      fadeIn: 0.12,
      fadeOut: 0.25,
    });

    this.playOscillator({
      frequency: 100,
      duration: 0.7,
      delay: 340,
      type: 'sine',
      volume: 0.12,
      fadeIn: 0.15,
      fadeOut: 0.3,
    });

    // PHASE 2: Low Orchestral Drone Foundation (1.0s - 2.0s)
    // Deep bass providing stability and gravitas
    this.playOscillator({
      frequency: 55,
      duration: 1.0,
      delay: 1000,
      type: 'sine',
      volume: 0.14,
      fadeIn: 0.2,
      fadeOut: 0.3,
    });

    this.playOscillator({
      frequency: 82.4, // E1 - harmonic root
      duration: 1.0,
      delay: 1020,
      type: 'sine',
      volume: 0.12,
      fadeIn: 0.22,
      fadeOut: 0.32,
    });

    // PHASE 3: Metallic Shimmer Accent (1.5s - 2.2s)
    // High-frequency crystalline texture
    this.playOscillator({
      frequency: 440, // A4
      duration: 0.7,
      delay: 1500,
      type: 'sine',
      volume: 0.08,
      fadeIn: 0.05,
      fadeOut: 0.15,
    });

    this.playOscillator({
      frequency: 660, // E5
      duration: 0.6,
      delay: 1520,
      type: 'sine',
      volume: 0.07,
      fadeIn: 0.06,
      fadeOut: 0.18,
    });

    this.playOscillator({
      frequency: 880, // A5
      duration: 0.5,
      delay: 1540,
      type: 'sine',
      volume: 0.06,
      fadeIn: 0.08,
      fadeOut: 0.2,
    });

    // PHASE 4: Cinematic Impact Hit (2.0s - 2.6s)
    // Powerful mid-range punch with harmonic richness
    this.playOscillator({
      frequency: 110, // A2
      duration: 0.6,
      delay: 2000,
      type: 'sine',
      volume: 0.16,
      fadeIn: 0.08,
      fadeOut: 0.25,
    });

    this.playOscillator({
      frequency: 165, // E3
      duration: 0.55,
      delay: 2020,
      type: 'sine',
      volume: 0.14,
      fadeIn: 0.1,
      fadeOut: 0.27,
    });

    this.playOscillator({
      frequency: 220, // A3
      duration: 0.5,
      delay: 2040,
      type: 'sine',
      volume: 0.12,
      fadeIn: 0.12,
      fadeOut: 0.3,
    });

    // PHASE 5: Harmonic Resonance Build (2.3s - 3.2s)
    // Layered harmonic series creating richness
    this.playOscillator({
      frequency: 110,
      duration: 0.9,
      delay: 2300,
      type: 'sine',
      volume: 0.13,
      fadeIn: 0.15,
      fadeOut: 0.35,
    });

    this.playOscillator({
      frequency: 220,
      duration: 0.85,
      delay: 2320,
      type: 'sine',
      volume: 0.11,
      fadeIn: 0.17,
      fadeOut: 0.37,
    });

    this.playOscillator({
      frequency: 330, // E4
      duration: 0.8,
      delay: 2340,
      type: 'sine',
      volume: 0.09,
      fadeIn: 0.19,
      fadeOut: 0.4,
    });

    // PHASE 6: Ethereal Sustain (2.8s - 4.0s)
    // Long, fading harmonic pad for cinematic closure
    this.playOscillator({
      frequency: 82.4,
      duration: 1.2,
      delay: 2800,
      type: 'sine',
      volume: 0.1,
      fadeIn: 0.2,
      fadeOut: 0.5,
    });

    this.playOscillator({
      frequency: 123.47, // B1
      duration: 1.15,
      delay: 2820,
      type: 'sine',
      volume: 0.09,
      fadeIn: 0.22,
      fadeOut: 0.52,
    });

    this.playOscillator({
      frequency: 164.81, // E3
      duration: 1.1,
      delay: 2840,
      type: 'sine',
      volume: 0.08,
      fadeIn: 0.24,
      fadeOut: 0.55,
    });

    // PHASE 7: Final Cinematic Swell (3.3s - 4.2s)
    // Climactic moment with full harmonic spectrum
    this.playOscillator({
      frequency: 55,
      duration: 0.9,
      delay: 3300,
      type: 'sine',
      volume: 0.15,
      fadeIn: 0.1,
      fadeOut: 0.4,
    });

    this.playOscillator({
      frequency: 110,
      duration: 0.85,
      delay: 3320,
      type: 'sine',
      volume: 0.13,
      fadeIn: 0.12,
      fadeOut: 0.42,
    });

    this.playOscillator({
      frequency: 220,
      duration: 0.8,
      delay: 3340,
      type: 'sine',
      volume: 0.11,
      fadeIn: 0.14,
      fadeOut: 0.45,
    });

    this.playOscillator({
      frequency: 330,
      duration: 0.75,
      delay: 3360,
      type: 'sine',
      volume: 0.09,
      fadeIn: 0.16,
      fadeOut: 0.48,
    });

    // PHASE 8: Harmonic Fade to Silence (3.8s - 4.5s)
    // Gentle resolution with lingering resonance
    this.playOscillator({
      frequency: 82.4,
      duration: 1.3,
      delay: 3800,
      type: 'sine',
      volume: 0.08,
      fadeIn: 0.25,
      fadeOut: 0.6,
    });

    this.playOscillator({
      frequency: 164.81,
      duration: 1.25,
      delay: 3820,
      type: 'sine',
      volume: 0.07,
      fadeIn: 0.27,
      fadeOut: 0.62,
    });

    this.playOscillator({
      frequency: 246.94, // B3
      duration: 1.2,
      delay: 3840,
      type: 'sine',
      volume: 0.06,
      fadeIn: 0.29,
      fadeOut: 0.65,
    });
  }

  /**
   * Set master volume (0.0 - 1.0)
   */
  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Stop all audio playback
   */
  public stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let soundEngineInstance: CinematicSoundEngine | null = null;

export function getCinematicSoundEngine(): CinematicSoundEngine {
  if (!soundEngineInstance) {
    soundEngineInstance = new CinematicSoundEngine();
  }
  return soundEngineInstance;
}
