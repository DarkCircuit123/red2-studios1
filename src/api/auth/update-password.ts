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

export async function POST({ request, locals }: { request: Request; locals: any }) {
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

    // NOTE: The Wix @wix/members SDK does not provide server-side
    // getMyMember or updateMember methods. These are only available
    // through the frontend @wix/site-members module. This endpoint cannot
    // update member passwords on the server side.
    return new Response(
      JSON.stringify({ message: 'Password update is not available at this time' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update password error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
