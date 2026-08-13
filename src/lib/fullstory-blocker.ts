/**
 * FULLSTORY BLOCKER
 * 
 * FullStory is NOT used in this project but is being injected at runtime by Wix.
 * This module blocks all FullStory initialization and network requests.
 * 
 * Blocks:
 * 1. window.FS global initialization
 * 2. FullStory script loading (edge.fullstory.com, cdn.fullstory.com)
 * 3. FullStory API calls (api.fullstory.com)
 * 4. FullStory data collection
 */

const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

/**
 * Initialize FullStory blocker
 * Call this once during app initialization, BEFORE any other scripts load
 */
export function initializeFullStoryBlocker() {
  if (typeof window === 'undefined') {
    return; // Not in browser
  }

  // Block 1: Prevent FullStory global from being created
  Object.defineProperty(window, 'FS', {
    get() {
      if (IS_DEVELOPMENT) {
        console.warn('[FullStoryBlocker] Blocked access to window.FS');
      }
      return undefined;
    },
    set(value: any) {
      if (IS_DEVELOPMENT) {
        console.warn('[FullStoryBlocker] Blocked assignment to window.FS:', value);
      }
      // Don't actually set it
    },
    configurable: true,
  });

  // Block 2: Intercept script loading
  const originalAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(node: Node) {
    if (node instanceof HTMLScriptElement) {
      const src = node.src || node.getAttribute('src') || '';
      if (
        src.includes('edge.fullstory.com') ||
        src.includes('cdn.fullstory.com') ||
        src.includes('api.fullstory.com')
      ) {
        if (IS_DEVELOPMENT) {
          console.warn('[FullStoryBlocker] Blocked FullStory script:', src);
        }
        // Don't append the script
        return node;
      }
    }
    return originalAppendChild.call(this, node);
  };

  // Block 3: Intercept insertBefore
  const originalInsertBefore = Element.prototype.insertBefore;
  Element.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
    if (newNode instanceof HTMLScriptElement) {
      const src = newNode.src || newNode.getAttribute('src') || '';
      if (
        src.includes('edge.fullstory.com') ||
        src.includes('cdn.fullstory.com') ||
        src.includes('api.fullstory.com')
      ) {
        if (IS_DEVELOPMENT) {
          console.warn('[FullStoryBlocker] Blocked FullStory script via insertBefore:', src);
        }
        // Don't insert the script
        return newNode;
      }
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };

  // Block 4: Intercept fetch requests to FullStory
  const originalFetch = window.fetch;
  window.fetch = function(resource: RequestInfo | URL, init?: RequestInit) {
    const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.toString() : resource.url;
    
    if (
      url.includes('edge.fullstory.com') ||
      url.includes('cdn.fullstory.com') ||
      url.includes('api.fullstory.com') ||
      url.includes('rs.fullstory.com')
    ) {
      if (IS_DEVELOPMENT) {
        console.warn('[FullStoryBlocker] Blocked fetch to FullStory:', url);
      }
      // Return a rejected promise
      return Promise.reject(new Error('FullStory requests are blocked'));
    }
    
    return originalFetch.call(this, resource, init);
  };

  // Block 5: Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    if (
      urlStr.includes('edge.fullstory.com') ||
      urlStr.includes('cdn.fullstory.com') ||
      urlStr.includes('api.fullstory.com') ||
      urlStr.includes('rs.fullstory.com')
    ) {
      if (IS_DEVELOPMENT) {
        console.warn('[FullStoryBlocker] Blocked XHR to FullStory:', urlStr);
      }
      // Still call open but we'll prevent send
      this.addEventListener('loadstart', (e: Event) => {
        this.abort();
      });
    }
    
    return originalXHROpen.call(this, method, url, ...args);
  };

  // Block 6: Intercept document.write (some scripts use this)
  const originalWrite = document.write;
  document.write = function(markup: string) {
    if (markup.includes('fullstory') || markup.includes('FullStory')) {
      if (IS_DEVELOPMENT) {
        console.warn('[FullStoryBlocker] Blocked document.write with FullStory content');
      }
      return;
    }
    return originalWrite.call(document, markup);
  };

  // Block 7: Monitor for FullStory script tags in the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLScriptElement) {
            const src = node.src || node.getAttribute('src') || '';
            if (
              src.includes('edge.fullstory.com') ||
              src.includes('cdn.fullstory.com') ||
              src.includes('api.fullstory.com')
            ) {
              if (IS_DEVELOPMENT) {
                console.warn('[FullStoryBlocker] Detected FullStory script in DOM, removing:', src);
              }
              node.remove();
            }
          }
        });
      }
    });
  });

  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  if (IS_DEVELOPMENT) {
    console.log('[FullStoryBlocker] Initialized - all FullStory requests will be blocked');
  }
}

export default initializeFullStoryBlocker;
