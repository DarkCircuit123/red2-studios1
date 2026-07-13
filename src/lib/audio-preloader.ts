/**
 * Audio Preloader & Optimizer
 * Ensures background music loads and plays correctly with fallbacks
 */

export class AudioPreloader {
  private static audioCache = new Map<string, HTMLAudioElement>();
  private static preloadedTracks: Set<string> = new Set();

  /**
   * Preload audio file
   */
  static preloadAudio(url: string, id: string = url): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.audioCache.has(id)) {
        resolve(this.audioCache.get(id)!);
        return;
      }

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        this.audioCache.set(id, audio);
        this.preloadedTracks.add(id);
        resolve(audio);
      };

      const handleError = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        reject(new Error(`Failed to preload audio: ${url}`));
      };

      audio.addEventListener('canplay', handleCanPlay, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      audio.src = url;
      audio.load();

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.preloadedTracks.has(id)) {
          reject(new Error(`Audio preload timeout: ${url}`));
        }
      }, 30000);
    });
  }

  /**
   * Play audio with error handling
   */
  static async playAudio(id: string): Promise<void> {
    const audio = this.audioCache.get(id);
    if (!audio) {
      throw new Error(`Audio not found in cache: ${id}`);
    }

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      throw error;
    }
  }

  /**
   * Stop audio
   */
  static stopAudio(id: string): void {
    const audio = this.audioCache.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Get cached audio element
   */
  static getAudio(id: string): HTMLAudioElement | undefined {
    return this.audioCache.get(id);
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
    this.preloadedTracks.clear();
  }

  /**
   * Get preload status
   */
  static getStatus(): {
    cached: number;
    preloaded: number;
    tracks: string[];
  } {
    return {
      cached: this.audioCache.size,
      preloaded: this.preloadedTracks.size,
      tracks: Array.from(this.preloadedTracks),
    };
  }
}

// Initialize audio preloader on window load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload background music
    AudioPreloader.preloadAudio(
      'https://soundcloud.com/markd54321/198-blue-in-green-miles-davis',
      'background-music'
    ).catch((error) => {
      console.log('Background music preload failed, will use SoundCloud embed:', error);
    });
  });
}
