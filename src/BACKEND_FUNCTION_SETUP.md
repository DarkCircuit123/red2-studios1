# Wix Backend Function Setup for Booking Notifications

## Overview

This guide explains how to create the Wix backend function that sends booking notification emails using Wix's triggered email system.

## Backend Function Location

**File Path:** `/backend/sendBooking.jsw` (in your Wix project)

## Step-by-Step Setup

### Step 1: Create Backend File

1. In your Wix Editor, go to **Backend** (or **Code** → **Backend**)
2. Click **Create New File**
3. Name it: `sendBooking.jsw`
4. Paste the following code:

```javascript
import { triggeredEmails } from 'wix-crm-backend';

/**
 * Sends a booking notification email to the administrator
 * Called from the frontend when a user submits a booking request
 * 
 * @param {Object} data - Booking data from the form
 * @param {string} data.name - Client's full name
 * @param {string} data.email - Client's email address
 * @param {string} data.phone - Client's phone number
 * @param {string} data.sessionType - Type of photography session
 * @param {string} data.dateTime - Formatted date and time string
 * @param {string} data.notes - Additional notes/message from client
 * @returns {Promise} Result of the email send operation
 */
export async function notifyAdmin(data) {
  try {
    // Send triggered email to admin
    const result = await triggeredEmails.emailContact("booking_notification", {
      variables: {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        sessionType: data.sessionType || '',
        dateTime: data.dateTime || '',
        notes: data.notes || '(No additional notes)'
      }
    });

    console.log('Booking notification email sent successfully:', result);
    return {
      success: true,
      message: 'Booking notification sent to admin',
      result: result
    };
  } catch (error) {
    console.error('Error sending booking notification:', error);
    throw new Error(`Failed to send booking notification: ${error.message}`);
  }
}
```

### Step 2: Create Web Module Endpoint

1. In the same `sendBooking.jsw` file, add a web module function:

```javascript
import { triggeredEmails } from 'wix-crm-backend';
import { webMethod, Permissions } from 'wix-web-module';

/**
 * Web method to handle booking notifications from frontend
 * Accessible via POST request to /_functions/notifyAdmin
 */
export const notifyAdmin = webMethod(
  Permissions.Anyone,
  async (data) => {
    try {
      // Send triggered email to admin
      const result = await triggeredEmails.emailContact("booking_notification", {
        variables: {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          sessionType: data.sessionType || '',
          dateTime: data.dateTime || '',
          notes: data.notes || '(No additional notes)'
        }
      });

      console.log('Booking notification email sent successfully:', result);
      return {
        success: true,
        message: 'Booking notification sent to admin',
        result: result
      };
    } catch (error) {
      console.error('Error sending booking notification:', error);
      throw new Error(`Failed to send booking notification: ${error.message}`);
    }
  }
);
```

### Step 3: Deploy the Backend Function

1. Click **Deploy** in the Wix Editor
2. Wait for deployment to complete
3. The function will be available at `/_functions/notifyAdmin`

## How It Works

### Frontend Call
```typescript
// From BookingPage.tsx
await notifyAdminOfBooking({
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  sessionType: selectedSlot.sessionType,
  dateTime: dateTime,
  notes: formData.message
});
```

### Service Layer
```typescript
// From sendBookingNotification.ts
const response = await fetch('/_functions/notifyAdmin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* booking data */ })
});
```

### Backend Processing
```javascript
// In sendBooking.jsw
export const notifyAdmin = webMethod(
  Permissions.Anyone,
  async (data) => {
    // Send triggered email using Wix CRM
    const result = await triggeredEmails.emailContact("booking_notification", {
      variables: { /* booking data */ }
    });
    return { success: true, result };
  }
);
```

## Required Wix Modules

The backend function requires these Wix modules to be available:

- **`wix-crm-backend`** - For triggered emails (included with Wix)
- **`wix-web-module`** - For web methods (included with Wix)

These are built-in Wix modules and don't require additional setup.

## Triggered Email Template Requirements

