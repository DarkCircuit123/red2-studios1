# RED² Photography Booking System - Complete Setup Guide

## Overview

The booking system is now fully implemented with:
- ✅ Hardened BookingPage.tsx with CMS integration
- ✅ Atomic slot-locking mechanism (prevents double-booking)
- ✅ Honeypot field for bot detection
- ✅ Policy checkbox validation
- ✅ Pacific Time (PT) timezone conversion
- ✅ Focus-trap modal for accessibility
- ✅ 60-second polling for real-time slot updates
- ✅ EmailJS integration for notifications
- ✅ Dark RED2 branded email templates
- ✅ Client-side reconciliation and daily cleanup

## Files Created

### 1. **src/lib/emailjs-config.ts**
Configuration file for EmailJS credentials and settings.
- Contains placeholder values for your EmailJS credentials
- Validation function to check if credentials are configured

### 2. **src/lib/email-templates.ts**
HTML email templates with dark RED2 branding.
- Admin notification template (sent when booking is submitted)
- Customer confirmation template (sent to customer)
- Both templates use professional dark theme with RED primary color

### 3. **src/lib/booking-service.ts**
Core booking logic and utilities.
- `SlotLockManager`: Atomic slot-locking (15-minute locks)
- `validateHoneypot()`: Bot detection
- `convertToPTTimezone()`: Timezone conversion
- `generateConfirmationNumber()`: Unique booking reference
- `sendBookingEmails()`: EmailJS integration
- `processBookingSubmission()`: Main booking handler
- `setupPeriodicCleanup()`: Automatic lock cleanup
- `performDailyCleanup()`: Daily maintenance

### 4. **src/components/pages/BookingPage.tsx** (Updated)
Enhanced booking page with all security and UX features.
- Focus-trap modal (keyboard navigation)
- Honeypot field (hidden from users)
- Policy agreement checkbox
- Real-time slot locking feedback
- 60-second polling for availability
- Error and success states
- PT timezone display

## Setup Instructions

### Step 1: Create EmailJS Account

1. Go to **https://www.emailjs.com/**
2. Click **Sign Up** and create a free account
3. Verify your email address

### Step 2: Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add Service**
3. Choose your email provider:
   - **Gmail**: Recommended for ease of setup
   - **Outlook**: Alternative option
   - **Custom SMTP**: For self-hosted email

#### For Gmail:
1. Select **Gmail**
2. Click **Connect Account**
3. Sign in with your Gmail account
4. Grant EmailJS permission to send emails
5. Copy your **Service ID** (format: `service_xxxxx`)

### Step 3: Create Email Templates

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**

#### Template 1: Admin Notification
- **Template Name**: `booking_admin_notification`
- **Template ID**: `booking_admin_notification`
- **Subject**: `New Booking Submission - {{client_name}}`
- **Content**: Use the HTML from admin template (see below)

#### Template 2: Customer Confirmation
- **Template Name**: `booking_customer_confirmation`
- **Template ID**: `booking_customer_confirmation`
- **Subject**: `Your Booking is Confirmed - {{confirmation_number}}`
- **Content**: Use the HTML from customer template (see below)

### Step 4: Get Your Credentials

1. Go to **Account** > **API Keys**
2. Copy your **Public Key** (format: `xxxxx_xxxxxxxxxxxxxxx`)
3. You already have your **Service ID** from Step 2

### Step 5: Update Configuration

Edit **src/lib/emailjs-config.ts**:

```typescript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY_HERE',      // From Account > API Keys
  SERVICE_ID: 'YOUR_SERVICE_ID_HERE',      // From Email Services
  TEMPLATES: {
    ADMIN_NOTIFICATION: 'booking_admin_notification',
    CUSTOMER_CONFIRMATION: 'booking_customer_confirmation',
  },
  ADMIN_EMAIL: 'your-email@red2photography.com',
  FROM_EMAIL: 'noreply@red2photography.com',
  FROM_NAME: 'RED² Photography',
};
```

### Step 6: Test the System

1. Navigate to `/booking` page
2. Select a booking slot
3. Fill in the form with test data
4. Check the "I agree to the booking policy" checkbox
5. Click "Confirm Booking"
6. Check your email for confirmation

## Email Template Variables

### Admin Notification Template
Use these variables in your EmailJS template:

