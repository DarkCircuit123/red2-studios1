// NOTE: The Wix @wix/members SDK does not provide server-side logout functionality.
// This endpoint simply redirects to home page.
// The frontend should handle clearing any client-side session data.

export async function POST(context: any) {
  try {
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
