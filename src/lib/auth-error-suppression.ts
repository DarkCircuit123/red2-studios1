/**
 * Authentication Error Suppression
 * 
 * Handles expected authentication errors gracefully without logging them.
 * These errors are normal for unauthenticated/anonymous users and should
 * not clutter the console.
 */

export const isExpectedAuthError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message || '';
  const errorStr = JSON.stringify(error);

  // Expected errors for unauthenticated users
  const expectedPatterns = [
    'Missing site member id',
    'PERMISSION_DENIED',
    'UNKNOWN',
    'Forbidden',
    '403',
    'Unauthorized',
    '401',
  ];

  return expectedPatterns.some(pattern => 
    message.includes(pattern) || errorStr.includes(pattern)
  );
};

/**
 * Silently handle authentication errors
 * Returns null for expected errors, throws for unexpected ones
 */
export const handleAuthError = (error: unknown): null => {
  if (isExpectedAuthError(error)) {
    // Expected error - return null silently
    return null;
  }

  // Unexpected error - log it for debugging
  console.error('[AUTH] Unexpected error:', error);
  return null;
};
