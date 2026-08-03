import { members } from '@wix/members';

export async function POST(context: any) {
  try {
    const { returnToUrl } = context.url.searchParams;
    
    // Get the Wix SDK context from locals (provided by @wix/astro integration)
    const wixContext = context.locals;
    
    // Get the login URL from Wix Members API
    const membersClient = members(wixContext);
    
    // Generate login URL - this will redirect to Wix login
    const loginUrl = await membersClient.generateLoginUrl({
      redirectUrl: returnToUrl ? decodeURIComponent(returnToUrl) : '/',
    });

    // Redirect to the login URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': loginUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(context: any) {
  return POST(context);
}
