/**
 * Global Audio Manager
 * Handles audio context lifecycle, autoplay policy compliance, and sound toggle
 */

export class GlobalAudioManager {
  private static instance: GlobalAudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isAudioEnabled = true;
  private hasUserInteracted = false;
  private soundToggleCallbacks: Set<(enabled: boolean) => void> = new Set();

  private constructor() {
    this.initializeAudioContext();
    this.setupUserInteractionListeners();
    this.loadAudioPreference();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  /**
   * Initialize audio context
   */
  private initializeAudioContext() {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.isAudioEnabled ? 1 : 0;
      this.masterGain.connect(this.audioContext.destination);
      
      console.log('AudioContext initialized:', this.audioContext.state);
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
    }
  }

  /**
   * Setup user interaction listeners
   */
  private setupUserInteractionListeners() {
    if (typeof window === 'undefined') return;

    const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
    
    const handleInteraction = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;
        this.resumeAudioContext();
        
        // Remove listeners after first interaction
        events.forEach(event => {
          document.removeEventListener(event, handleInteraction);
        });
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });
  }

  /**
   * Resume audio context
   */
  async resumeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }
  }

  /**
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get master gain node
   */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio(): boolean {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.updateMasterGain();
    this.saveAudioPreference();
    this.notifyCallbacks();
    return this.isAudioEnabled;
  }

  /**
   * Set audio enabled state
   */
  setAudioEnabled(enabled: boolean): void {
    if (this.isAudioEnabled !== enabled) {
      this.isAudioEnabled = enabled;
      this.updateMasterGain();
      this.saveAudioPreference();
      this.notifyCallbacks();
    }
  }

  /**
   * Get audio enabled state
   */
  isAudioEnabledState(): boolean {
    return this.isAudioEnabled;
  }

  /**
   * Update master gain based on audio enabled state
   */
  private updateMasterGain(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.isAudioEnabled ? 1 : 0;
    }
  }

  /**
   * Save audio preference to localStorage
   */
  private saveAudioPreference(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('audio-enabled', JSON.stringify(this.isAudioEnabled));
    }
  }

  /**
   * Load audio preference from localStorage
   */
  private loadAudioPreference(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('audio-enabled');
      if (saved !== null) {
        this.isAudioEnabled = JSON.parse(saved);
      }
    }
  }

  /**
   * Subscribe to audio toggle changes
   */
  onAudioToggle(callback: (enabled: boolean) => void): () => void {
    this.soundToggleCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.soundToggleCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of audio toggle
   */
  private notifyCallbacks(): void {
    this.soundToggleCallbacks.forEach(callback => {
      callback(this.isAudioEnabled);
    });
  }

  /**
   * Get audio context state
   */
  getAudioContextState(): string {
    return this.audioContext?.state || 'unavailable';
  }

  /**
   * Check if audio context is ready
   */
  isAudioContextReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  /**
   * Check if user has interacted
   */
  hasUserInteractedWithPage(): boolean {
    return this.hasUserInteracted;
  }

  /**
   * Mute all audio
   */
  muteAll(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  /**
   * Unmute all audio
   */
  unmuteAll(): void {
    if (this.masterGain && this.isAudioEnabled) {
      this.masterGain.gain.value = 1;
    }
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterGain?.gain.value || 0;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  GlobalAudioManager.getInstance();
}