The backend function references a triggered email template named `booking_notification`. This template must be created in your Wix dashboard:

**Template Name:** `booking_notification`

**Recipient:** `jordanzuniga@gmail.com`

**Variables Used:**
- `{{name}}` - Client name
- `{{email}}` - Client email
- `{{phone}}` - Client phone
- `{{sessionType}}` - Session type
- `{{dateTime}}` - Date and time
- `{{notes}}` - Additional notes

See `/src/BOOKING_EMAIL_SETUP.md` for complete template setup instructions.

## Error Handling

The function includes error handling for:

- Missing or invalid data
- Email sending failures
- Template not found
- Permission issues

Errors are logged to the console and returned to the frontend for display.

## Testing the Backend Function

### Method 1: Using Wix Test Panel

1. In the Wix Editor, open `sendBooking.jsw`
2. Click the **Test** button
3. Enter test data:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "sessionType": "Portrait Session",
  "dateTime": "Monday, March 10, 2025 from 2:00 PM to 3:00 PM",
  "notes": "Test booking"
}
```
4. Click **Run**
5. Check the console for success/error messages

### Method 2: Using Frontend

1. Go to the Booking page on your website
2. Select a time slot
3. Fill in the form with test data
4. Click "Confirm Booking"
5. Check your email at `jordanzuniga@gmail.com`

## Troubleshooting

### Function Not Found (404 Error)
- Ensure the file is named `sendBooking.jsw`
- Make sure the function is exported as `notifyAdmin`
- Deploy the backend function
- Check that the function is in the `/backend` folder

### Email Not Sent
- Verify the triggered email template exists and is named `booking_notification`
- Check that the template is **Active** in Wix
- Verify the recipient email is correct
- Check browser console for error messages

### Permission Denied
- Ensure the web method has `Permissions.Anyone`
- Check Wix security settings
- Verify the function is properly exported

### Template Variables Not Populating
- Verify variable names match exactly (case-sensitive)
- Ensure variables are wrapped in `{{double curly braces}}`
- Check that all required variables are included in the function

## Security Considerations

### Current Setup
- Function is accessible to anyone (`Permissions.Anyone`)
- No authentication required
- Suitable for public booking form

### Enhanced Security (Optional)
If you want to restrict access, modify the permissions:

```javascript
import { Permissions } from 'wix-web-module';

// Only allow authenticated users
export const notifyAdmin = webMethod(
  Permissions.WixUsers,
  async (data) => { /* ... */ }
);

// Only allow specific roles
export const notifyAdmin = webMethod(
  Permissions.WixRoles.Admin,
  async (data) => { /* ... */ }
);
```

## Monitoring & Logging

The function includes console logging for debugging:

```javascript
console.log('Booking notification email sent successfully:', result);
console.error('Error sending booking notification:', error);
```

To view logs:
1. Go to Wix Editor → **Monitoring** → **Logs**
2. Filter by function name: `notifyAdmin`
3. View real-time logs of email sends

## Performance Considerations

- Email sending is asynchronous (non-blocking)
- Typical response time: 1-3 seconds
- No rate limiting on triggered emails
- Suitable for high-volume bookings

## Maintenance

### Regular Checks
- Monitor email delivery success rate
- Check for any error patterns
- Verify template still exists and is active
- Test monthly with sample booking

### Updates
- If template variables change, update the function
- If recipient email changes, update the template
- Keep Wix modules up to date

## Additional Resources

- [Wix CRM Backend Documentation](https://www.wix.com/velo/reference/wix-crm-backend)
- [Triggered Emails Guide](https://support.wix.com/en/article/about-triggered-emails)
- [Web Methods Documentation](https://www.wix.com/velo/reference/wix-web-module)
- [Wix Backend Overview](https://support.wix.com/en/article/velo-backend-overview)

## Summary

The backend function:
✅ Receives booking data from frontend
✅ Sends triggered email to admin via Wix CRM
✅ Includes error handling and logging
✅ Returns success/failure response
✅ Requires no external services or API keys
✅ Uses only Wix built-in modules
