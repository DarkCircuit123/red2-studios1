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

  // Chunk error recovery disabled - let errors propagate normally
  logger.debug('Chunk error recovery initialized (passive mode)', {}, { module: 'ChunkErrorRecovery' });
}

function isChunkError(error: any): boolean {
  // Disabled
  return false;
}

function handleChunkError(error: any, config: ChunkErrorConfig) {
  // Disabled
}

function showChunkErrorMessage() {
  // Disabled
}

export function resetReloadAttempts() {
  reloadAttempts = 0;
  sessionStorage.removeItem(RELOAD_ATTEMPTS_KEY);
}
