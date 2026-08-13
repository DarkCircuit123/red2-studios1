import { members } from "@wix/members";
import { Member } from ".";

/**
 * Check if an error is expected for unauthenticated users
 */
const isExpectedAuthError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message || '';
  const errorStr = JSON.stringify(error);

  // Expected errors for unauthenticated/anonymous users
  const expectedPatterns = [
    'Missing site member id',
    'PERMISSION_DENIED',
    'UNKNOWN',
    'Forbidden',
    '403',
    '401',
    'Unauthorized',
  ];

  return expectedPatterns.some(pattern => 
    message.includes(pattern) || errorStr.includes(pattern)
  );
};

/**
 * Get the current authenticated member
 * Returns null for unauthenticated users (expected case)
 * Only logs unexpected errors
 * 
 * CRITICAL FIX FOR ERR_NETWORK:
 * The Wix Members SDK makes internal network requests that fail for anonymous users.
 * These failures must be caught at the SDK boundary to prevent unhandled rejections
 * from reaching the global error handler, which triggers the Wix FallbackWidget ERR_NETWORK error.
 */
export const getCurrentMember = async (): Promise<Member | null> => {
  try {
    console.log('[MEMBER SERVICE] Loading current member...');
    
    // Wrap the SDK call in a try-catch to ensure errors are caught at the SDK boundary
    let member;
    try {
      member = await members.getCurrentMember({ fieldsets: ["FULL"] });
    } catch (sdkError) {
      // SDK threw an error - re-throw to be caught by outer try-catch
      // This ensures the error is handled gracefully and doesn't become an unhandled rejection
      throw sdkError;
    }
    
    if (!member) {
      console.log('[MEMBER SERVICE] No member session found (anonymous user)');
      return null; // No member session - normal for anonymous visitors
    }
    console.log('[MEMBER SERVICE] Member loaded successfully:', member.member?._id);
    return member.member;
  } catch (error) {
    // Check if this is an expected "no session" error
    if (isExpectedAuthError(error)) {
      // Expected - no member logged in, return null silently
      // This is normal for anonymous/unauthenticated visitors
      // Suppress the console.log to reduce noise during initial auth check
      return null;
    }

    // For any other error, log it for debugging but still return null gracefully
    console.error('[MEMBER SERVICE] Unexpected error loading member:', error);
    return null;
  }
};
