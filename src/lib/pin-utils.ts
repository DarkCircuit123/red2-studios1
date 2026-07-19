/**
 * PIN Utility Functions
 * Handles PIN generation, rotation, and validation
 */

/**
 * Generate a random 6-digit PIN
 */
export function generateRandomPIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate PIN format (6 digits)
 */
export function isValidPINFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Get PIN display format (with dashes for readability)
 */
export function formatPINForDisplay(pin: string): string {
  if (!isValidPINFormat(pin)) return pin;
  return `${pin.slice(0, 3)}-${pin.slice(3)}`;
}

/**
 * Check if PIN authorization is still valid
 * @param timestamp - The timestamp when authorization was granted
 * @param expiryMinutes - How many minutes the authorization is valid for (default: 30)
 */
export function isPINAuthorizationValid(timestamp: number, expiryMinutes: number = 30): boolean {
  const now = Date.now();
  const expiryMs = expiryMinutes * 60 * 1000;
  return now - timestamp < expiryMs;
}

/**
 * Get remaining time for PIN authorization in seconds
 */
export function getPINAuthorizationRemainingSeconds(timestamp: number, expiryMinutes: number = 30): number {
  const now = Date.now();
  const expiryMs = expiryMinutes * 60 * 1000;
  const remaining = expiryMs - (now - timestamp);
  return Math.max(0, Math.ceil(remaining / 1000));
}
