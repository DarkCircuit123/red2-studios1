import { defineEventHandler, getHeader } from 'h3';
import { getMemberById } from '@wix/members';
import { wixClient } from '@wix/sdk';

/**
 * Verify if the authenticated member has admin role
 * Backend verification for security - never rely on frontend checks alone
 */
export default defineEventHandler(async (event) => {
  try {
    // Get the authorization header
    const authHeader = getHeader(event, 'authorization');
    
    if (!authHeader) {
      return {
        isAdmin: false,
        error: 'No authorization header',
        status: 401
      };
    }

    // The member ID should be passed in the request body or extracted from token
    const body = await readBody(event);
    const memberId = body?.memberId;

    if (!memberId) {
      return {
        isAdmin: false,
        error: 'No member ID provided',
        status: 400
      };
    }

    // Initialize Wix client with the member's context
    const client = wixClient();

    // Get member data
    const member = await getMemberById(memberId, client);

    if (!member) {
      return {
        isAdmin: false,
        error: 'Member not found',
        status: 404
      };
    }

    // Check if member has admin role
    // Admin role is typically indicated by specific member properties
    // This can be customized based on your Wix setup
    const isAdmin = member.role === 'admin' || member.status === 'APPROVED';

    return {
      isAdmin,
      memberId,
      memberEmail: member.loginEmail,
      status: 200
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      isAdmin: false,
      error: 'Verification failed',
      status: 500
    };
  }
});
