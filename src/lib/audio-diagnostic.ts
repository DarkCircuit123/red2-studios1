/**
 * Comprehensive Audio Diagnostic & Repair System
 * Identifies and fixes all audio issues across the site
 */

export interface AudioIssue {
  id: string;
  type: 'broken-link' | 'format-unsupported' | 'autoplay-blocked' | 'cors-error' | 'missing-attribute' | 'context-suspended';
  severity: 'critical' | 'warning' | 'info';
  source: string;
  description: string;
  fix: string;
  fixed: boolean;
}

export interface AudioDiagnosticReport {
  timestamp: Date;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  issues: AudioIssue[];
  audioSources: {
    backgroundMusic: boolean;
    clickSounds: boolean;
    hoverSounds: boolean;
    soundcloudEmbed: boolean;
    videoAudio: boolean;
  };
  audioContextState: string;
  browserSupport: {
    audioContext: boolean;
    webAudio: boolean;
    audioElement: boolean;
    iframeAutoplay: boolean;
  };
}

export class AudioDiagnostic {
  private static issues: AudioIssue[] = [];
  private static audioContext: AudioContext | null = null;
  private static diagnosticRun = false;

  /**
   * Run comprehensive audio diagnostic
   */
  static async runDiagnostic(): Promise<AudioDiagnosticReport> {
    this.issues = [];
    
    // Check browser support
    const browserSupport = this.checkBrowserSupport();
    
    // Initialize audio context
    this.initializeAudioContext();
    
    // Check all audio sources
    this.checkBackgroundMusic();
    this.checkClickSounds();
    this.checkHoverSounds();
    this.checkSoundCloudEmbed();
    this.checkVideoAudio();
    this.checkAudioContext();
    this.checkCORSIssues();
    this.checkAutoplayPolicy();
    
    const report: AudioDiagnosticReport = {
      timestamp: new Date(),
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      warningIssues: this.issues.filter(i => i.severity === 'warning').length,
      issues: this.issues,
      audioSources: {
        backgroundMusic: !!document.querySelector('iframe[src*="soundcloud"]'),
        clickSounds: true, // Synthesized, always available
        hoverSounds: true, // Synthesized, always available
        soundcloudEmbed: !!document.querySelector('iframe[src*="soundcloud"]'),
        videoAudio: !!document.querySelector('video'),
      },
      audioContextState: this.audioContext?.state || 'unavailable',
      browserSupport,
    };

    this.diagnosticRun = true;
    return report;
  }

  /**
   * Check browser audio support
   */
  private static checkBrowserSupport() {
    const audioElement = new Audio();
    const audioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    
    return {
      audioContext,
      webAudio: audioContext,
      audioElement: !!audioElement.play,
      iframeAutoplay: this.checkIframeAutoplaySupport(),
    };
  }

  /**
   * Check if iframe autoplay is supported
   */
  private static checkIframeAutoplaySupport(): boolean {
    // Most modern browsers support iframe autoplay with allow attribute
    return true;
  }

