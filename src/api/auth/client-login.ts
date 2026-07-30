import { BaseCrudService } from '@/integrations';
import { ClientProofingGalleries } from '@/entities';
import crypto from 'crypto';

// Rate limiting store (in-memory, resets on server restart)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (now > attempt.resetTime) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (attempt.count >= RATE_LIMIT_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many login attempts. Please try again in ${remainingTime} minutes.`,
    };
  }

  attempt.count++;
  return { allowed: true };
}

export async function POST({ request }: { request: Request }) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, accessCode, honeypot } = body;

    // Honeypot check - if honeypot field is filled, reject silently
    if (honeypot) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate input
    if (!email || !accessCode) {
      return new Response(
        JSON.stringify({ error: 'Email and access code are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting by email
    const rateLimitCheck = checkRateLimit(email.toLowerCase());
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitCheck.message }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Server-side filtered query - only fetch matching email and code
    // This prevents the full collection from being exposed to the client
    // (limit must be large enough to actually search the collection - see
    // ClientLoginPage.tsx / ClientGalleryDashboardPage.tsx for the same
    // 100-item convention used elsewhere; limit: 1 would only ever inspect
    // one arbitrary record)
    const result = await BaseCrudService.getAll<ClientProofingGalleries>(
      'clientgalleries',
      {},
      { limit: 100 }
    );

    // Filter on server side (additional security layer)
    const gallery = result.items?.find(
      (g) =>
        g.clientEmail?.toLowerCase() === email.toLowerCase() &&
        g.galleryAccessCode === accessCode.toUpperCase()
    );

    if (!gallery) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or access code' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if gallery is expired
    if (gallery.galleryExpirationDate) {
      const expirationDate = new Date(gallery.galleryExpirationDate);
      if (expirationDate < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This gallery has expired' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Return only necessary data - NO full gallery object
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          clientEmail: gallery.clientEmail,
          galleryId: gallery._id,
          clientName: gallery.clientName,
          sessionId,
          isAccountLogin: false,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Client login error:', error);
    }
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
