/**
 * EmailJS configuration and typed send helpers
 * Single source of truth for EmailJS keys and service methods
 */

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_BOOKING_ADMIN_TEMPLATE = process.env.REACT_APP_EMAILJS_BOOKING_ADMIN_TEMPLATE || '';
const EMAILJS_BOOKING_CUSTOMER_TEMPLATE = process.env.REACT_APP_EMAILJS_BOOKING_CUSTOMER_TEMPLATE || '';
const EMAILJS_MEMBER_VERIFICATION_TEMPLATE = process.env.REACT_APP_EMAILJS_MEMBER_VERIFICATION_TEMPLATE || '';

// Validate configuration on load
if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
  console.warn('[emailjs-config] Missing EmailJS configuration. Email features will be disabled.');
}

interface EmailPayload {
  [key: string]: any;
}

/**
 * Send booking confirmation email to admin
 */
export async function sendBookingAdminEmail(payload: EmailPayload): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_BOOKING_ADMIN_TEMPLATE) {
    console.warn('[emailjs] Booking admin email skipped - missing configuration');
    return false;
  }

  try {
    // Dynamic import to avoid issues if emailjs is not available
    const emailjs = await import('@emailjs/browser');
    
    if (!emailjs.default.init) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
    }

    await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_BOOKING_ADMIN_TEMPLATE,
      payload
    );

    return true;
  } catch (err) {
    console.error('[emailjs] Failed to send booking admin email:', err);
    return false;
  }
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingCustomerEmail(payload: EmailPayload): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_BOOKING_CUSTOMER_TEMPLATE) {
    console.warn('[emailjs] Booking customer email skipped - missing configuration');
    return false;
  }

  try {
    const emailjs = await import('@emailjs/browser');
    
    if (!emailjs.default.init) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
    }

    await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_BOOKING_CUSTOMER_TEMPLATE,
      payload
    );

    return true;
  } catch (err) {
    console.error('[emailjs] Failed to send booking customer email:', err);
    return false;
  }
}

/**
 * Send member verification email
 */
export async function sendMemberVerificationEmail(payload: EmailPayload): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_MEMBER_VERIFICATION_TEMPLATE) {
    console.warn('[emailjs] Member verification email skipped - missing configuration');
    return false;
  }

  try {
    const emailjs = await import('@emailjs/browser');
    
    if (!emailjs.default.init) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
    }

    await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_MEMBER_VERIFICATION_TEMPLATE,
      payload
    );

    return true;
  } catch (err) {
    console.error('[emailjs] Failed to send member verification email:', err);
    return false;
  }
}

/**
 * Generic email send function
 */
export async function sendEmail(
  templateId: string,
  payload: EmailPayload
): Promise<boolean> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('[emailjs] Email send skipped - missing configuration');
    return false;
  }

  try {
    const emailjs = await import('@emailjs/browser');
    
    if (!emailjs.default.init) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
    }

    await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      templateId,
      payload
    );

    return true;
  } catch (err) {
    console.error('[emailjs] Failed to send email:', err);
    return false;
  }
}

export const emailjsConfig = {
  serviceId: EMAILJS_SERVICE_ID,
  publicKey: EMAILJS_PUBLIC_KEY,
  templates: {
    bookingAdmin: EMAILJS_BOOKING_ADMIN_TEMPLATE,
    bookingCustomer: EMAILJS_BOOKING_CUSTOMER_TEMPLATE,
    memberVerification: EMAILJS_MEMBER_VERIFICATION_TEMPLATE,
  },
};
