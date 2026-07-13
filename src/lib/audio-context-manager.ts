/**
 * Audio Context Lifecycle Manager
 * Handles browser autoplay policy compliance and context state management
 */

export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private resumeAttempts = 0;
  private maxResumeAttempts = 3;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.isInitialized = true;
      
      // Log initial state
      console.log('AudioContext initialized:', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate,
        baseLatency: (this.audioContext as any).baseLatency,
      });

      // Setup state change listener
      this.audioContext.addEventListener('statechange', () => {
        console.log('AudioContext state changed:', this.audioContext?.state);
      });
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
      this.isInitialized = false;
    }
  }

  /**
   * Get or create audio context
   */
  getAudioContext(): AudioContext | null {
    if (!this.audioContext && !this.isInitialized) {
      this.initialize();
    }
    return this.audioContext;
  }

  /**
   * Resume audio context with retry logic
   */
  async resume(): Promise<boolean> {
    if (!this.audioContext) {
      this.initialize();
    }

    if (!this.audioContext) {
      console.warn('AudioContext not available');
      return false;
    }

    if (this.audioContext.state === 'running') {
      return true;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
        this.resumeAttempts = 0;
        return true;
      } catch (e) {
        this.resumeAttempts++;
        console.warn(`Failed to resume AudioContext (attempt ${this.resumeAttempts}):`, e);
        
        // Retry if we haven't exceeded max attempts
        if (this.resumeAttempts < this.maxResumeAttempts) {
          return new Promise((resolve) => {
            setTimeout(() => {
              this.resume().then(resolve);
            }, 100 * this.resumeAttempts);
          });
        }
        
        return false;
      }
    }

    return true;
  }

  /**
   * Get audio context state
   */
  getState(): string {
    return this.audioContext?.state || 'unavailable';
  }

  /**
   * Check if audio context is ready
   */
  isReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  /**
   * Check if audio context is suspended
   */
  isSuspended(): boolean {
    return this.audioContext?.state === 'suspended';
  }

  /**
   * Get audio context info
   */
  getInfo() {
    if (!this.audioContext) {
      return null;
    }

    return {
      state: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
      baseLatency: (this.audioContext as any).baseLatency,
      outputLatency: (this.audioContext as any).outputLatency,
      currentTime: this.audioContext.currentTime,
      destination: this.audioContext.destination,
    };
  }

  /**
   * Create gain node
   */
  createGainNode(): GainNode | null {
    if (!this.audioContext) {
      return null;
    }
    return this.audioContext.createGain();
  }

  /**
   * Create oscillator
   */
  createOscillator(): OscillatorNode | null {
    if (!this.audioContext) {
      return null;
    }
    return this.audioContext.createOscillator();
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Get destination
   */
  getDestination(): AudioDestinationNode | null {
    return this.audioContext?.destination || null;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  AudioContextManager.getInstance();
}
