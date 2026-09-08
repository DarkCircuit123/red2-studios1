# Admin Login Secrets Configuration Guide

Your admin login system is ready to use! Follow these steps to configure the required secrets in your Wix project.

## Required Secrets

You need to configure **three secrets** in your Wix Secrets Manager:

### 1. **ADMIN_USERNAME**
- **Purpose**: Your admin login username
- **Example**: `admin` or `superadmin`
- **Requirements**: Any string value (no special requirements)

### 2. **ADMIN_PASSWORD**
- **Purpose**: Your admin login password
- **Example**: `MySecurePassword123!@#`
- **Requirements**: 
  - Minimum 12 characters recommended
  - Use a strong password with uppercase, lowercase, numbers, and special characters
  - This is stored as plain text in secrets, so use a unique password

### 3. **SESSION_SECRET**
- **Purpose**: Secret key for signing admin session tokens (JWT-like tokens)
- **Example**: `a7f3k9m2x8q1w5r4t6y9u2i3o4p5l6k7j8h9g0f1e2d3c4b5a6z7x8c9v0b1n2`
- **Requirements**:
  - Must be a random, secure string
  - Minimum 32 characters recommended
  - Use only alphanumeric characters or special characters
  - Generate using a secure random generator

## How to Add Secrets to Wix

### Option 1: Using Wix Dashboard (Recommended)

1. Go to your Wix project dashboard
2. Navigate to **Settings** → **Secrets Manager** (or **Environment Variables**)
3. Click **Add Secret** or **Add Environment Variable**
4. For each secret:
   - **Name**: Enter the secret name exactly as shown above (case-sensitive)
   - **Value**: Enter the secret value
   - Click **Save** or **Add**

### Option 2: Using Wix CLI

If you have the Wix CLI installed:

```bash
# Add ADMIN_USERNAME
wix secrets set ADMIN_USERNAME "your_admin_username"

# Add ADMIN_PASSWORD
wix secrets set ADMIN_PASSWORD "your_strong_password_here"

# Add SESSION_SECRET
wix secrets set SESSION_SECRET "your_random_secure_string_here"
```

### Option 3: Using wix.config.json

Add to your `wix.config.json`:

```json
{
  "secrets": {
    "ADMIN_USERNAME": "your_admin_username",
    "ADMIN_PASSWORD": "your_strong_password_here",
    "SESSION_SECRET": "your_random_secure_string_here"
  }
}
```

## Generating a Secure SESSION_SECRET

Use one of these methods to generate a random secure string:

### Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL:
```bash
openssl rand -hex 32
```

### Using Python:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Using Online Generator:
Visit: https://www.random.org/strings/ and generate a 32+ character random string

## Testing Your Configuration

Once secrets are configured:

1. Navigate to `/admin` in your application
2. You should see the admin login modal
3. Enter your `ADMIN_USERNAME` and `ADMIN_PASSWORD`
4. Click **Login**
5. If successful, you'll be authenticated as admin

## Troubleshooting

### "Server configuration error" message
- **Cause**: One or more secrets are not configured
- **Solution**: Verify all three secrets are added to Secrets Manager

### "Invalid credentials" message
- **Cause**: Username or password doesn't match
- **Solution**: Double-check your credentials match exactly what you configured

### Session expires too quickly
- **Cause**: Normal behavior - admin sessions expire after 30 minutes
- **Solution**: Log in again when needed

### Can't access admin panel after login
- **Cause**: SESSION_SECRET might have changed or is invalid
- **Solution**: Verify SESSION_SECRET is correctly configured and hasn't changed

## Security Best Practices

✅ **DO:**
- Use a strong, unique password (12+ characters)
- Use a randomly generated SESSION_SECRET
- Keep secrets confidential
- Rotate secrets periodically
- Use different credentials for different environments (dev, staging, production)

❌ **DON'T:**
- Share secrets in code or version control
- Use simple passwords like "admin123"
- Commit secrets to Git
- Use the same password across multiple projects
- Log or print secret values

## Next Steps

After configuring secrets:
1. Test the admin login at `/admin`
2. Use the admin panel to manage your site content
3. Consider setting up additional admin accounts if needed
4. Document your admin credentials securely (password manager recommended)

---

**Note**: These secrets are used by the authentication system in `/src/api/auth/admin-login.ts` and `/src/lib/auth-security.ts`. The system uses constant-time comparison for security and HMAC-SHA256 for token signing.
