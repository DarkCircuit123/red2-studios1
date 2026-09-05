import { BaseCrudService } from '@/integrations';

// Helper to extract IP address from request headers
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // NOTE: The Wix @wix/members SDK does not provide server-side
    // getMyMember method or password verification. These are only available
    // through the frontend @wix/site-members module. This endpoint cannot
    // verify credentials or retrieve member information on the server side.
    return new Response(
      JSON.stringify({ message: 'Password change is not available at this time' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login for change password error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
