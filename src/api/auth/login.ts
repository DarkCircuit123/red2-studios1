import { members } from '@wix/members';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'jordanzuniga@gmail.com';
const ADMIN_PASSWORD = 'Iloveanna1!';

export async function POST(context: any) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { email, password, returnToUrl } = body;
    
    // If email and password are provided, use them for authentication
    if (email && password) {
      console.log('[LOGIN API] Authenticating with email/password...');
      
      // Check for hardcoded admin credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('[LOGIN API] Admin credentials matched - setting admin session');
        
        // Create admin session token
        const adminSessionToken = `admin_hardcoded_${Date.now()}`;
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        const setCookieHeader = `admin_session=${adminSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`;
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Admin login successful',
          isAdmin: true
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': setCookieHeader
          },
        });
      }
      
      // Get the Wix SDK context from locals (provided by @wix/astro integration)
      const wixContext = context.locals;
      const membersClient = members(wixContext);
      
      try {
        // Attempt to authenticate with email and password
        const result = await membersClient.authenticate({
          email,
          password,
        });
        
        console.log('[LOGIN API] Authentication successful');
        
        // Return success response
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Login successful'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (authError) {
        console.error('[LOGIN API] Authentication failed:', authError);
        
        // Return authentication error
        return new Response(JSON.stringify({ 
          error: 'Invalid email or password. Please try again.'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Otherwise, use the standard Wix login flow (redirect to Wix login page)
    console.log('[LOGIN API] Using standard Wix login flow...');
    const wixContext = context.locals;
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
    console.error('[LOGIN API] Error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(context: any) {
  // GET requests should use the standard Wix login flow
  const { returnToUrl } = context.url.searchParams;
  
  try {
    const wixContext = context.locals;
    const membersClient = members(wixContext);
    
    const loginUrl = await membersClient.generateLoginUrl({
      redirectUrl: returnToUrl ? decodeURIComponent(returnToUrl) : '/',
    });

    return new Response(null, {
      status: 302,
      headers: {
        'Location': loginUrl,
      },
    });
  } catch (error) {
    console.error('[LOGIN API] GET error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
