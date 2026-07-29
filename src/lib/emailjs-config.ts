/**
 * EmailJS Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://www.emailjs.com/
 * 2. Sign up for a free account
 * 3. Add a new Email Service (Gmail, Outlook, or custom SMTP)
 * 4. Create two Email Templates:
 *    - Template ID: "booking_admin_notification"
 *    - Template ID: "booking_customer_confirmation"
 * 5. Copy your Service ID, Public Key, and Template IDs below
 * 
 * PLACEHOLDER VALUES - REPLACE WITH YOUR ACTUAL CREDENTIALS
 */

export const EMAILJS_CONFIG = {
  // Your EmailJS Public Key (found in Account > API Keys)
  PUBLIC_KEY: 'pvYRte4VcD3xgNO_B',
  
  // Your EmailJS Service ID (found in Email Services)
  SERVICE_ID: 'service_hfiysjg',
  
  // Template IDs for booking emails
  TEMPLATES: {
    // Admin notification when booking is submitted
    ADMIN_NOTIFICATION: 'booking_admin_notification',
    
    // Customer confirmation email
    CUSTOMER_CONFIRMATION: 'booking_customer_confirmation',
    
    // Contact form submission
    CONTACT_FORM: 'contact_form_submission',
  },
  
  // Admin email address (where booking notifications are sent)
  ADMIN_EMAIL: 'hello@red2studios.com',
  
  // From email (should match your EmailJS service)
  FROM_EMAIL: 'noreply@red2studios.com',
  
  // From name
  FROM_NAME: 'RED² Studios',
};

/**
 * Email Template Variables Reference
 * 
 * ADMIN NOTIFICATION TEMPLATE should use:
 * - {{client_name}} - Customer's full name
 * - {{client_email}} - Customer's email
 * - {{client_phone}} - Customer's phone
 * - {{booking_date}} - Formatted date (e.g., "Monday, July 13, 2026")
 * - {{booking_time}} - Time slot (e.g., "10:00 AM - 12:00 PM")
 * - {{session_type}} - Type of session (e.g., "Portrait Session")
 * - {{notes}} - Additional notes from customer
 * - {{submission_time}} - When booking was submitted
 * 
 * CUSTOMER CONFIRMATION TEMPLATE should use:
 * - {{client_name}} - Customer's full name
 * - {{booking_date}} - Formatted date
 * - {{booking_time}} - Time slot
 * - {{session_type}} - Type of session
 * - {{confirmation_number}} - Unique booking reference
 * - {{admin_email}} - Admin contact email
 */

export const validateEmailJSConfig = (): boolean => {
  const { PUBLIC_KEY, SERVICE_ID } = EMAILJS_CONFIG;
  
  if (PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY_HERE' || 
      SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID_HERE') {
    console.warn(
      '⚠️ EmailJS credentials not configured. Bookings will not send emails.\n' +
      'See src/lib/emailjs-config.ts for setup instructions.'
    );
    return false;
  }
  
  return true;
};
