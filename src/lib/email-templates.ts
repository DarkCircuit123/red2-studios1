/**
 * Email Templates for Booking System
 * Dark RED2 Branding Theme
 */

export interface EmailTemplateData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingDate: string;
  bookingTime: string;
  sessionType: string;
  notes?: string;
  submissionTime?: string;
  confirmationNumber?: string;
  adminEmail?: string;
}

/**
 * Admin Notification Email Template
 * Sent to admin when a booking is submitted
 */
export const getAdminNotificationHTML = (data: EmailTemplateData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Submission - RED² Photography</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1a1a;
      border: 1px solid #333333;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #6F0809 0%, #4a0505 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 2px solid #6F0809;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .content {
      padding: 32px 24px;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6F0809;
      margin-bottom: 12px;
      border-bottom: 1px solid #333333;
      padding-bottom: 8px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #2a2a2a;
      font-size: 14px;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: #999999;
      font-weight: 600;
    }
    
    .info-value {
      color: #ffffff;
      text-align: right;
      word-break: break-word;
    }
    
    .booking-card {
      background-color: #0a0a0a;
      border: 2px solid #6F0809;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .booking-card .label {
      font-size: 11px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .booking-card .value {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    
    .booking-card .value:last-child {
      margin-bottom: 0;
    }
    
    .notes-section {
      background-color: #0a0a0a;
      border-left: 3px solid #6F0809;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .notes-section .label {
      font-size: 11px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .notes-section .content {
      font-size: 14px;
      color: #ffffff;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .action-section {
      background-color: #0a0a0a;
      border: 1px solid #333333;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      text-align: center;
    }
    
    .action-section p {
      font-size: 12px;
      color: #999999;
      margin-bottom: 12px;
    }
    
    .action-button {
      display: inline-block;
      background-color: #6F0809;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: background-color 0.3s;
    }
    
    .action-button:hover {
      background-color: #8a0a0b;
    }
    
    .footer {
      background-color: #0a0a0a;
      border-top: 1px solid #333333;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    
    .footer p {
      margin-bottom: 8px;
    }
    
    .footer p:last-child {
      margin-bottom: 0;
    }
    
    .timestamp {
      font-size: 11px;
      color: #666666;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #2a2a2a;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>RED<span style="color: #ff6b6b;">²</span></h1>
      <div class="subtitle">New Booking Submission</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">${data.clientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${data.clientEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone</span>
          <span class="info-value">${data.clientPhone}</span>
        </div>
      </div>
      
      <!-- Booking Details -->
      <div class="section">
        <div class="section-title">Booking Details</div>
        <div class="booking-card">
          <div class="label">Session Type</div>
          <div class="value">${data.sessionType}</div>
          
          <div class="label">Date</div>
          <div class="value">${data.bookingDate}</div>
          
          <div class="label">Time</div>
          <div class="value">${data.bookingTime}</div>
        </div>
      </div>
      
      <!-- Notes -->
      ${data.notes && data.notes !== '(No additional notes)' ? `
      <div class="section">
        <div class="section-title">Client Notes</div>
        <div class="notes-section">
          <div class="label">Message</div>
          <div class="content">${data.notes}</div>
        </div>
      </div>
      ` : ''}
      
      <!-- Action Section -->
      <div class="action-section">
        <p>Review and respond to this booking request in your admin dashboard.</p>
        <a href="https://red2photography.com/admin" class="action-button">View in Dashboard</a>
      </div>
      
      <!-- Timestamp -->
      <div class="timestamp">
        Submitted: ${data.submissionTime || new Date().toLocaleString()}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>RED² Photography Booking System</p>
      <p>© ${new Date().getFullYear()} All rights reserved</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Customer Confirmation Email Template
 * Sent to customer after booking submission
 */
export const getCustomerConfirmationHTML = (data: EmailTemplateData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - RED² Photography</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1a1a;
      border: 1px solid #333333;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #6F0809 0%, #4a0505 100%);
      padding: 40px 24px;
      text-align: center;
      border-bottom: 2px solid #6F0809;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
    }
    
    .content {
      padding: 32px 24px;
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #ffffff;
    }
    
    .message {
      font-size: 14px;
      color: #cccccc;
      margin-bottom: 24px;
      line-height: 1.8;
    }
    
    .confirmation-card {
      background-color: #0a0a0a;
      border: 2px solid #6F0809;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .confirmation-card .section {
      margin-bottom: 20px;
    }
    
    .confirmation-card .section:last-child {
      margin-bottom: 0;
    }
    
    .confirmation-card .label {
      font-size: 11px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    
    .confirmation-card .value {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }
    
    .confirmation-number {
      background-color: #1a1a1a;
      border: 1px solid #6F0809;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      text-align: center;
    }
    
    .confirmation-number .label {
      font-size: 11px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .confirmation-number .value {
      font-size: 20px;
      font-weight: 900;
      color: #6F0809;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
    }
    
    .next-steps {
      background-color: #0a0a0a;
      border-left: 3px solid #6F0809;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .next-steps .title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6F0809;
      margin-bottom: 12px;
    }
    
    .next-steps ul {
      list-style: none;
      padding: 0;
    }
    
    .next-steps li {
      font-size: 13px;
      color: #cccccc;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .next-steps li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #6F0809;
      font-weight: 700;
    }
    
    .next-steps li:last-child {
      margin-bottom: 0;
    }
    
    .contact-section {
      background-color: #1a1a1a;
      border: 1px solid #333333;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      text-align: center;
    }
    
    .contact-section p {
      font-size: 13px;
      color: #cccccc;
      margin-bottom: 8px;
    }
    
    .contact-section p:last-child {
      margin-bottom: 0;
    }
    
    .contact-section .email {
      color: #6F0809;
      font-weight: 700;
      text-decoration: none;
    }
    
    .footer {
      background-color: #0a0a0a;
      border-top: 1px solid #333333;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    
    .footer p {
      margin-bottom: 8px;
    }
    
    .footer p:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>RED<span style="color: #ff6b6b;">²</span></h1>
      <div class="subtitle">Booking Confirmed</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">Thank you, ${data.clientName}!</div>
      
      <div class="message">
        We've received your booking request and we're excited to work with you. Your session details are confirmed below. We'll be in touch shortly to finalize any additional details.
      </div>
      
      <!-- Confirmation Card -->
      <div class="confirmation-card">
        <div class="section">
          <div class="label">Session Type</div>
          <div class="value">${data.sessionType}</div>
        </div>
        
        <div class="section">
          <div class="label">Date</div>
          <div class="value">${data.bookingDate}</div>
        </div>
        
        <div class="section">
          <div class="label">Time</div>
          <div class="value">${data.bookingTime}</div>
        </div>
      </div>
      
      <!-- Confirmation Number -->
      <div class="confirmation-number">
        <div class="label">Confirmation Number</div>
        <div class="value">${data.confirmationNumber || 'PENDING'}</div>
      </div>
      
      <!-- Next Steps -->
      <div class="next-steps">
        <div class="title">What's Next?</div>
        <ul>
          <li>We'll review your booking and confirm availability</li>
          <li>You'll receive a follow-up email with session details</li>
          <li>We may reach out if we need additional information</li>
          <li>Prepare your wardrobe and location preferences</li>
        </ul>
      </div>
      
      <!-- Contact Section -->
      <div class="contact-section">
        <p>Questions or need to reschedule?</p>
        <p>Contact us at <a href="mailto:${data.adminEmail}" class="email">${data.adminEmail}</a></p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>RED² Photography</p>
      <p>© ${new Date().getFullYear()} All rights reserved</p>
    </div>
  </div>
</body>
</html>
  `;
};
