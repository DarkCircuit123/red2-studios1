import { members as createMembersClient } from '@wix/members';

export async function POST(context: any) {
  try {
    // Get the Wix SDK context from locals (provided by @wix/astro integration)
    const wixContext = context.locals;
    
    // Get the logout URL from Wix Members API
    const membersClient = createMembersClient(wixContext);
    
    // Generate logout URL
    const logoutUrl = await membersClient.generateLogoutUrl({
      redirectUrl: '/',
    });

    // Redirect to the logout URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': logoutUrl,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(context: any) {
  return POST(context);
}