```
{{client_name}}      - Customer's full name
{{client_email}}     - Customer's email address
{{client_phone}}     - Customer's phone number
{{booking_date}}     - Formatted date (e.g., "Monday, July 13, 2026")
{{booking_time}}     - Time slot (e.g., "10:00 AM - 12:00 PM PT")
{{session_type}}     - Type of session (e.g., "Portrait Session")
{{notes}}            - Additional notes from customer
{{submission_time}}  - When booking was submitted (PT timezone)
```

### Customer Confirmation Template
Use these variables in your EmailJS template:

```
{{client_name}}           - Customer's full name
{{booking_date}}          - Formatted date
{{booking_time}}          - Time slot
{{session_type}}          - Type of session
{{confirmation_number}}   - Unique booking reference
{{admin_email}}           - Admin contact email
```

## Security Features

### 1. Honeypot Field
- Hidden input field that bots typically fill
- If filled, submission is rejected
- Prevents automated spam bookings

### 2. Atomic Slot Locking
- 15-minute locks prevent double-booking
- Lock is acquired when modal opens
- Lock is released after successful submission or timeout
- Automatic cleanup of expired locks every 5 minutes

### 3. Policy Agreement
- Users must check "I agree to the booking policy"
- Submission rejected if unchecked
- Protects against accidental bookings

### 4. Focus Trap Modal
- Keyboard navigation trapped within modal
- Escape key closes modal
- Tab navigation cycles through form fields
- Improves accessibility

### 5. Timezone Conversion
- All times displayed in PT (Pacific Time)
- Automatic conversion from user's local time
- Consistent across all emails and UI

## Features

### Real-Time Slot Locking
- When a slot is selected, it's locked for 15 minutes
- Other users see "Locked" status
- Prevents overbooking

### 60-Second Polling
- Booking availability updates every 60 seconds
- Ensures users see latest available slots
- Polling activates when modal is open

### Client-Side Reconciliation
- Automatic cleanup of expired locks
- Runs every 5 minutes
- Prevents stale locks from blocking slots

### Daily Cleanup
- `performDailyCleanup()` function for scheduled maintenance
- Can be called via cron job or scheduled task
- Cleans up all expired locks

## Troubleshooting

### Emails Not Sending

1. **Check credentials**:
   ```typescript
   // In browser console
   import { validateEmailJSConfig } from '@/lib/emailjs-config';
   validateEmailJSConfig(); // Should return true
   ```

2. **Verify EmailJS service**:
   - Go to EmailJS dashboard
   - Check Email Services are active
   - Test send a test email from dashboard

3. **Check template IDs**:
   - Ensure template IDs match exactly in config
   - Template IDs are case-sensitive

4. **Check browser console**:
   - Look for error messages
   - Check network tab for failed requests

### Slots Not Updating

1. **Check polling**:
   - Open browser console
   - Select a booking slot
   - Wait 60 seconds
   - Should see new data loaded

2. **Check CMS data**:
   - Verify booking slots exist in CMS
   - Check `isAvailable` field is set to `true`

### Modal Not Closing

1. **Check focus trap**:
   - Press Escape key
   - Should close modal

2. **Check form validation**:
   - Ensure all required fields are filled
   - Check policy checkbox is checked

## API Reference

### initializeEmailJS()
Initialize EmailJS on app startup.
```typescript
import { initializeEmailJS } from '@/lib/booking-service';
initializeEmailJS();
```

### setupPeriodicCleanup()
Setup automatic lock cleanup (call once on app startup).
```typescript
import { setupPeriodicCleanup } from '@/lib/booking-service';
setupPeriodicCleanup();
```

### processBookingSubmission()
Process a booking submission with all validations.
```typescript
const result = await processBookingSubmission(submission, sessionId);
if (result.success) {
  console.log('Confirmation #:', result.confirmationNumber);
} else {
  console.error('Error:', result.error);
}
```

### isSlotLocked()
Check if a slot is currently locked.
```typescript
if (isSlotLocked(slotId)) {
  console.log('Slot is locked');
}
```

### performDailyCleanup()
Run daily maintenance (call via cron job).
```typescript
import { performDailyCleanup } from '@/lib/booking-service';
await performDailyCleanup();
```

## Next Steps

1. ✅ **Setup EmailJS** (see instructions above)
2. ✅ **Update credentials** in `src/lib/emailjs-config.ts`
3. ✅ **Test the system** with a test booking
4. ✅ **Customize email templates** with your branding
5. ✅ **Setup daily cleanup** via cron job (optional)

## Support

For EmailJS support, visit: https://www.emailjs.com/docs/

For booking system issues, check the browser console for error messages.

---

**Status**: ✅ Ready for EmailJS credential setup
