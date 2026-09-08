import { BaseCrudService } from '@/integrations';
import { APIRateLimits, ContactSubmissions } from '@/entities';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 5;
const IP_RANGE_SIZE = 3;
const MAX_BODY_BYTES = 32 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;

function getIPRange(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) return parts.slice(0, IP_RANGE_SIZE).join('.');
  return ipAddress;
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

async function checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const ipRange = getIPRange(ipAddress);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - RATE_LIMIT_WINDOW);
    const result = await BaseCrudService.getAll<APIRateLimits>('apiratelimits', [], { limit: 100 });
    const recentAttempts = result.items.filter((log) => {
      const logIP = log.ipAddress || '';
      const attemptTime = log.attemptedAt ? new Date(log.attemptedAt) : null;
      return getIPRange(logIP) === ipRange && !!attemptTime && attemptTime >= oneHourAgo && log.endpoint === 'contact-form';
    });

    if (recentAttempts.length >= MAX_REQUESTS_PER_IP) {
      return { allowed: false, reason: 'Too many messages from your IP range. Please try again later.' };
    }
    return { allowed: true };
  } catch (error) {
    console.error('[Rate Limit Check] Error:', error instanceof Error ? error.message : String(error));
    return { allowed: true };
  }
}

async function logSubmissionAttempt(ipAddress: string, success: boolean, userAgent: string): Promise<void> {
  try {
    await BaseCrudService.create('apiratelimits', {
      _id: crypto.randomUUID(),
      identifier: getIPRange(ipAddress),
      endpoint: 'contact-form',
      attemptedAt: new Date(),
      success,
      ipAddress,
      userAgent: userAgent.substring(0, 512),
    });
  } catch (error) {
    console.error('[Submission Logging] Error:', error instanceof Error ? error.message : String(error));
  }
}

function validateEmail(email: string): boolean {
  if (email.length > MAX_EMAIL_LENGTH) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain || localPart.length > 64 || domain.length > 255) return false;
  if (email.includes('..')) return false;
  const disposableDomains = ['tempmail', 'guerrillamail', '10minutemail', 'mailinator'];
  return !disposableDomains.some((d) => domain.toLowerCase().includes(d));
}

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      return jsonResponse({ success: false, error: 'Content-Type must be application/json' }, 415);
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > MAX_BODY_BYTES) {
      return jsonResponse({ success: false, error: 'Request body is too large' }, 413);
    }

    const clientIP = getClientIP(request).slice(0, 128);
    const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 512);

    const rateCheckResult = await checkRateLimit(clientIP);
    if (!rateCheckResult.allowed) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: rateCheckResult.reason || 'Rate limit exceeded' }, 429);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
    }

    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    const subject = typeof input.subject === 'string' ? input.subject.trim() : '';
    const message = typeof input.message === 'string' ? input.message.trim() : '';

    if (!name || !email || !message) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'All required fields must be filled' }, 400);
    }

    if (name.length > MAX_NAME_LENGTH || email.length > MAX_EMAIL_LENGTH || subject.length > MAX_SUBJECT_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'One or more fields exceed the allowed length' }, 400);
    }

    if (!validateEmail(email)) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'Invalid email address' }, 400);
    }

    if (message.length < 10) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return jsonResponse({ success: false, error: 'Message must be at least 10 characters' }, 400);
    }

    await BaseCrudService.create<ContactSubmissions>('contactsubmissions', {
      _id: crypto.randomUUID(),
      name,
      email,
      subject,
      message,
      ipAddress: clientIP,
      userAgent,
      submittedAt: new Date(),
      status: 'new',
    });
    await logSubmissionAttempt(clientIP, true, userAgent);

    return jsonResponse({ success: true, message: 'Message received successfully' }, 200);
  } catch (error) {
    console.error('[Contact Submission] Error:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ success: false, error: 'An error occurred processing your request' }, 500);
  }
}
