# Wix Backend & Notification System Setup

## Overview
Your React frontend is already configured to send booking notifications to the Wix backend. This guide walks you through completing the backend setup using native Wix infrastructure.

**Final Flow:**
1. User submits booking on BookingPage → 
2. Frontend POST request to `/_functions/notifyAdmin` → 
3. Wix HTTP function executes → 
4. Triggered email sends → 
5. Admin receives notification at jordanzuniga@gmail.com

---

## Step 1: Create Backend HTTP Function

### Location
Go to **Wix Editor → Dev Mode → Backend → Create file `/backend/http-functions.js`**

### Code to Paste
```javascript
import { contacts } from 'wix-crm-backend';
import { triggeredEmails } from 'wix-crm-backend';
import { ok, badRequest } from 'wix-http-functions';

export async function post_notifyAdmin(request) {
  try {
    const data = await request.body.json();
    const adminEmail = "jordanzuniga@gmail.com";

    // Query for existing admin contact
    let contactQuery = await contacts.queryContacts()
      .eq("info.emails.email", adminEmail)
      .find();

    let contactId;

    // Create contact if it doesn't exist
    if (contactQuery.items.length > 0) {
      contactId = contactQuery.items[0]._id;
    } else {
      const newContact = await contacts.createContact({
        info: { emails: [{ email: adminEmail }] }
      });
      contactId = newContact._id;
    }

    // Send triggered email to admin
    await triggeredEmails.emailContact(
      "booking_notification",
      contactId,
      {
        variables: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          sessionType: data.sessionType,
          dateTime: data.dateTime,
          notes: data.notes
        }
      }
    );

    return ok({ success: true });
  } catch (err) {
    return badRequest({ error: err.message });
  }
}
```

### What This Function Does
- **Receives** booking data from the frontend (name, email, phone, sessionType, dateTime, notes)
- **Finds or creates** the admin contact with email jordanzuniga@gmail.com
- **Sends** a triggered email using the "booking_notification" template
- **Returns** success or error response

---

## Step 2: Create Triggered Email Template

### Location
Go to **Wix Dashboard → CRM → Automations → Triggered Emails → Create Template**

### Template Configuration

| Field | Value |
|-------|-------|
| **Template ID** | `booking_notification` |
| **Recipient** | Admin Contact (jordanzuniga@gmail.com) |
| **Subject** | New Red2 Studios Booking Request |

### Email Body Template
```
New booking request received.

Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Session Type: {{sessionType}}
Requested Time: {{dateTime}}
Notes:
{{notes}}
```

### Steps to Create
1. Click "Create Template"
2. Set Template ID to: `booking_notification`
3. Set Subject to: `New Red2 Studios Booking Request`
4. In the email body, paste the template above
5. Set recipient to the admin contact (jordanzuniga@gmail.com)
6. Save and publish the template

---

## Step 3: Frontend Integration (Already Complete ✓)

Your React BookingPage is already configured to POST to the backend function with the correct payload:

```javascript
const response = await fetch('/_functions/notifyAdmin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    sessionType: selectedSlot.sessionType,
    dateTime: dateTime,
    notes: formData.message || '(No additional notes)'
  })
});
```

**Location:** `/src/components/pages/BookingPage.tsx` (lines 86-99)

---

## Testing the Integration

### Test Flow
1. Go to your site's booking page
2. Select a time slot
3. Fill in the booking form with test data
4. Click "Confirm Booking"
5. Check jordanzuniga@gmail.com for the notification email

### Troubleshooting
- **Email not received?** Verify the triggered email template is published
- **Function error?** Check Wix Editor logs in Dev Mode → Backend → Logs
- **Contact not found?** The function automatically creates the contact if it doesn't exist

---

## Summary

| Component | Status | Location |
|-----------|--------|----------|
| **Frontend** | ✓ Complete | `/src/components/pages/BookingPage.tsx` |
| **HTTP Function** | ⏳ To Create | Wix Editor → `/backend/http-functions.js` |
| **Email Template** | ⏳ To Create | Wix Dashboard → CRM → Triggered Emails |

Once you complete Steps 1 & 2 in the Wix Editor and Dashboard, the entire booking notification system will be live!
