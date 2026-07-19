import { getSecureContext } from '@wix/sdk';
import { members } from '@wix/members';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ message: 'Current password and new password are required' }),
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
    
    if (!currentMember?.member?.loginEmail) {
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update password using the Wix Members API
    // Note: The actual password update is handled through Wix's secure authentication flow
    // We use the updateMember method with password change
    try {
      await membersClient.updateMember(currentMember.member._id, {
        loginEmail: currentMember.member.loginEmail,
        password: newPassword,
      });

      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      // If direct password update fails, it might be because Wix requires re-authentication
      // In production, you would implement a proper password change flow
      console.error('Password update error:', error);
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
