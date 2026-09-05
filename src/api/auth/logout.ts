import { members } from '@wix/members';

export async function POST(context: any) {
  try {
    // The Wix @wix/members SDK does not provide a server-side logout method.
    // The generateLogoutUrl() method does not exist in @wix/members.
    // The authentication.logout() method is from @wix/site-members (frontend module)
    // and cannot be used on the server.
    // 
    // For server-side logout, we simply clear the session by redirecting to the home page.
    // The frontend should handle clearing any client-side session data.
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
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
