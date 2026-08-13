import { members } from '@wix/members';

export async function POST({ request, locals }: { request: Request; locals: any }) {
  try {
    const { nickname } = await request.json();

    // Validation
    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return new Response(
        JSON.stringify({ message: 'Nickname is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the context from locals (provided by @wix/astro integration)
    const context = locals;
    const membersClient = members(context);

    try {
      // Get current member
      const currentMember = await membersClient.getCurrentMember();

      if (!currentMember?.member?._id) {
        return new Response(
          JSON.stringify({ message: 'User not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update member profile with nickname only
      const updatedMember = await membersClient.updateMember(currentMember.member._id, {
        profile: {
          nickname: nickname.trim(),
        },
      });

      if (!updatedMember?.member) {
        return new Response(
          JSON.stringify({ message: 'Failed to update profile' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Profile updated successfully',
          member: {
            _id: updatedMember.member._id,
            profile: updatedMember.member.profile,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Member update error:', error);

      // Handle specific error cases
      if (error?.message?.includes('not authenticated') || error?.message?.includes('unauthorized')) {
        return new Response(
          JSON.stringify({ message: 'User not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Failed to update profile. Please try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
