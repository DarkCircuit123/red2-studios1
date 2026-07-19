import { getSecureContext } from '@wix/sdk';
import { members } from '@wix/members';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(
        JSON.stringify({ message: 'Password is required to delete account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the secure context for backend operations
    const context = getSecureContext();
    const membersClient = members(context);

    // Get current member
    const currentMember = await membersClient.getCurrentMember({ fieldsets: ['FULL'] });
    
    if (!currentMember?.member?._id) {
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the member account
    try {
      await membersClient.deleteMember(currentMember.member._id);

      return new Response(
        JSON.stringify({ message: 'Account deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Account deletion error:', error);
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
