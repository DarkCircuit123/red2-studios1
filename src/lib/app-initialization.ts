/** Lightweight browser initialization and diagnostics. */

export interface InitializationStatus {
  isReady: boolean;
  errors: string[];
  warnings: string[];
}

const status: InitializationStatus = { isReady: false, errors: [], warnings: [] };
let initialized = false;
let cleanup: (() => void) | null = null;

export async function initializeApp(): Promise<InitializationStatus> {
  if (initialized) return { ...status, errors: [...status.errors], warnings: [...status.warnings] };
  initialized = true;

  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      status.errors.push('Browser APIs are not available');
      return { ...status, errors: [...status.errors], warnings: [...status.warnings] };
    }

    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
    }

    // Do not install global handlers that swallow runtime failures. Real
    // exceptions must remain visible to the browser and React error boundaries.
    cleanup = () => {};
    status.isReady = true;
    return { ...status, errors: [...status.errors], warnings: [...status.warnings] };
  } catch (error) {
    status.errors.push(error instanceof Error ? error.message : String(error));
    status.isReady = true;
    return { ...status, errors: [...status.errors], warnings: [...status.warnings] };
  }
}

export function disposeAppInitialization(): void {
  cleanup?.();
  cleanup = null;
  initialized = false;
}

export function getInitializationStatus(): InitializationStatus {
  return { ...status, errors: [...status.errors], warnings: [...status.warnings] };
}

export function isAppReady(): boolean {
  return status.isReady;
}
