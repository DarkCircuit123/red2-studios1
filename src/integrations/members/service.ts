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
 */
export const getCurrentMember = async (): Promise<Member | null> => {
  try {
    console.log('[MEMBER SERVICE] Loading current member...');
    const member = await members.getCurrentMember({ fieldsets: ["FULL"] });
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
      console.log('[MEMBER SERVICE] Expected auth error (no session)');
      return null;
    }

    // For any other error, log it for debugging but still return null gracefully
    console.error('[MEMBER SERVICE] Unexpected error loading member:', error);
    return null;
  }
};
