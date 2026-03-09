/**
 * Chunk Error Recovery System
 * Automatically recovers from chunk loading failures by reloading the page
 */

interface ChunkErrorConfig {
  maxReloadAttempts: number;
  reloadDelay: number;
}

const DEFAULT_CONFIG: ChunkErrorConfig = {
  maxReloadAttempts: 3,
  reloadDelay: 1000,
};

let reloadAttempts = 0;
const RELOAD_ATTEMPTS_KEY = 'chunk_reload_attempts';

/**
 * Initialize chunk error recovery
 */
export function initializeChunkErrorRecovery(config: Partial<ChunkErrorConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Get stored reload attempts from sessionStorage
  const stored = sessionStorage.getItem(RELOAD_ATTEMPTS_KEY);
  reloadAttempts = stored ? parseInt(stored, 10) : 0;

  // Listen for chunk loading errors
  window.addEventListener('error', (event: ErrorEvent) => {
    if (isChunkError(event.error)) {
      handleChunkError(event.error, finalConfig);
    }
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isChunkError(event.reason)) {
      handleChunkError(event.reason, finalConfig);
    }
  });

  console.log('[ChunkErrorRecovery] Initialized');
}

/**
 * Check if error is a chunk loading error
 */
function isChunkError(error: any): boolean {
  const message = error?.message || '';
  return (
    message.includes('Failed to fetch') ||
    message.includes('dynamically imported') ||
    message.includes('chunk') ||
    message.includes('loading chunk')
  );
}

/**
 * Handle chunk error with recovery strategy
 */
function handleChunkError(error: any, config: ChunkErrorConfig) {
  console.warn('[ChunkErrorRecovery] Chunk error detected:', error.message);

  if (reloadAttempts < config.maxReloadAttempts) {
    reloadAttempts++;
    sessionStorage.setItem(RELOAD_ATTEMPTS_KEY, String(reloadAttempts));

    console.log(
      `[ChunkErrorRecovery] Attempting recovery (${reloadAttempts}/${config.maxReloadAttempts})...`
    );

    // Clear module cache to force fresh load
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    // Reload after delay
    setTimeout(() => {
      window.location.reload();
    }, config.reloadDelay);
  } else {
    // Max attempts reached
    console.error('[ChunkErrorRecovery] Max reload attempts reached. Manual intervention required.');
    sessionStorage.removeItem(RELOAD_ATTEMPTS_KEY);

    // Show error message to user
    showChunkErrorMessage();
  }
}

/**
 * Show error message to user
 */
function showChunkErrorMessage() {
  const message = document.createElement('div');
  message.id = 'chunk-error-message';
  message.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    text-align: center;
  `;

  content.innerHTML = `
    <h2 style="margin: 0 0 1rem 0; color: #333;">Application Error</h2>
    <p style="margin: 0 0 1.5rem 0; color: #666;">
      We encountered a persistent loading error. Please try clearing your browser cache and reloading.
    </p>
    <button onclick="location.reload()" style="
      background: #860f0f;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    ">
      Reload Page
    </button>
  `;

  message.appendChild(content);
  document.body.appendChild(message);
}

/**
 * Reset reload attempts (call after successful load)
 */
export function resetReloadAttempts() {
  reloadAttempts = 0;
  sessionStorage.removeItem(RELOAD_ATTEMPTS_KEY);
}
