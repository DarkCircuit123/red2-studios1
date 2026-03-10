import { logger } from './debug-logger';

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

export function initializeChunkErrorRecovery(config: Partial<ChunkErrorConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const stored = sessionStorage.getItem(RELOAD_ATTEMPTS_KEY);
  reloadAttempts = stored ? parseInt(stored, 10) : 0;

  // Only listen for chunk errors - NOT for "Failed to fetch" errors from dynamic imports
  // since we now use static imports for Router
  window.addEventListener('error', (event: ErrorEvent) => {
    if (isChunkError(event.error) && !event.error?.message?.includes('Router')) {
      handleChunkError(event.error, finalConfig);
    }
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isChunkError(event.reason) && !event.reason?.message?.includes('Router')) {
      handleChunkError(event.reason, finalConfig);
    }
  });
}

function isChunkError(error: any): boolean {
  const message = error?.message || '';
  return (
    message.includes('Failed to fetch') ||
    message.includes('dynamically imported') ||
    message.includes('chunk') ||
    message.includes('loading chunk')
  );
}

function handleChunkError(error: any, config: ChunkErrorConfig) {
  logger.warn('Chunk error detected:', error.message, { module: 'ChunkErrorRecovery' });

  if (reloadAttempts < config.maxReloadAttempts) {
    reloadAttempts++;
    sessionStorage.setItem(RELOAD_ATTEMPTS_KEY, String(reloadAttempts));

    logger.debug(
      `Attempting recovery (${reloadAttempts}/${config.maxReloadAttempts})...`,
      {},
      { module: 'ChunkErrorRecovery' }
    );

    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    setTimeout(() => {
      window.location.reload();
    }, config.reloadDelay);
  } else {
    logger.error('Max reload attempts reached. Manual intervention required.', {}, { module: 'ChunkErrorRecovery' });
    sessionStorage.removeItem(RELOAD_ATTEMPTS_KEY);

    showChunkErrorMessage();
  }
}

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

export function resetReloadAttempts() {
  reloadAttempts = 0;
  sessionStorage.removeItem(RELOAD_ATTEMPTS_KEY);
}
