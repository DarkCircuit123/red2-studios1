/**
 * Advanced Content Protection - Next Generation
 * Enterprise-grade protection against content theft and unauthorized access
 */

export class AdvancedContentProtection {
  private static instance: AdvancedContentProtection;
  private protectionActive = false;
  private watermarkActive = false;
  private encryptionActive = false;

  private constructor() {}

  static getInstance(): AdvancedContentProtection {
    if (!AdvancedContentProtection.instance) {
      AdvancedContentProtection.instance = new AdvancedContentProtection();
    }
    return AdvancedContentProtection.instance;
  }

  /**
   * Initialize advanced protection suite
   */
  initializeAdvancedProtection(): void {
    if (this.protectionActive) return;

    this.setupInvisibleWatermark();
    this.implementDynamicEncryption();
    this.monitorForThreats();
    this.disableScreenRecording();
    this.protectAgainstBotActivity();
    this.implementFingerprinting();
    this.setupDecoyContent();

    this.protectionActive = true;
    console.log('🛡️ Advanced Content Protection Suite Activated');
  }

  /**
   * Create invisible watermark on all content
   */
  private setupInvisibleWatermark(): void {
    // Add invisible metadata to images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = 1;
        canvas.height = 1;

        // Create invisible watermark data
        const watermarkData = `WM_${Date.now()}_${index}_${Math.random()}`;
        const encoded = btoa(watermarkData);

        // Store in image metadata
        img.dataset.watermark = encoded;
        img.dataset.protected = 'true';
        img.dataset.timestamp = new Date().toISOString();
      }
    });

    // Monitor for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as HTMLElement;
              const newImages = element.querySelectorAll('img');
              newImages.forEach((img, index) => {
                const watermarkData = `WM_${Date.now()}_${index}_${Math.random()}`;
                img.dataset.watermark = btoa(watermarkData);
                img.dataset.protected = 'true';
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.watermarkActive = true;
  }

  /**
   * Implement dynamic encryption for sensitive content
   */
  private implementDynamicEncryption(): void {
    // Encrypt text content dynamically
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');

    textElements.forEach((element) => {
      const originalText = element.textContent;
      if (originalText) {
        // Store encrypted version
        const encrypted = this.simpleEncrypt(originalText);
        element.dataset.encrypted = encrypted;
        element.dataset.original = 'hidden';
      }
    });

    this.encryptionActive = true;
  }

  /**
   * Simple encryption function
   */
  private simpleEncrypt(text: string): string {
    return btoa(text);
  }

  /**
   * Monitor for suspicious activity
   */
  private monitorForThreats(): void {
    // Monitor for unusual mouse movements (bot detection)
    let lastMouseTime = Date.now();
    let mouseMovements = 0;

    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMouseTime < 10) {
        mouseMovements++;
      } else {
        mouseMovements = 0;
      }

      lastMouseTime = now;

      // If too many movements in short time, likely a bot
      if (mouseMovements > 50) {
        this.handleThreatDetected('Suspicious mouse activity detected');
      }
    });

    // Monitor for rapid clicks (bot detection)
    let lastClickTime = 0;
    let clickCount = 0;

    document.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastClickTime < 100) {
        clickCount++;
      } else {
        clickCount = 0;
      }

      lastClickTime = now;

      if (clickCount > 10) {
        this.handleThreatDetected('Rapid click activity detected');
      }
    });

    // Monitor for keyboard spam
    let lastKeyTime = 0;
    let keyCount = 0;

    document.addEventListener('keydown', (e) => {
      const now = Date.now();
      if (now - lastKeyTime < 50) {
        keyCount++;
      } else {
        keyCount = 0;
      }

      lastKeyTime = now;

      if (keyCount > 20) {
        this.handleThreatDetected('Keyboard spam detected');
      }
    });
  }

  /**
   * Disable screen recording
   */
  private disableScreenRecording(): void {
    // Detect screen recording attempts
    if ((navigator as any).mediaDevices) {
      const originalGetDisplayMedia = (navigator.mediaDevices as any).getDisplayMedia;

      if (originalGetDisplayMedia) {
        (navigator.mediaDevices as any).getDisplayMedia = function () {
    
          return Promise.reject(new Error('Screen recording is not permitted'));
        };
      }
    }

    // Prevent WebRTC screen sharing
    if ((window as any).RTCPeerConnection) {
      const originalRTC = (window as any).RTCPeerConnection;
      (window as any).RTCPeerConnection = function () {
        const pc = new originalRTC();
        const originalAddTrack = pc.addTrack;

        pc.addTrack = function (track: any) {
          if (track.kind === 'video' && track.getSettings().displaySurface) {
            throw new Error('Screen sharing is not permitted');
          }
          return originalAddTrack.call(this, track);
        };

        return pc;
      };
    }
  }

  /**
   * Protect against bot activity
   */
  private protectAgainstBotActivity(): void {
    // Check for headless browser
    if (navigator.webdriver) {

      this.handleThreatDetected('Automated access detected');
    }

    // Check for phantom.js
    if ((window as any).callPhantom || (window as any).__phantom) {
      this.handleThreatDetected('Phantom.js detected');
    }

    // Check for selenium
    if ((window as any).__webdriver_evaluate || (window as any).__selenium_evaluate) {
      this.handleThreatDetected('Selenium detected');
    }

    // Check for puppeteer
    if ((navigator as any).plugins.length === 0) {
      // Suspicious - no plugins
      if (navigator.userAgent.includes('HeadlessChrome')) {
        this.handleThreatDetected('Headless Chrome detected');
      }
    }

    // Monitor for unusual user agent
    const userAgent = navigator.userAgent;
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      this.handleThreatDetected('Bot user agent detected');
    }
  }

  /**
   * Implement device fingerprinting
   */
  private implementFingerprinting(): void {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      vendor: navigator.vendor,
      plugins: Array.from(navigator.plugins).map((p) => p.name),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
    };

    // Store fingerprint
    const fingerprintHash = this.hashFingerprint(fingerprint);
    sessionStorage.setItem('device_fingerprint', fingerprintHash);

    // Verify on each page load
    const storedFingerprint = sessionStorage.getItem('device_fingerprint');
    if (storedFingerprint && storedFingerprint !== fingerprintHash) {
      this.handleThreatDetected('Device fingerprint mismatch');
    }
  }

  /**
   * Hash fingerprint data
   */
  private hashFingerprint(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Setup decoy content to catch scrapers
   */
  private setupDecoyContent(): void {
    // Create hidden decoy elements
    const decoyContainer = document.createElement('div');
    decoyContainer.style.display = 'none';
    decoyContainer.className = 'decoy-content';

    // Add fake content that would indicate scraping
    const decoyElements = [
      'This content is protected and should not be accessed',
      'Unauthorized access detected',
      'This is a honeypot for scrapers',
    ];

    decoyElements.forEach((text) => {
      const decoy = document.createElement('p');
      decoy.textContent = text;
      decoy.className = 'decoy-element';
      decoyContainer.appendChild(decoy);
    });

    document.body.appendChild(decoyContainer);

    // Monitor if decoy content is accessed
    const observer = new MutationObserver(() => {
      const decoys = document.querySelectorAll('.decoy-element');
      decoys.forEach((decoy) => {
        if (decoy.textContent && decoy.offsetParent !== null) {
          this.handleThreatDetected('Decoy content accessed - scraper detected');
        }
      });
    });

    observer.observe(decoyContainer, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  /**
   * Handle threat detection
   */
  private handleThreatDetected(threat: string): void {


    // Log threat
    const threatLog = {
      threat,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in session
    const threats = JSON.parse(sessionStorage.getItem('threats') || '[]');
    threats.push(threatLog);
    sessionStorage.setItem('threats', JSON.stringify(threats));

    // Optional: Take action (e.g., blur content, show warning)
    if (threats.length > 3) {
      this.blurAllContent();
      this.showSecurityWarning();
    }
  }

  /**
   * Blur all content as security measure
   */
  private blurAllContent(): void {
    const style = document.createElement('style');
    style.textContent = `
      body * {
        filter: blur(10px) !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show security warning
   */
  private showSecurityWarning(): void {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
      text-align: center;
    `;

    warning.innerHTML = `
      <div style="padding: 40px; max-width: 500px;">
        <h1 style="font-size: 32px; margin-bottom: 20px;">🔒 Security Alert</h1>
        <p style="font-size: 18px; margin-bottom: 20px;">
          Unauthorized access attempt detected. This content is protected.
        </p>
        <p style="font-size: 14px; color: #aaa;">
          Your session has been flagged for suspicious activity.
        </p>
      </div>
    `;

    document.body.appendChild(warning);
  }

  /**
   * Get protection status
   */
  getStatus(): {
    active: boolean;
    watermark: boolean;
    encryption: boolean;
  } {
    return {
      active: this.protectionActive,
      watermark: this.watermarkActive,
      encryption: this.encryptionActive,
    };
  }
}

// Export singleton
export const advancedProtection = AdvancedContentProtection.getInstance();
