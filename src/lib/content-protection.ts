/**
 * Advanced Content Protection System
 * Prevents right-clicking, screenshots, code viewing, and content copying
 * Similar to Telegram and other private services
 */

export class ContentProtectionManager {
  private static instance: ContentProtectionManager;
  private isProtectionActive = false;

  private constructor() {}

  static getInstance(): ContentProtectionManager {
    if (!ContentProtectionManager.instance) {
      ContentProtectionManager.instance = new ContentProtectionManager();
    }
    return ContentProtectionManager.instance;
  }

  /**
   * Initialize all protection mechanisms
   */
  initializeProtection(): void {
    if (this.isProtectionActive) return;

    this.disableRightClick();
    this.disableScreenshot();
    this.disableDevTools();
    this.disableTextSelection();
    this.disableDragDrop();
    this.disableKeyboardShortcuts();
    this.disableContextMenu();
    this.protectImages();
    this.monitorClipboard();
    this.preventInspection();
    this.disableSourceViewing();

    this.isProtectionActive = true;
    console.log('🔒 Content Protection System Activated');
  }

  /**
   * Disable right-click context menu
   */
  private disableRightClick(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // Also prevent on all elements
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
   * Prevent screenshots using multiple techniques
   */
  private disableScreenshot(): void {
    // Prevent Print Screen key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Screenshots are disabled');
        return false;
      }
    }, true);

    // Monitor for screenshot attempts via clipboard
    document.addEventListener('keyup', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Screenshots are disabled');
        return false;
      }
    }, true);

    // Prevent Shift+PrintScreen
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Monitor clipboard for image data (screenshot detection)
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            this.showProtectionAlert('Image pasting is disabled');
            return false;
          }
        }
      }
    }, true);

    // Disable canvas screenshot via toDataURL
    this.protectCanvas();
  }

  /**
   * Protect canvas from screenshot extraction
   */
  private protectCanvas(): void {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {

      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    };

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function () {

      return originalGetImageData.call(this, 0, 0, 0, 0);
    };
  }

  /**
   * Disable Developer Tools access
   */
  private disableDevTools(): void {
    // Detect F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Developer tools are disabled');
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+I (Inspect)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Developer tools are disabled');
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+C (Inspect Element)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Developer tools are disabled');
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+J (Console)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Developer tools are disabled');
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+K (Console on Firefox)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Developer tools are disabled');
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+M (Responsive Design Mode)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Detect Ctrl+Shift+Delete (Clear browsing data)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Disable right-click on elements to prevent "Inspect Element"
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, true);
  }

  /**
   * Disable text selection to prevent copying
   */
  private disableTextSelection(): void {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';

    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    }, true);

    document.addEventListener('mousedown', (e) => {
      if (e.detail > 1) {
        e.preventDefault();
        return false;
      }
    }, true);

    // Disable triple-click selection
    document.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT' && 
          (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        window.getSelection()?.removeAllRanges();
      }
    }, true);
  }

  /**
   * Disable drag and drop to prevent saving images
   */
  private disableDragDrop(): void {
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // Prevent image drag
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      img.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      }, true);
    });
  }

  /**
   * Disable dangerous keyboard shortcuts
   */
  private disableKeyboardShortcuts(): void {
    const dangerousKeys = ['s', 'p', 'u', 'c', 'x', 'v', 'a'];

    document.addEventListener('keydown', (e) => {
      // Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Printing is disabled');
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopPropagation();
        this.showProtectionAlert('Source code viewing is disabled');
        return false;
      }

      // Ctrl+C (Copy) - Allow for inputs/textareas
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && 
            (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+X (Cut)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && 
            (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && 
            (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && 
            (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, true);
  }

  /**
   * Disable context menu
   */
  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
  }

  /**
   * Protect images from being saved
   */
  private protectImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      img.style.webkitUserSelect = 'none';
      img.style.msUserSelect = 'none';
      img.style.mozUserSelect = 'none';

      img.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      img.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      }, true);

      // Prevent right-click save
      img.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
    });

    // Observe for new images added dynamically
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as HTMLElement;
              const newImages = element.querySelectorAll('img');
              newImages.forEach((img) => {
                this.protectImage(img);
              });
              if (element.tagName === 'IMG') {
                this.protectImage(element as HTMLImageElement);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Protect individual image
   */
  private protectImage(img: HTMLImageElement): void {
    img.style.pointerEvents = 'none';
    img.style.userSelect = 'none';
    img.style.webkitUserSelect = 'none';
    img.style.msUserSelect = 'none';
    img.style.mozUserSelect = 'none';

    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    }, true);
  }

  /**
   * Monitor clipboard for suspicious activity
   */
  private monitorClipboard(): void {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }
    }, true);
  }

  /**
   * Prevent element inspection
   */
  private preventInspection(): void {
    // Disable element.inspect()
    (window as any).inspect = undefined;

    // Disable devtools detection bypass
    const handler = {
      get: () => new Proxy({}, handler),
    };

    (window as any).devtools = new Proxy({}, handler);

    // Prevent console access
    Object.defineProperty(window, 'console', {
      value: new Proxy(console, {
        get: (target, prop) => {
          if (prop === 'log' || prop === 'error' || prop === 'warn' || prop === 'info') {
            return () => {};
          }
          return target[prop as keyof Console];
        },
      }),
      writable: false,
    });
  }

  /**
   * Disable source code viewing
   */
  private disableSourceViewing(): void {
    // Prevent View Source
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Prevent iframe access to source
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      iframe.sandbox.add('allow-same-origin');
      iframe.sandbox.remove('allow-scripts');
    });

    // Disable script tag access
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      Object.defineProperty(script, 'innerHTML', {
        get: () => '',
        set: () => {},
      });
      Object.defineProperty(script, 'textContent', {
        get: () => '',
        set: () => {},
      });
    });
  }

  /**
   * Show protection alert
   */
  private showProtectionAlert(message: string): void {
    // Silent alert - just log to console
    console.log(`🔒 ${message}`);

    // Optional: Show subtle visual feedback
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = `🔒 ${message}`;
    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }, 2000);
  }

  /**
   * Disable protection (for admin/authorized users)
   */
  disableProtection(): void {
    this.isProtectionActive = false;
    console.log('🔓 Content Protection System Deactivated');
  }

  /**
   * Check if protection is active
   */
  isActive(): boolean {
    return this.isProtectionActive;
  }
}

// Export singleton instance
export const contentProtection = ContentProtectionManager.getInstance();
