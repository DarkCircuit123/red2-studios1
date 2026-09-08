import { BaseCrudService } from '@/integrations';
import { APIRateLimits, ContactSubmissions } from '@/entities';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_IP = 5; // Max 5 messages per IP per hour
const IP_RANGE_SIZE = 3; // Check /24 subnet (last 3 octets)

/**
 * Extract IP range from full IP (e.g., "192.168.1.100" -> "192.168.1")
 */
function getIPRange(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return parts.slice(0, IP_RANGE_SIZE).join('.');
  }
  return ipAddress;
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check if IP has exceeded rate limit
 */
async function checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const ipRange = getIPRange(ipAddress);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // Get all recent attempts from this IP range
    const result = await BaseCrudService.getAll<APIRateLimits>('apiratelimits', [], { limit: 100 });
    
    const recentAttempts = result.items.filter((log) => {
      const logIP = log.ipAddress || '';
      const logRange = getIPRange(logIP);
      const attemptTime = log.attemptedAt ? new Date(log.attemptedAt) : null;
      
      return (
        logRange === ipRange &&
        attemptTime &&
        attemptTime >= oneHourAgo &&
        log.endpoint === 'contact-form'
      );
    });

    // Check if limit exceeded
    if (recentAttempts.length >= MAX_REQUESTS_PER_IP) {
      return {
        allowed: false,
        reason: `Too many messages from your IP range. Please try again later.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[Rate Limit Check] Error:', error);
    // Allow on error to prevent blocking legitimate users
    return { allowed: true };
  }
}

/**
 * Log contact form submission attempt
 */
async function logSubmissionAttempt(
  ipAddress: string,
  success: boolean,
  userAgent: string
): Promise<void> {
  try {
    await BaseCrudService.create('apiratelimits', {
      _id: crypto.randomUUID(),
      identifier: getIPRange(ipAddress),
      endpoint: 'contact-form',
      attemptedAt: new Date(),
      success,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('[Submission Logging] Error:', error);
  }
}

/**
 * Validate email format with strict rules
 */
function validateEmail(email: string): boolean {
  // RFC 5322 simplified email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Check local part length (max 64 chars)
  if (localPart.length > 64) {
    return false;
  }

  // Check domain length (max 255 chars)
  if (domain.length > 255) {
    return false;
  }

  // Reject common disposable email patterns
  const disposableDomains = ['tempmail', 'guerrillamail', '10minutemail', 'mailinator'];
  const domainLower = domain.toLowerCase();
  if (disposableDomains.some(d => domainLower.includes(d))) {
    return false;
  }

  // Reject consecutive dots
  if (email.includes('..')) {
    return false;
  }

  return true;
}

export async function POST({ request }: { request: Request }) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limit
    const rateCheckResult = await checkRateLimit(clientIP);
    if (!rateCheckResult.allowed) {
      // Log failed attempt
      await logSubmissionAttempt(clientIP, false, userAgent);

      return new Response(
        JSON.stringify({
          success: false,
          error: rateCheckResult.reason || 'Rate limit exceeded',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate all fields are present
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'All required fields must be filled',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    if (!validateEmail(email.trim())) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate message length (prevent spam)
    if (message.trim().length < 10) {
      await logSubmissionAttempt(clientIP, false, userAgent);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message must be at least 10 characters',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log successful attempt
    await logSubmissionAttempt(clientIP, true, userAgent);

    // Persist the submission so it durably survives. Previously this endpoint
    // validated the form and applied rate limiting, but never actually saved
    // the message anywhere - every contact form submission was silently
    // discarded after a "success" response was returned to the visitor.
    console.log(`[CONTACT_SUBMISSION] Saving submission from ${email.trim()}...`);
    await BaseCrudService.create<ContactSubmissions>('contactsubmissions', {
      _id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || '',
      message: message.trim(),
      ipAddress: clientIP,
      userAgent,
      submittedAt: new Date(),
      status: 'new',
    });
    console.log('[CONTACT_SUBMISSION] Submission saved successfully');

    // NOTE: Outbound email notification (e.g. alerting the business owner) is
    // NOT wired up here - no email service/API key is configured in this
    // environment. The submission is now durably saved in the
    // `contactsubmissions` CMS collection; sending a notification email is a
    // separate, still-open follow-up item.

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message received successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Contact Submission] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
