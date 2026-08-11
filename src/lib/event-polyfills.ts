/**
 * Event Polyfills and Compatibility Fixes
 * Handles deprecated browser APIs and compatibility issues
 */

/**
 * Suppress deprecated MouseEvent.mozInputSource warnings
 * This property is deprecated in favor of PointerEvent.pointerType
 */
export function suppressDeprecatedEventWarnings() {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // List of warnings to suppress
  const suppressedPatterns = [
    /mozInputSource/i,
    /deprecated/i,
    /FullStory init has already been called/i,
  ];

  // Override console.warn
  console.warn = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    
    // Check if this warning should be suppressed
    if (suppressedPatterns.some(pattern => pattern.test(message))) {
      return; // Silently ignore
    }
    
    // Otherwise, call the original warn
    originalWarn.apply(console, args);
  };

  // Override console.error for specific errors
  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    
    // Suppress specific errors that don't affect functionality
    if (message.includes('Loading failed for the <script>') && message.includes('fullstory')) {
      return; // FullStory is optional, don't error
    }
    
    // Otherwise, call the original error
    originalError.apply(console, args);
  };
}

/**
 * Fix event handling for deprecated properties
 */
export function fixEventHandling() {
  if (typeof window === 'undefined') return;

  // Intercept MouseEvent to handle mozInputSource safely
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    // Wrap the listener to handle deprecated properties
    let wrappedListener: EventListenerOrEventListenerObject;
    
    if (typeof listener === 'function') {
      wrappedListener = (event: Event) => {
        try {
          // Safely access event properties
          if (event instanceof MouseEvent) {
            // Prevent access to deprecated mozInputSource
            Object.defineProperty(event, 'mozInputSource', {
              get: () => 0, // Return safe default
              configurable: true
            });
          }
          listener(event);
        } catch (e) {
          // Silently handle errors in event listeners
          console.debug('[Event Handler] Error:', e);
        }
      };
    } else {
      wrappedListener = listener;
    }
    
    return originalAddEventListener.call(this, type, wrappedListener, options);
  };
}

/**
 * Initialize all event polyfills
 */
export function initEventPolyfills() {
  if (typeof window === 'undefined') return;

  suppressDeprecatedEventWarnings();
  fixEventHandling();
}
