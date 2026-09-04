# Booking System Email Setup Guide

## Overview
The booking system has been updated to use **Wix's built-in triggered email system** instead of external email providers. This guide explains how to set up the triggered email template in your Wix dashboard.

## What Changed
- ✅ Removed dependency on external email services (SendGrid, Mailgun, AWS SES)
- ✅ Integrated with Wix's native `wix-crm-backend` triggered emails
- ✅ Admin notifications now sent via Wix infrastructure
- ✅ Booking form still validates fields and shows success confirmation

## Setup Instructions

### Step 1: Create a Triggered Email Template in Wix Dashboard

1. Go to your **Wix Business Manager Dashboard**
2. Navigate to **Marketing** → **Emails** (or **CRM** → **Emails**)
3. Click **Create Email** or **New Email**
4. Select **Triggered Email** as the email type
5. Choose **Contact** as the trigger source

### Step 2: Configure the Email Template

**Template Name:** `booking_notification`

**Recipient:** `jordanzuniga@gmail.com`

**Subject Line:**
```
New Red2 Studios Booking Request
```

**Email Body:**
Use the following template with the variable placeholders:

```
Hello,

A new booking request has been submitted:

CLIENT INFORMATION:
Name: {{name}}
Email: {{email}}
Phone: {{phone}}

SESSION DETAILS:
Session Type: {{sessionType}}
Requested Time: {{dateTime}}

ADDITIONAL NOTES:
{{notes}}

---

Please respond to this booking request at your earliest convenience.

Best regards,
Red2 Studios Booking System
```

### Step 3: Configure Template Variables

In the Wix email editor, ensure these variables are set up:

| Variable | Type | Description |
|----------|------|-------------|
| `{{name}}` | Text | Client's full name |
| `{{email}}` | Text | Client's email address |
| `{{phone}}` | Text | Client's phone number |
| `{{sessionType}}` | Text | Type of photography session |
| `{{dateTime}}` | Text | Formatted date and time |
| `{{notes}}` | Text | Additional notes/message from client |

### Step 4: Save and Activate

1. Click **Save** to save the template
2. Make sure the template is **Active/Enabled**
3. Test the template by submitting a booking through the website

## How It Works

### Frontend Flow (BookingPage.tsx)
1. User selects a booking slot
2. User fills in their details (name, email, phone, notes)
3. User clicks "Confirm Booking"
4. Form validates required fields
5. `notifyAdminOfBooking()` is called with booking data
6. Success message is displayed

### Backend Flow (sendBookingNotification.ts)
1. Frontend calls the `notifyAdminOfBooking()` function
2. Function sends data to the Wix backend function
3. Backend function uses `wix-crm-backend.triggeredEmails.emailContact()`
4. Wix sends the triggered email to the admin

## Testing the Integration

1. Navigate to the **Booking** page on your website
2. Select an available time slot
3. Fill in your details:
   - Full Name: Test Name
   - Email: test@example.com
   - Phone: (555) 123-4567
   - Notes: Test booking
4. Click "Confirm Booking"
5. You should see a success message
6. Check your email at `jordanzuniga@gmail.com` for the booking notification

## Troubleshooting

### Email Not Received
- Verify the template name is exactly `booking_notification`
- Check that the template is **Active** in Wix
- Ensure the recipient email is correct: `jordanzuniga@gmail.com`
- Check your spam/junk folder

### Variables Not Populating
- Make sure all variable names match exactly (case-sensitive)
- Variables should be wrapped in `{{double curly braces}}`
- Verify variables are defined in the template settings

### Booking Submission Fails
- Check browser console for error messages
- Verify the Wix backend function is deployed
- Ensure the triggered email template exists and is active

## Files Modified

- **`/src/components/pages/BookingPage.tsx`** - Updated to use new email function
- **`/src/api/sendBookingNotification.ts`** - New frontend service for email notifications
- **Backend function** - Wix backend function using `wix-crm-backend.triggeredEmails`

## No External Configuration Needed

This implementation uses **only Wix's built-in infrastructure**:
- ✅ No API keys required
- ✅ No third-party email service accounts
- ✅ No additional configuration files
- ✅ All handled through Wix dashboard

## Support

For issues with Wix triggered emails, refer to:
- [Wix CRM Backend Documentation](https://www.wix.com/velo/reference/wix-crm-backend)
- [Wix Triggered Emails Guide](https://support.wix.com/en/article/about-triggered-emails)
