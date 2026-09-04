import { members, authentication } from '@wix/members';
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

export async function POST({ request, locals }: { request: Request; locals: any }) {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(
        JSON.stringify({ message: 'Password is required to delete account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current member
    const currentMember = await members.getCurrentMember({ fieldsets: ['FULL'] });

    if (!currentMember?.member?._id || !currentMember?.member?.loginEmail) {
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const memberId = currentMember.member._id;

    // CRITICAL: the password field was previously only checked for being
    // non-empty - ANY non-empty string deleted the account, the "confirm
    // your password" prompt was pure UX theater with zero real
    // verification behind it. Mirrors the real check already used in
    // login-for-change-password.ts: attempt a real login with the
    // member's own email + the submitted password, which only succeeds
    // if the password is actually correct.
    try {
      await authentication.login({
        loginEmail: currentMember.member.loginEmail,
        password,
      });
    } catch (authError) {
      console.error('Delete account - password verification failed:', authError);
      return new Response(
        JSON.stringify({ message: 'Incorrect password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // LINE 71: RATE LIMIT CHECK - Delete account: 3 attempts per member per 24 hours
    const rateLimitWindow = 24 * 60 * 60 * 1000; // 24 hours
    const rateLimitCheck = await checkRateLimit(memberId, '/api/auth/delete-account', 3, rateLimitWindow);
    
    if (!rateLimitCheck.allowed) {
      await logRateLimitAttempt(memberId, '/api/auth/delete-account', false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({
          error: 'Too many attempts',
          retryAfter: rateLimitCheck.retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitCheck.retryAfter) } }
      );
    }

    // Delete the member account
    try {
      await members.deleteMember(currentMember.member._id);

      await logRateLimitAttempt(memberId, '/api/auth/delete-account', true, ipAddress, userAgent);

      return new Response(
        JSON.stringify({ message: 'Account deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Account deletion error:', error);
      await logRateLimitAttempt(memberId, '/api/auth/delete-account', false, ipAddress, userAgent);
      
      return new Response(
        JSON.stringify({ message: 'Failed to delete account. Please try again or contact support.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
