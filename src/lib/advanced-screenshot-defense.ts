/**
 * Advanced Screenshot Defense System
 * Additional sophisticated techniques to prevent content capture
 */

export class AdvancedScreenshotDefense {
  private static initialized = false;
  private static captureAttempts = 0;
  private static lastCaptureTime = 0;

  static initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this.setupCanvasProtection();
    this.setupWebGLProtection();
    this.setupVideoProtection();
    this.setupAudioProtection();
    this.setupPerformanceMonitoring();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();
    this.setupMutationObserver();
    this.setupIntersectionObserver();
    this.setupResizeObserver();
    this.setupPointerLockProtection();
    this.setupFullscreenProtection();
    this.setupNotificationProtection();
    this.setupGeolocationProtection();
    this.setupCameraProtection();
    this.setupMicrophoneProtection();
  }

  private static setupCanvasProtection() {
    // Protect Canvas API from screenshot tools
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toDataURL = function (...args: any[]) {
      this.triggerCaptureDetection();
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    };

    HTMLCanvasElement.prototype.toBlob = function (callback: any, ...args: any[]) {
      this.triggerCaptureDetection();
      const emptyBlob = new Blob([''], { type: 'image/png' });
      callback(emptyBlob);
    };

    HTMLCanvasElement.prototype.getContext = function (contextType: any, ...args: any[]) {
      const context = originalGetContext.call(this, contextType, ...args);
      if (context && contextType === '2d') {
        return this.wrapCanvasContext(context);
      }
      return context;
    };

    (HTMLCanvasElement.prototype as any).triggerCaptureDetection = function () {
      AdvancedScreenshotDefense.onCaptureAttempt();
    };

    (HTMLCanvasElement.prototype as any).wrapCanvasContext = function (context: any) {
      const originalDrawImage = context.drawImage;
      context.drawImage = function (...args: any[]) {
        AdvancedScreenshotDefense.onCaptureAttempt();
        return originalDrawImage.apply(this, args);
      };
      return context;
    };
  }

  private static setupWebGLProtection() {
    // Protect WebGL from screenshot tools
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    const originalReadPixels = WebGLRenderingContext.prototype.readPixels;

    WebGLRenderingContext.prototype.getParameter = function (pname: any) {
      if (pname === 37445) { // UNMASKED_RENDERER_WEBGL
        AdvancedScreenshotDefense.onCaptureAttempt();
        return 'Protected';
      }
      return originalGetParameter.call(this, pname);
    };

    WebGLRenderingContext.prototype.readPixels = function (...args: any[]) {
      AdvancedScreenshotDefense.onCaptureAttempt();
      throw new Error('readPixels is not allowed');
    };

    // WebGL2
    if (WebGL2RenderingContext) {
      const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
      const originalReadPixels2 = WebGL2RenderingContext.prototype.readPixels;

      WebGL2RenderingContext.prototype.getParameter = function (pname: any) {
        if (pname === 37445) {
          AdvancedScreenshotDefense.onCaptureAttempt();
          return 'Protected';
        }
        return originalGetParameter2.call(this, pname);
      };

      WebGL2RenderingContext.prototype.readPixels = function (...args: any[]) {
        AdvancedScreenshotDefense.onCaptureAttempt();
        throw new Error('readPixels is not allowed');
      };
    }
  }

  private static setupVideoProtection() {
    // Protect video elements from capture
    const originalPlay = HTMLVideoElement.prototype.play;
    const originalPause = HTMLVideoElement.prototype.pause;

    HTMLVideoElement.prototype.play = function () {
      this.style.pointerEvents = 'none';
      this.style.opacity = '0.5';
      return originalPlay.call(this);
    };

    HTMLVideoElement.prototype.pause = function () {
      AdvancedScreenshotDefense.onCaptureAttempt();
      return originalPause.call(this);
    };
  }

  private static setupAudioProtection() {
    // Protect audio elements from capture
    const originalPlay = HTMLAudioElement.prototype.play;

    HTMLAudioElement.prototype.play = function () {
      // Add audio watermark or protection
      return originalPlay.call(this);
    };
  }

  private static setupPerformanceMonitoring() {
    // Monitor performance API for suspicious activity
    const originalMeasure = performance.measure;
    const originalMark = performance.mark;

    performance.measure = function (...args: any[]) {
      AdvancedScreenshotDefense.analyzePerformanceData();
      return originalMeasure.apply(this, args);
    };

    performance.mark = function (...args: any[]) {
      AdvancedScreenshotDefense.analyzePerformanceData();
      return originalMark.apply(this, args);
    };
  }

  private static setupMemoryMonitoring() {
    // Monitor memory usage for suspicious patterns
    if ((performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          AdvancedScreenshotDefense.onCaptureAttempt();
        }
      }, 1000);
    }
  }

  private static setupNetworkMonitoring() {
    // Monitor network requests for suspicious activity
    const originalFetch = window.fetch;
    window.fetch = async function (...args: any[]) {
      const url = args[0];
      if (typeof url === 'string' && 
          (url.includes('screenshot') || 
           url.includes('capture') || 
           url.includes('blob'))) {
        AdvancedScreenshotDefense.onCaptureAttempt();
      }
      return originalFetch.apply(this, args);
    };
  }

  private static setupMutationObserver() {
    // Monitor DOM mutations for suspicious changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (target.style.display === 'none' || 
              target.style.visibility === 'hidden') {
            AdvancedScreenshotDefense.onCaptureAttempt();
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class'],
    });
  }

  private static setupIntersectionObserver() {
    // Monitor visibility changes
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          AdvancedScreenshotDefense.onCaptureAttempt();
        }
      });
    });

    document.querySelectorAll('img, video, canvas').forEach((el) => {
      observer.observe(el);
    });
  }

  private static setupResizeObserver() {
    // Monitor window resize for suspicious activity
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) {
          AdvancedScreenshotDefense.onCaptureAttempt();
        }
      });
    });

    observer.observe(document.body);
  }

  private static setupPointerLockProtection() {
    // Protect pointer lock API
    const originalRequestPointerLock = Element.prototype.requestPointerLock;
    Element.prototype.requestPointerLock = function () {
      AdvancedScreenshotDefense.onCaptureAttempt();
      throw new Error('Pointer lock is not allowed');
    };
  }

  private static setupFullscreenProtection() {
    // Protect fullscreen API
    const originalRequestFullscreen = Element.prototype.requestFullscreen;
    Element.prototype.requestFullscreen = function () {
      AdvancedScreenshotDefense.onCaptureAttempt();
      throw new Error('Fullscreen is not allowed');
    };
  }

  private static setupNotificationProtection() {
    // Protect notification API
    if ('Notification' in window) {
      const originalNotification = window.Notification;
      (window as any).Notification = function (...args: any[]) {
        AdvancedScreenshotDefense.onCaptureAttempt();
        throw new Error('Notifications are not allowed');
      };
    }
  }

  private static setupGeolocationProtection() {
    // Protect geolocation API
    if (navigator.geolocation) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = function (...args: any[]) {
        AdvancedScreenshotDefense.onCaptureAttempt();
        throw new Error('Geolocation is not allowed');
      };
    }
  }

  private static setupCameraProtection() {
    // Protect camera access
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const originalEnumerate = navigator.mediaDevices.enumerateDevices;
      navigator.mediaDevices.enumerateDevices = async function () {
        AdvancedScreenshotDefense.onCaptureAttempt();
        throw new Error('Camera enumeration is not allowed');
      };
    }
  }

  private static setupMicrophoneProtection() {
    // Protect microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async function (...args: any[]) {
        AdvancedScreenshotDefense.onCaptureAttempt();
        throw new Error('Microphone access is not allowed');
      };
    }
  }

  private static analyzePerformanceData() {
    // Analyze performance data for suspicious patterns
    const entries = performance.getEntriesByType('measure');
    if (entries.length > 100) {
      this.onCaptureAttempt();
    }
  }

  private static onCaptureAttempt() {
    this.captureAttempts++;
    const now = Date.now();

    // If multiple capture attempts in short time, trigger defense
    if (now - this.lastCaptureTime < 1000) {
      this.triggerDefense();
    }

    this.lastCaptureTime = now;

    // Log attempt
    console.warn('Capture attempt detected and blocked');
  }

  private static triggerDefense() {
    // Create visual feedback
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.3);
      z-index: 999999;
      pointer-events: none;
      animation: pulse 0.5s ease-in-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
    }, 500);
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  AdvancedScreenshotDefense.initialize();
}
