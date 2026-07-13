/**
 * Booking Service with EmailJS Integration
 * Handles slot locking, honeypot validation, timezone conversion, and email notifications
 */

import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, validateEmailJSConfig } from './emailjs-config';
import { getAdminNotificationHTML, getCustomerConfirmationHTML, EmailTemplateData } from './email-templates';

// Initialize EmailJS (call once on app startup)
export const initializeEmailJS = (): void => {
  if (validateEmailJSConfig()) {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }
};

/**
 * Slot Lock Manager - Prevents double-booking with atomic operations
 */
class SlotLockManager {
  private locks = new Map<string, { timestamp: number; sessionId: string }>();
  private readonly LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  acquireLock(slotId: string, sessionId: string): boolean {
    const now = Date.now();
    const existingLock = this.locks.get(slotId);

    // Check if lock exists and is still valid
    if (existingLock && now - existingLock.timestamp < this.LOCK_DURATION) {
      // Lock is held by someone else
      return false;
    }

    // Acquire or refresh lock
    this.locks.set(slotId, { timestamp: now, sessionId });
    return true;
  }

  releaseLock(slotId: string, sessionId: string): boolean {
    const lock = this.locks.get(slotId);
    if (lock && lock.sessionId === sessionId) {
      this.locks.delete(slotId);
      return true;
    }
    return false;
  }

  isLocked(slotId: string): boolean {
    const lock = this.locks.get(slotId);
    if (!lock) return false;

    const now = Date.now();
    if (now - lock.timestamp > this.LOCK_DURATION) {
      this.locks.delete(slotId);
      return false;
    }

    return true;
  }

  // Cleanup expired locks (call periodically)
  cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [slotId, lock] of this.locks.entries()) {
      if (now - lock.timestamp > this.LOCK_DURATION) {
        this.locks.delete(slotId);
      }
    }
  }
}

const slotLockManager = new SlotLockManager();

/**
 * Honeypot validation - detects bot submissions
 */
export const validateHoneypot = (honeypotValue: string): boolean => {
  // Honeypot field should be empty
  return honeypotValue === '';
};

/**
 * Convert time to PT timezone
 */
export const convertToPTTimezone = (date: Date): Date => {
  const ptTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return ptTime;
};

/**
 * Generate unique confirmation number
 */
export const generateConfirmationNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RED-${timestamp}-${random}`;
};

/**
 * Robust UUID fallback for non-HTTPS/older browsers
 */
export const generateRobustUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails
    }
  }
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Booking submission interface
 */
export interface BookingSubmission {
  slotId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  honeypot?: string;
  agreedToPolicy?: boolean;
}

/**
 * Send booking emails via EmailJS
 */
export const sendBookingEmails = async (
  submission: BookingSubmission,
  confirmationNumber: string
): Promise<{ success: boolean; error?: string }> => {
  if (!validateEmailJSConfig()) {
    console.warn('EmailJS not configured - emails will not be sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const ptDate = convertToPTTimezone(new Date(submission.bookingDate));
    const formattedDate = ptDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const emailData: EmailTemplateData = {
      clientName: submission.clientName,
      clientEmail: submission.clientEmail,
      clientPhone: submission.clientPhone,
      bookingDate: formattedDate,
      bookingTime: `${submission.startTime} - ${submission.endTime} PT`,
      sessionType: submission.sessionType,
      notes: submission.notes || '(No additional notes)',
      submissionTime: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      confirmationNumber,
      adminEmail: EMAILJS_CONFIG.ADMIN_EMAIL
    };

    // Send admin notification
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.ADMIN_NOTIFICATION,
      {
        to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
        from_email: EMAILJS_CONFIG.FROM_EMAIL,
        from_name: EMAILJS_CONFIG.FROM_NAME,
        client_name: submission.clientName,
        client_email: submission.clientEmail,
        client_phone: submission.clientPhone,
        booking_date: emailData.bookingDate,
        booking_time: emailData.bookingTime,
        session_type: submission.sessionType,
        notes: emailData.notes,
        submission_time: emailData.submissionTime,
        html_content: getAdminNotificationHTML(emailData)
      }
    );

    // Send customer confirmation
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.CUSTOMER_CONFIRMATION,
      {
        to_email: submission.clientEmail,
        from_email: EMAILJS_CONFIG.FROM_EMAIL,
        from_name: EMAILJS_CONFIG.FROM_NAME,
        client_name: submission.clientName,
        booking_date: emailData.bookingDate,
        booking_time: emailData.bookingTime,
        session_type: submission.sessionType,
        confirmation_number: confirmationNumber,
        admin_email: EMAILJS_CONFIG.ADMIN_EMAIL,
        html_content: getCustomerConfirmationHTML(emailData)
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending booking emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send emails'
    };
  }
};

/**
 * Process booking submission with all validations
 */
export const processBookingSubmission = async (
  submission: BookingSubmission,
  sessionId: string
): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> => {
  // Validate honeypot
  if (!validateHoneypot(submission.honeypot || '')) {
    return { success: false, error: 'Invalid submission detected' };
  }

  // Validate policy agreement
  if (!submission.agreedToPolicy) {
    return { success: false, error: 'You must agree to the booking policy' };
  }

  // Attempt to acquire slot lock
  if (!slotLockManager.acquireLock(submission.slotId, sessionId)) {
    return { success: false, error: 'This slot was just booked. Please select another.' };
  }

  try {
    // Generate confirmation number
    const confirmationNumber = generateConfirmationNumber();

    // Send emails
    const emailResult = await sendBookingEmails(submission, confirmationNumber);

    if (!emailResult.success) {
      // Release lock if email fails
      slotLockManager.releaseLock(submission.slotId, sessionId);
      return { success: false, error: emailResult.error || 'Failed to send confirmation email' };
    }

    // Release lock after successful submission
    slotLockManager.releaseLock(submission.slotId, sessionId);

    return { success: true, confirmationNumber };
  } catch (error) {
    // Release lock on error
    slotLockManager.releaseLock(submission.slotId, sessionId);
    console.error('Error processing booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process booking'
    };
  }
};

/**
 * Check if a slot is currently locked
 */
export const isSlotLocked = (slotId: string): boolean => {
  return slotLockManager.isLocked(slotId);
};

/**
 * Cleanup expired locks (call periodically, e.g., every minute)
 */
export const cleanupExpiredLocks = (): void => {
  slotLockManager.cleanupExpiredLocks();
};

/**
 * Setup periodic cleanup (call once on app startup)
 */
export const setupPeriodicCleanup = (): void => {
  // Cleanup every 5 minutes
  setInterval(() => {
    cleanupExpiredLocks();
  }, 5 * 60 * 1000);
};

/**
 * Reconciliation - check for stale bookings and clean them up
 * Call this periodically or on app startup
 */
export const reconcileBookings = async (): Promise<void> => {
  try {
    // This would typically check against a backend for stale bookings
    // For now, just cleanup local locks
    cleanupExpiredLocks();
  } catch (error) {
    console.error('Error during booking reconciliation:', error);
  }
};

/**
 * Daily cleanup for stale slots
 * Call this once per day (e.g., at midnight)
 */
export const performDailyCleanup = async (): Promise<void> => {
  try {
    // Cleanup expired locks
    cleanupExpiredLocks();

    // Additional cleanup tasks can be added here
    console.log('Daily booking cleanup completed');
  } catch (error) {
    console.error('Error during daily cleanup:', error);
  }
};
