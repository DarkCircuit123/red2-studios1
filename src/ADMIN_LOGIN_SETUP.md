# Admin Login Setup Guide

## Overview
The admin login system requires three environment secrets to be configured in your Wix project:
1. **ADMIN_USERNAME** - The username for admin access
2. **ADMIN_PASSWORD** - The password for admin access
3. **SESSION_SECRET** - A secret key used to sign admin session tokens

## How to Configure Secrets in Wix

### Step 1: Access Wix Secrets Manager
1. Go to your Wix project dashboard
2. Navigate to **Settings** → **Secrets Manager** (or **Environment Variables**)
3. Look for the section to add new secrets

### Step 2: Add ADMIN_USERNAME
1. Click **Add Secret** or **New Secret**
2. Set the name to: `ADMIN_USERNAME`
3. Set the value to your desired admin username (e.g., `admin`, `superuser`, etc.)
4. Click **Save** or **Create**

### Step 3: Add ADMIN_PASSWORD
1. Click **Add Secret** or **New Secret**
2. Set the name to: `ADMIN_PASSWORD`
3. Set the value to a strong password (recommended: at least 12 characters with mixed case, numbers, and symbols)
4. Click **Save** or **Create**

### Step 4: Add SESSION_SECRET
1. Click **Add Secret** or **New Secret**
2. Set the name to: `SESSION_SECRET`
3. Set the value to a random, secure string (at least 32 characters)
   - You can generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Or use an online generator: https://www.random.org/strings/
4. Click **Save** or **Create**

## Troubleshooting

### "Admin authentication is not configured" Error
This error means one or more of the required secrets are missing:
- Verify all three secrets (ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET) are created
- Check that the secret names match exactly (case-sensitive)
- Wait a few moments for the secrets to propagate through the system
- Try refreshing the page

### "Invalid credentials" Error
This means the username or password you entered doesn't match what's configured:
- Double-check your username and password
- Verify there are no extra spaces before or after the values in the secrets
- Make sure you're using the exact username and password you configured

### Login Modal Doesn't Appear
- Check your browser console for errors (F12 → Console tab)
- Verify the AdminAuthProvider is properly initialized
- Clear your browser cache and try again

## Security Best Practices

1. **Use Strong Passwords**: Admin passwords should be at least 12 characters with:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%^&*)

2. **Rotate Credentials Regularly**: Change your admin password periodically

3. **Keep SESSION_SECRET Secure**: Never share or expose this value

4. **Use HTTPS Only**: Admin login should only work over HTTPS in production

5. **Rate Limiting**: The system automatically locks out after 8 failed login attempts for 15 minutes

## Testing Your Setup

1. Navigate to `/admin` in your application
2. You should see the admin login modal
3. Enter your configured username and password
4. If successful, you'll be granted access to the admin panel

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| ADMIN_USERNAME | Admin login username | `admin` |
| ADMIN_PASSWORD | Admin login password | `MySecurePass123!` |
| SESSION_SECRET | Token signing secret | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |

## API Endpoints

- **POST /api/auth/admin-login** - Login with username/password
- **GET /api/auth/admin-check** - Check if current session is authenticated
- **POST /api/auth/admin-logout** - Logout current admin session

## Session Duration

Admin sessions are valid for **7 days** by default. After this period, you'll need to log in again.

## Support

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Review the server logs for authentication errors
3. Verify all secrets are properly configured in Wix Secrets Manager
4. Ensure your browser accepts cookies (required for session management)
