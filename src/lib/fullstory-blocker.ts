/**
 * FullStory Runtime Blocker
 * 
 * Prevents Wix from injecting FullStory scripts at runtime.
 * FullStory is NOT used by this project and causes:
 * - CSP violations (edge.fullstory.com blocked)
 * - Console errors ("FullStory init has already been called once")
 * - Unnecessary network requests
 * 
 * This blocker runs BEFORE any Wix scripts execute to prevent injection.
 */

/**
 * Initialize FullStory blocker - must run as early as possible
 */
export function initializeFullStoryBlocker() {
  if (typeof window === 'undefined') return;

  // 1. Block FullStory script loading via script tag interception
  blockScriptLoading();

  // 2. Block FullStory via fetch/XHR interception
  blockNetworkRequests();

  // 3. Block FullStory initialization
  blockFullStoryInit();

  // 4. Remove any existing FullStory scripts from DOM
  removeExistingFullStoryScripts();

  // 5. Monitor for future FullStory injection attempts
  monitorDOMForFullStory();
}

/**
 * Block FullStory script loading by intercepting createElement
 */
function blockScriptLoading() {
  const originalCreateElement = document.createElement;

  document.createElement = function (tagName: string, ...args: any[]) {
    const element = originalCreateElement.call(document, tagName, ...args);

    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function (name: string, value: string) {
        // Block FullStory script URLs
        if (
          name === 'src' &&
          (value.includes('fullstory.com') ||
            value.includes('edge.fullstory.com') ||
            value.includes('cdn.fullstory.com') ||
            value.includes('api.fullstory.com') ||
            value.includes('rs.fullstory.com'))
        ) {
          console.debug('[FullStory Blocker] Blocked script loading:', value);
          return element;
        }
        return originalSetAttribute.call(this, name, value);
      };
    }

    return element;
  } as any;
}

/**
 * Block FullStory network requests via fetch and XHR
 */
function blockNetworkRequests() {
  const fullstoryDomains = [
    'fullstory.com',
    'edge.fullstory.com',
    'cdn.fullstory.com',
    'api.fullstory.com',
    'rs.fullstory.com',
  ];

  // Block fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (resource: RequestInfo | URL, ...args: any[]) {
    const url = typeof resource === 'string' ? resource : resource.toString();

    if (fullstoryDomains.some((domain) => url.includes(domain))) {
      console.debug('[FullStory Blocker] Blocked fetch request:', url);
      return Promise.reject(new Error('FullStory requests are blocked'));
    }

    return originalFetch.apply(this, [resource, ...args]);
  } as any;

  // Block XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...args: any[]
  ) {
    const urlStr = typeof url === 'string' ? url : url.toString();

    if (fullstoryDomains.some((domain) => urlStr.includes(domain))) {
      console.debug('[FullStory Blocker] Blocked XHR request:', urlStr);
      // Silently fail by not calling the original open
      return;
    }

    return originalOpen.apply(this, [method, url, ...args]);
  };
}

/**
 * Block FullStory initialization
 */
function blockFullStoryInit() {
  // Prevent FullStory global initialization
  (window as any).FS = undefined;
  (window as any)._fs_namespace = undefined;

  // Block window.FS calls
  Object.defineProperty(window, 'FS', {
    get() {
      return undefined;
    },
    set() {
      // Silently ignore
    },
    configurable: false,
  });

  // Suppress FullStory console errors
  const originalError = console.error;
  console.error = function (...args: any[]) {
    const message = args[0]?.toString?.() || '';
    if (
      message.includes('FullStory') ||
      message.includes('fullstory') ||
      message.includes('fs.js')
    ) {
      console.debug('[FullStory Blocker] Suppressed FullStory error:', message);
      return;
    }
    return originalError.apply(console, args);
  };
}

/**
 * Remove any existing FullStory scripts from DOM
 */
function removeExistingFullStoryScripts() {
  const scripts = document.querySelectorAll('script');
  scripts.forEach((script) => {
    if (
      script.src &&
      (script.src.includes('fullstory.com') ||
        script.src.includes('edge.fullstory.com') ||
        script.src.includes('cdn.fullstory.com'))
    ) {
      console.debug('[FullStory Blocker] Removed FullStory script:', script.src);
      script.remove();
    }
  });
}

/**
 * Monitor DOM for future FullStory injection attempts
 */
function monitorDOMForFullStory() {
  if (typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if it's a FullStory script
            if (
              element.tagName === 'SCRIPT' &&
              element.getAttribute('src')?.includes('fullstory.com')
            ) {
              console.debug(
                '[FullStory Blocker] Detected and removed FullStory script injection'
              );
              element.remove();
            }

            // Check children recursively
            const scripts = element.querySelectorAll('script[src*="fullstory"]');
            scripts.forEach((script) => {
              console.debug(
                '[FullStory Blocker] Detected and removed FullStory script injection'
              );
              script.remove();
            });
          }
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
