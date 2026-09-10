/**
 * Advanced Screenshot & Right-Click Protection System
 * Implements multiple layers of security to prevent unauthorized content capture
 */

export class ScreenshotProtection {
  private static isInitialized = false;
  private static protectionOverlay: HTMLElement | null = null;
  private static blurTimeout: NodeJS.Timeout | null = null;

  static initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Layer 1: Disable right-click context menu
    this.disableContextMenu();

    // Layer 2: Block screenshot keyboard shortcuts
    this.blockScreenshotShortcuts();

    // Layer 3: Prevent print functionality
    this.preventPrinting();

    // Layer 4: Monitor window focus and blur
    this.monitorWindowFocus();

    // Layer 5: Disable developer tools shortcuts
    this.blockDeveloperTools();

    // Layer 6: Prevent drag and drop of images
    this.preventImageDragDrop();

    // Layer 7: Monitor clipboard access
    this.monitorClipboardAccess();

    // Layer 8: Detect screen capture tools
    this.detectScreenCapture();

    // Layer 9: Disable text selection and copying
    this.restrictTextSelection();
  }

  private static disableContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    // Also prevent on all elements
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { capture: true });

    // Prevent long-press context menu on mobile
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const simulatedEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      e.target?.dispatchEvent(simulatedEvent);
    }, { passive: false });
  }

  private static blockScreenshotShortcuts() {
    const blockedKeys = new Set([
      'PrintScreen',
      'F12',
      'F11',
      'F10',
      'F9',
      'F8',
      'F7',
      'F6',
      'F5',
      'F4',
      'F3',
      'F2',
      'F1',
    ]);

    document.addEventListener('keydown', (e) => {
      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBlurEffect();
        return false;
      }

      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+Option+I (Mac Developer Tools)
      if (e.metaKey && e.altKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'U') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+Shift+3 (Mac Screenshot)
      if (e.metaKey && e.shiftKey && e.key === '3') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBlurEffect();
        return false;
      }

      // Block Cmd+Shift+4 (Mac Screenshot Selection)
      if (e.metaKey && e.shiftKey && e.key === '4') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBlurEffect();
        return false;
      }

      // Block Cmd+Shift+5 (Mac Screenshot/Record)
      if (e.metaKey && e.shiftKey && e.key === '5') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBlurEffect();
        return false;
      }

      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+P (Mac Print)
      if (e.metaKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+S (Mac Save)
      if (e.metaKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+A (Mac Select All)
      if (e.metaKey && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+C (Mac Copy)
      if (e.metaKey && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+X (Mac Cut)
      if (e.metaKey && e.key === 'x') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Cmd+V (Mac Paste)
      if (e.metaKey && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block Windows+Shift+S (Windows Screenshot)
      if (e.key === 'Meta' && e.shiftKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerBlurEffect();
        return false;
      }

      if (blockedKeys.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { capture: true });

    // Also block on keyup
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { capture: true });
  }

  private static preventPrinting() {
    // Disable print functionality
    window.print = () => false;

    // Add print media query styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        * {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          display: none !important;
        }
      }
      @page {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private static monitorWindowFocus() {
    // Blur effect when window loses focus
    window.addEventListener('blur', () => {
      this.triggerBlurEffect();
    });

    // Detect visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.triggerBlurEffect();
      } else {
        this.removeBlurEffect();
      }
    });

    // Detect when user switches away
    document.addEventListener('mouseleave', () => {
      // Optional: trigger blur when mouse leaves window
    });
  }

  private static blockDeveloperTools() {
    // Detect if DevTools is open
    const devtools = { open: false, orientation: null as string | null };

    const threshold = 160;
    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.onDevToolsOpen();
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
        }
      }
    }, 500);

    // Additional detection method
    const check = () => {
      const before = new Date().getTime();
      debugger;
      const after = new Date().getTime();
      if (after - before > 100) {
        this.onDevToolsOpen();
      }
    };

    // Run check periodically
    setInterval(check, 1000);
  }

  private static onDevToolsOpen() {
    // Trigger blur effect when DevTools is detected
    this.triggerBlurEffect();
  }

  private static preventImageDragDrop() {
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    // Disable image context menu
    document.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { capture: true });
  }

  private static monitorClipboardAccess() {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    // Monitor clipboard API
    if (navigator.clipboard) {
      const originalRead = navigator.clipboard.read;
      const originalReadText = navigator.clipboard.readText;

      navigator.clipboard.read = async () => {
        this.triggerBlurEffect();
        throw new Error('Clipboard access denied');
      };

      navigator.clipboard.readText = async () => {
        this.triggerBlurEffect();
        throw new Error('Clipboard access denied');
      };
    }
  }

  private static detectScreenCapture() {
    // Monitor screen capture API
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const original = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async () => {
        this.triggerBlurEffect();
        throw new Error('Screen capture is not allowed');
      };
    }

    // Monitor for common screen capture tools
    const captureTools = [
      'Snagit',
      'Greenshot',
      'ShareX',
      'Lightshot',
      'Screenshot Path',
    ];

    // Check for screen capture events
    document.addEventListener('screencapture', () => {
      this.triggerBlurEffect();
    });
  }

  private static restrictTextSelection() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
        -webkit-touch-callout: none !important;
      }
      
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      img {
        -webkit-user-drag: none !important;
        pointer-events: none !important;
      }
      
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);

    // Prevent text selection via mouse
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { capture: true });

    document.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT' && 
          (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });
  }

  private static triggerBlurEffect() {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }

    if (!this.protectionOverlay) {
      this.protectionOverlay = document.createElement('div');
      this.protectionOverlay.id = 'screenshot-protection-overlay';
      this.protectionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 999999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(this.protectionOverlay);
    }

    this.protectionOverlay.style.opacity = '1';

    this.blurTimeout = setTimeout(() => {
      if (this.protectionOverlay) {
        this.protectionOverlay.style.opacity = '0';
      }
    }, 2000);
  }

  private static removeBlurEffect() {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
    if (this.protectionOverlay) {
      this.protectionOverlay.style.opacity = '0';
    }
  }


}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  ScreenshotProtection.initialize();
}
