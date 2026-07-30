import { getSecureContext } from '@wix/sdk';
import { members } from '@wix/members';
import { authentication } from '@wix/members';
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

export async function POST({ request }: { request: Request }) {
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

    // Get the secure backend context
    const context = getSecureContext();
    const membersClient = members(context);
    const authClient = authentication(context);

    // Authenticate the user with their credentials
    // This verifies the password is correct
    let loginResult: any;
    try {
      loginResult = await authClient.login({
        loginEmail: email,
        password: password,
      });
    } catch (authError) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ message: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated member's details
    let currentMember: any;
    try {
      currentMember = await membersClient.getCurrentMember({ fieldsets: ['FULL'] });
    } catch (memberError) {
      console.error('Failed to get current member:', memberError);
      return new Response(
        JSON.stringify({ message: 'Failed to retrieve member information' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!currentMember?.member?._id || !currentMember?.member?.loginEmail) {
      return new Response(
        JSON.stringify({ message: 'Failed to retrieve member information' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const memberId = currentMember.member._id;

    // Generate a secure token for password change authorization
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const createdAt = new Date();

    // Write the token to password_change_authorizations using backend context (admin credentials)
    // This bypasses client-side collection permissions
    try {
      await BaseCrudService.create('passwordchangeauthorizations', {
        _id: crypto.randomUUID(),
        memberId,
        token,
        expiresAt,
        used: false,
        createdAt,
      });
    } catch (tokenError) {
      console.error('Failed to create authorization token:', tokenError);
      await logPasswordChangeAttempt(memberId, false, ipAddress, userAgent);
      return new Response(
        JSON.stringify({ message: 'Failed to generate authorization token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful token generation
    await logPasswordChangeAttempt(memberId, true, ipAddress, userAgent);

    // Return the token to the client
    return new Response(
      JSON.stringify({
        message: 'Authentication successful',
        token,
        memberId,
        email: currentMember.member.loginEmail,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login for change password error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
