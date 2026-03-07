# Booking Notification System - Complete Setup Guide

## Overview
The booking system is now fully connected to send admin notifications when users submit booking requests. This document outlines what's already implemented and what you need to set up on the Wix backend.

---

## ✅ Frontend Implementation (COMPLETE)

The React booking form in `BookingPage.tsx` is already configured to:

1. **Collect booking data** from the user form:
   - Name
   - Email
   - Phone
   - Session Type (from selected slot)
   - Date & Time (formatted)
   - Additional Notes

2. **Send POST request** to Wix backend:
   ```
   POST /_functions/notifyAdmin
   ```

3. **Request payload** includes:
   ```json
   {
     "name": "User's Full Name",
     "email": "user@example.com",
     "phone": "(555) 123-4567",
     "sessionType": "Session Type from Booking",
     "dateTime": "Monday, March 10 from 10:00 AM to 11:00 AM",
     "notes": "Any additional notes or (No additional notes)"
   }
   ```

4. **Error handling**:
   - Shows success message on successful submission
   - Logs errors to console
   - Displays "Submitting..." state during request

---

## 🔧 Backend Setup Required (Wix Velo)

### Step 1: Create HTTP Function

Create a new file in your Wix site backend:

**File path:** `/backend/http-functions.js`

**Code:**
```javascript
import { contacts } from 'wix-crm-backend';
import { triggeredEmails } from 'wix-crm-backend';
import { ok, badRequest } from 'wix-http-functions';

export async function post_notifyAdmin(request) {
  try {
    const body = await request.body.json();

    const adminEmail = "jordanzuniga@gmail.com";

    // Find or create contact for admin
    let contactQuery = await contacts.queryContacts()
      .eq("info.emails.email", adminEmail)
      .find();

    let contactId;

    if (contactQuery.items.length > 0) {
      contactId = contactQuery.items[0]._id;
    } else {
      const newContact = await contacts.createContact({
        info: {
          emails: [{ email: adminEmail }]
        }
      });
      contactId = newContact._id;
    }

    // Send triggered email
    await triggeredEmails.emailContact(
      "booking_notification",
      contactId,
      {
        variables: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          sessionType: body.sessionType,
          dateTime: body.dateTime,
          notes: body.notes
        }
      }
    );

    return ok({ status: "email_sent" });

  } catch (err) {
    return badRequest({ error: err.message });
  }
}
```

This creates a public HTTP endpoint:
```
https://YOUR-WIX-SITE/_functions/notifyAdmin
```

---

### Step 2: Create Triggered Email Template

In your Wix site, create a triggered email with these specifications:

**Email Template ID:** `booking_notification`

**Recipient:** jordanzuniga@gmail.com

**Subject:** `New Red2 Studios Booking Request`

**Body Template:**
```
Hello,

You have received a new booking request:

Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Session Type: {{sessionType}}
Requested Date & Time: {{dateTime}}

Additional Notes:
{{notes}}

Please review and respond to the client as soon as possible.

Best regards,
Red2 Studios Booking System
```

**Steps to create in Wix:**
1. Go to your Wix site backend
2. Navigate to **Automations** → **Triggered Emails**
3. Click **Create New Email**
4. Set the ID to `booking_notification`
5. Configure the template with the subject and body above
6. Add the variables: `name`, `email`, `phone`, `sessionType`, `dateTime`, `notes`
7. Save and publish

---

## 🔄 How It Works

**Flow:**
1. User fills out booking form on the website
2. User clicks "Confirm Booking"
3. Frontend sends POST request to `/_functions/notifyAdmin`
4. Wix backend function receives the request
5. Backend finds or creates admin contact in CRM
6. Backend triggers the `booking_notification` email
7. Admin receives email at jordanzuniga@gmail.com
8. User sees success message

---

## 📋 Checklist

- [ ] Create `/backend/http-functions.js` with the provided code
- [ ] Create triggered email template `booking_notification`
- [ ] Set email recipient to jordanzuniga@gmail.com
- [ ] Configure email subject and body with variables
- [ ] Test by submitting a booking form
- [ ] Verify admin receives email notification

---

## 🧪 Testing

1. Go to the booking page on your website
2. Select an available time slot
3. Fill in the form with test data
4. Click "Confirm Booking"
5. You should see a success message
6. Check jordanzuniga@gmail.com for the notification email

---

## 🐛 Troubleshooting

**Email not received:**
- Verify the triggered email template ID is exactly `booking_notification`
- Check that the admin email is correctly set to `jordanzuniga@gmail.com`
- Ensure the HTTP function is deployed and public
- Check Wix logs for any errors

**HTTP 404 error:**
- Verify the HTTP function file is in `/backend/http-functions.js`
- Ensure the function name is `post_notifyAdmin` (lowercase)
- Check that the function is exported correctly

**Variables not showing in email:**
- Verify all variable names match exactly: `name`, `email`, `phone`, `sessionType`, `dateTime`, `notes`
- Ensure variables are wrapped in `{{}}` in the email template

---

## 📝 Notes

- The frontend is already configured and ready to use
- You only need to set up the backend HTTP function and triggered email
- The system is production-ready once both backend components are in place
- All booking data is securely sent to the admin email
