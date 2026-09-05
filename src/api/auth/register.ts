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
    const { email, password, clientName } = await request.json();

    // Validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({ message: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // LINE 68: RATE LIMIT CHECK - Register: 5 attempts per IP per hour
    const rateLimitWindow = 60 * 60 * 1000; // 1 hour
    const rateLimitCheck = await checkRateLimit(ipAddress, '/api/auth/register', 5, rateLimitWindow);
    
    if (!rateLimitCheck.allowed) {
      await logRateLimitAttempt(ipAddress, '/api/auth/register', false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({
          error: 'Too many attempts',
          retryAfter: rateLimitCheck.retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitCheck.retryAfter) } }
      );
    }

    // Get the context from locals (provided by @wix/astro integration)
    const context = locals;

    try {
      // NOTE: The Wix @wix/members SDK does not provide a server-side
      // createMember method. Member creation is only available through
      // the frontend @wix/site-members module. This endpoint cannot
      // create members on the server side.
      // For now, return an error indicating this functionality is not available.
      await logRateLimitAttempt(ipAddress, '/api/auth/register', false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({ message: 'Member registration is not available at this time' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Member creation error:', error);
      await logRateLimitAttempt(ipAddress, '/api/auth/register', false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({ message: 'Failed to create account. Please try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
