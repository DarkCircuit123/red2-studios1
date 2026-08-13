import type { APIRoute } from 'astro';
import { signAdminToken } from '@/lib/auth-security';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'jordanzuniga@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[LOGIN API] POST request received');
    console.log('[LOGIN API] Request URL:', request.url);
    console.log('[LOGIN API] Request method:', request.method);
    
    const body = await request.json().catch(() => ({}));
    const { email, password, returnToUrl } = body;
    
    console.log('[LOGIN API] Received credentials for email:', email);
    
    // If email and password are provided, use them for authentication
    if (email && password) {
      console.log('[LOGIN API] Authenticating with email/password...');
      
      // Check for hardcoded admin credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('[LOGIN API] ✓ Admin credentials matched - setting admin session');
        
        // Create signed admin session token
        const adminSessionToken = await signAdminToken('admin');
        
        console.log('[LOGIN API] ✓ Admin session token created (signed)');
        console.log('[LOGIN API] ✓ Setting admin_session cookie');
        
        // Set the cookie using Astro's cookies API with secure attributes
        cookies.set('admin_session', adminSessionToken, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          partitioned: true,
          maxAge: 1800, // 30 minutes
        });
        
        console.log('[LOGIN API] ✓ Cookie set successfully');
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Admin login successful',
          isAdmin: true,
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log('[LOGIN API] ✗ Credentials do not match admin credentials');
      
      // Return authentication error
      return new Response(JSON.stringify({ 
        error: 'Invalid email or password. Please try again.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[LOGIN API] No credentials provided');
    
    // Return error if no credentials
    return new Response(JSON.stringify({ 
      error: 'Email and password are required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[LOGIN API] ✗ Error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  console.log('[LOGIN API] GET request received');
  console.log('[LOGIN API] GET is not supported for login - use POST instead');
  
  return new Response(JSON.stringify({ 
    error: 'Method not allowed. Use POST to login.'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
