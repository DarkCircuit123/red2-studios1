import { getSecureContext } from '@wix/sdk';
import { members } from '@wix/members';
import { BaseCrudService } from '@/integrations';

// Helper to extract IP address from request headers
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Helper to check rate limits
async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Query rate limit collection for recent attempts
    const { items } = await BaseCrudService.getAll('apiratelimits', {}, { limit: 100 });
    
    const recentAttempts = items.filter(
      (item: any) =>
        item.identifier === identifier &&
        item.endpoint === endpoint &&
        new Date(item.attemptedAt) > windowStart
    );

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = new Date(
        Math.min(...recentAttempts.map((a: any) => new Date(a.attemptedAt).getTime()))
      );
      const retryAfter = Math.ceil((oldestAttempt.getTime() + windowMs - now.getTime()) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request to proceed
    return { allowed: true };
  }
}

// Helper to log rate limit attempt
async function logRateLimitAttempt(
  identifier: string,
  endpoint: string,
  success: boolean,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    await BaseCrudService.create('apiratelimits', {
      _id: crypto.randomUUID(),
      identifier,
      endpoint,
      attemptedAt: new Date(),
      success,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log rate limit attempt:', error);
  }
}

// Helper to log password change attempt
async function logPasswordChangeAttempt(
  memberId: string,
  success: boolean,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    await BaseCrudService.create('passwordchangelog', {
      _id: crypto.randomUUID(),
      memberId,
      attemptedAt: new Date(),
      success,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log password change attempt:', error);
  }
}

export async function POST({ request }: { request: Request }) {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ message: 'Authorization token and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ message: 'New password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the secure context for backend operations
    const context = getSecureContext();
    const membersClient = members(context);

    // Get current member
    const currentMember = await membersClient.getCurrentMember({ fieldsets: ['FULL'] });
    
    if (!currentMember?.member?.loginEmail || !currentMember?.member?._id) {
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const memberId = currentMember.member._id;

    // RATE LIMIT CHECK - Update password: 10 attempts per member per hour
    const rateLimitWindow = 60 * 60 * 1000; // 1 hour
    const rateLimitCheck = await checkRateLimit(memberId, '/api/auth/update-password', 10, rateLimitWindow);
    
    if (!rateLimitCheck.allowed) {
      await logRateLimitAttempt(memberId, '/api/auth/update-password', false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({
          error: 'Too many attempts',
          retryAfter: rateLimitCheck.retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitCheck.retryAfter) } }
      );
    }

    // VALIDATE AUTHORIZATION TOKEN
    // Verify that the token exists, is not expired, has not been used, and belongs to the current member
    // NO PASSWORD VERIFICATION HERE - verification happened via real Wix login in ClientLoginPage
    let tokenValid = false;
    let tokenRecord: any = null;
    try {
      // Query the password_change_authorizations collection for the token
      const { items } = await BaseCrudService.getAll('passwordchangeauthorizations', {}, { limit: 100 });
      
      tokenRecord = items.find((item: any) => item.token === token);
      
      if (!tokenRecord) {
        await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
        return new Response(
          JSON.stringify({ message: 'Fresh authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify token belongs to current member
      if (tokenRecord.memberId !== memberId) {
        await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
        return new Response(
          JSON.stringify({ message: 'Fresh authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify token has not expired
      const now = new Date();
      const expiresAt = new Date(tokenRecord.expiresAt);
      if (now > expiresAt) {
        await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
        return new Response(
          JSON.stringify({ message: 'Fresh authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify token has not been used
      if (tokenRecord.used === true) {
        await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
        return new Response(
          JSON.stringify({ message: 'Fresh authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      tokenValid = true;
    } catch (error) {
      console.error('Token validation error:', error);
      await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({ message: 'Fresh authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenValid) {
      await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({ message: 'Fresh authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // MARK TOKEN AS USED AND UPDATE PASSWORD
    // Update password using the Wix Members API
    try {
      // Mark the token as used to prevent replay attacks
      await BaseCrudService.update('passwordchangeauthorizations', {
        _id: tokenRecord._id,
        used: true,
      });

      // Update the password
      await membersClient.updateMember(currentMember.member._id, {
        loginEmail: currentMember.member.loginEmail,
        password: newPassword,
      });

      // Log successful password change
      await logPasswordChangeAttempt(memberId, true, ipAddress, userAgent);
      await logRateLimitAttempt(memberId, '/api/auth/update-password', true, ipAddress, userAgent);

      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Password update error:', error);
      await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
      await logRateLimitAttempt(memberId, '/api/auth/update-password', false, ipAddress, userAgent);
      
      return new Response(
        JSON.stringify({ message: 'Failed to update password. Please try again or contact support.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Update password error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
