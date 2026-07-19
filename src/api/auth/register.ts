import { getSecureContext } from '@wix/sdk';
import { members } from '@wix/members';

export async function POST(request: Request) {
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

    // Get the secure context for backend operations
    const context = getSecureContext();
    const membersClient = members(context);

    try {
      // Create new member with email and password
      const newMember = await membersClient.createMember({
        loginEmail: email,
        password: password,
        profile: {
          nickname: clientName || email.split('@')[0],
        },
      });

      if (!newMember?.member?._id) {
        return new Response(
          JSON.stringify({ message: 'Failed to create member account' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Account created successfully',
          memberId: newMember.member._id,
          email: newMember.member.loginEmail,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Member creation error:', error);

      // Handle specific error cases
      if (error?.message?.includes('email') || error?.message?.includes('already')) {
        return new Response(
          JSON.stringify({ message: 'Email address is already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (error?.message?.includes('password')) {
        return new Response(
          JSON.stringify({ message: 'Password does not meet security requirements' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

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