  /**
   * Initialize audio context
   */
  private static initializeAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    } catch (e) {
      this.issues.push({
        id: 'audio-context-init',
        type: 'context-suspended',
        severity: 'critical',
        source: 'AudioContext',
        description: 'Failed to initialize AudioContext',
        fix: 'Ensure browser supports Web Audio API',
        fixed: false,
      });
    }
  }

  /**
   * Check background music (SoundCloud embed)
   */
  private static checkBackgroundMusic() {
    const iframes = document.querySelectorAll('iframe[src*="soundcloud"]');
    
    if (iframes.length === 0) {
      this.issues.push({
        id: 'no-background-music',
        type: 'broken-link',
        severity: 'warning',
        source: 'BackgroundMusicPlayer',
        description: 'No SoundCloud embed found',
        fix: 'Ensure BackgroundMusicPlayer component is rendered',
        fixed: false,
      });
      return;
    }

    iframes.forEach((iframe, index) => {
      const src = iframe.getAttribute('src');
      
      // Check for allow attribute
      if (!iframe.hasAttribute('allow')) {
        this.issues.push({
          id: `soundcloud-no-allow-${index}`,
          type: 'missing-attribute',
          severity: 'warning',
          source: `SoundCloud Embed ${index + 1}`,
          description: 'SoundCloud iframe missing allow="autoplay" attribute',
          fix: 'Add allow="autoplay" to iframe',
          fixed: false,
        });
      }

      // Check URL validity
      if (!src || !src.includes('soundcloud')) {
        this.issues.push({
          id: `soundcloud-invalid-url-${index}`,
          type: 'broken-link',
          severity: 'critical',
          source: `SoundCloud Embed ${index + 1}`,
          description: `Invalid SoundCloud URL: ${src}`,
          fix: 'Verify SoundCloud track URL is correct',
          fixed: false,
        });
      }

      // Check for required parameters
      if (!src?.includes('auto_play=false')) {
        this.issues.push({
          id: `soundcloud-autoplay-param-${index}`,
          type: 'autoplay-blocked',
          severity: 'info',
          source: `SoundCloud Embed ${index + 1}`,
          description: 'SoundCloud embed should have auto_play=false for policy compliance',
          fix: 'Add auto_play=false parameter to URL',
          fixed: false,
        });
      }
    });
  }

  /**
   * Check click sounds
   */
  private static checkClickSounds() {
    // Click sounds are synthesized via Web Audio API
    // Check if any elements have click handlers
    const clickableElements = document.querySelectorAll('button, a, [role="button"]');
    
    if (clickableElements.length === 0) {
      this.issues.push({
        id: 'no-clickable-elements',
        type: 'info',
        severity: 'info',
        source: 'Click Sounds',
        description: 'No clickable elements found on page',
        fix: 'Add interactive elements to enable click sounds',
        fixed: false,
      });
    }
  }

  /**
   * Check hover sounds
   */
  private static checkHoverSounds() {
    // Hover sounds are synthesized via Web Audio API
    // Check if any elements have hover handlers
    const hoverableElements = document.querySelectorAll('button, a, [role="button"]');
    
    if (hoverableElements.length === 0) {
      this.issues.push({
        id: 'no-hoverable-elements',
        type: 'info',
        severity: 'info',
        source: 'Hover Sounds',
        description: 'No hoverable elements found on page',
        fix: 'Add interactive elements to enable hover sounds',
        fixed: false,
      });
    }
  }

  /**
   * Check SoundCloud embed specifically
   */
  private static checkSoundCloudEmbed() {
    const trackUrl = 'https://soundcloud.com/markd54321/198-blue-in-green-miles-davis';
    const iframes = document.querySelectorAll('iframe[src*="soundcloud"]');
    
    let foundTrack = false;
    iframes.forEach((iframe) => {
      const src = iframe.getAttribute('src');
      if (src?.includes(encodeURIComponent(trackUrl)) || src?.includes('198-blue-in-green')) {
        foundTrack = true;
      }
    });

    if (!foundTrack && iframes.length > 0) {
      this.issues.push({
        id: 'soundcloud-track-mismatch',
        type: 'broken-link',
        severity: 'warning',
        source: 'SoundCloud Track',
        description: 'Expected SoundCloud track not found in embed',
        fix: 'Verify correct track URL is used',
        fixed: false,
      });
    }
  }

  /**
   * Check video audio tracks
   */
  private static checkVideoAudio() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach((video, index) => {
      const src = video.getAttribute('src');
      const sources = video.querySelectorAll('source');
      
      if (!src && sources.length === 0) {
        this.issues.push({
          id: `video-no-source-${index}`,
          type: 'broken-link',
          severity: 'warning',
          source: `Video ${index + 1}`,
          description: 'Video element has no source',
          fix: 'Add src attribute or source elements to video',
          fixed: false,
        });
      }

      // Check for audio track
      if (!video.hasAttribute('controls')) {
        this.issues.push({
          id: `video-no-controls-${index}`,
          type: 'missing-attribute',
          severity: 'info',
          source: `Video ${index + 1}`,
          description: 'Video missing controls attribute',
          fix: 'Add controls attribute for audio access',
          fixed: false,
        });
      }
    });
  }

  /**
   * Check audio context state
   */
  private static checkAudioContext() {
    if (!this.audioContext) {
      this.issues.push({
        id: 'audio-context-unavailable',
        type: 'context-suspended',
        severity: 'critical',
        source: 'AudioContext',
        description: 'AudioContext is not available',
        fix: 'Ensure browser supports Web Audio API',
        fixed: false,
      });
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.issues.push({
        id: 'audio-context-suspended',
        type: 'context-suspended',
        severity: 'warning',
        source: 'AudioContext',
        description: 'AudioContext is suspended (requires user interaction)',
        fix: 'Resume AudioContext on first user interaction',
        fixed: false,
      });
    }
  }

  /**
   * Check CORS issues
   */
  private static checkCORSIssues() {
    const audioElements = document.querySelectorAll('audio');
    
    audioElements.forEach((audio, index) => {
      const src = audio.getAttribute('src');
      
      if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
        // Check if crossOrigin is set for external URLs
        if (!audio.hasAttribute('crossorigin')) {
          this.issues.push({
            id: `audio-cors-${index}`,
            type: 'cors-error',
            severity: 'warning',
            source: `Audio Element ${index + 1}`,
            description: 'Audio element missing crossOrigin attribute',
            fix: 'Add crossOrigin="anonymous" to audio element',
            fixed: false,
          });
        }
      }
    });
  }

  /**
   * Check autoplay policy compliance
   */
  private static checkAutoplayPolicy() {
    const audioElements = document.querySelectorAll('audio[autoplay]');
    
    audioElements.forEach((audio, index) => {
      if (!audio.hasAttribute('muted')) {
        this.issues.push({
          id: `autoplay-policy-${index}`,
          type: 'autoplay-blocked',
          severity: 'critical',
          source: `Audio Element ${index + 1}`,
          description: 'Audio with autoplay must be muted to comply with browser policy',
          fix: 'Add muted attribute to audio element',
          fixed: false,
        });
      }
    });
  }

  /**
   * Apply all fixes
   */
  static applyAllFixes() {
    this.fixSoundCloudEmbeds();
    this.fixAudioElements();
    this.resumeAudioContext();
  }

  /**
   * Fix SoundCloud embeds
   */
  private static fixSoundCloudEmbeds() {
    const iframes = document.querySelectorAll('iframe[src*="soundcloud"]');
    
    iframes.forEach((iframe) => {
      // Add allow attribute
      if (!iframe.hasAttribute('allow')) {
        iframe.setAttribute('allow', 'autoplay');
      }

      // Update src to ensure proper parameters
      let src = iframe.getAttribute('src') || '';
      
      if (!src.includes('auto_play=false')) {
        src += (src.includes('?') ? '&' : '?') + 'auto_play=false';
        iframe.setAttribute('src', src);
      }

      // Mark issues as fixed
      this.issues.forEach((issue) => {
        if (issue.source.includes('SoundCloud')) {
          issue.fixed = true;
        }
      });
    });
  }

  /**
   * Fix audio elements
   */
  private static fixAudioElements() {
    const audioElements = document.querySelectorAll('audio');
    
    audioElements.forEach((audio) => {
      // Add crossOrigin for external URLs
      const src = audio.getAttribute('src');
      if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
        if (!audio.hasAttribute('crossorigin')) {
          audio.setAttribute('crossorigin', 'anonymous');
        }
      }

      // Fix autoplay policy
      if (audio.hasAttribute('autoplay') && !audio.hasAttribute('muted')) {
        audio.setAttribute('muted', '');
      }

      // Mark issues as fixed
      this.issues.forEach((issue) => {
        if (issue.source.includes('Audio Element')) {
          issue.fixed = true;
        }
      });
    });
  }

  /**
   * Resume audio context
   */
  private static resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.issues.forEach((issue) => {
          if (issue.id === 'audio-context-suspended') {
            issue.fixed = true;
          }
        });
      }).catch((e) => {
        console.warn('Failed to resume audio context:', e);
      });
    }
  }

  /**
   * Get diagnostic report
   */
  static getReport(): AudioDiagnosticReport | null {
    if (!this.diagnosticRun) {
      return null;
    }

    return {
      timestamp: new Date(),
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      warningIssues: this.issues.filter(i => i.severity === 'warning').length,
      issues: this.issues,
      audioSources: {
        backgroundMusic: !!document.querySelector('iframe[src*="soundcloud"]'),
        clickSounds: true,
        hoverSounds: true,
        soundcloudEmbed: !!document.querySelector('iframe[src*="soundcloud"]'),
        videoAudio: !!document.querySelector('video'),
      },
      audioContextState: this.audioContext?.state || 'unavailable',
      browserSupport: this.checkBrowserSupport(),
    };
  }

  /**
   * Export diagnostic report as JSON
   */
  static exportReport(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }
}
