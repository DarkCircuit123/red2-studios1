# Backend Implementation Guide for Secure Authentication

## Overview

This guide provides step-by-step instructions for implementing the secure backend API endpoints required by the fixed frontend authentication system.

---

## Required Endpoints

### 1. POST /api/verify-access

**Purpose**: Verify password and issue secure session token

**Request**:
```json
{
  "password": "user-provided-password"
}
```

**Headers**:
```
Content-Type: application/json
X-CSRF-Token: [CSRF token from frontend]
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "sessionToken": "secure-token-here",
  "expiresIn": 3600
}
```

**Response (Unauthorized - 401)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response (Rate Limited - 429)**:
```json
{
  "success": false,
  "message": "Too many attempts. Try again later.",
  "retryAfter": 1800
}
```

---

## Implementation Examples

### Node.js/Express Implementation

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Configuration
const CORRECT_PASSWORD_HASH = process.env.PRIVATE_PAGE_PASSWORD_HASH;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// In-memory store for rate limiting (use Redis in production)
const attemptTracker = new Map();
const sessionStore = new Map();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts. Try again later.',
      retryAfter: 1800
    });
  }
});

// CSRF token validation middleware
const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  if (!token || !req.session.csrfToken || token !== req.session.csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed'
    });
  }
  next();
};

// Check if IP is locked out
const checkLockout = (ip) => {
  const record = attemptTracker.get(ip);
  if (!record) return false;
  
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return true;
  }
  
  // Clear old attempts
  if (record.attempts && record.attempts.length > 0) {
    const recentAttempts = record.attempts.filter(
      time => Date.now() - time < 15 * 60 * 1000
    );
    if (recentAttempts.length === 0) {
      attemptTracker.delete(ip);
      return false;
    }
    record.attempts = recentAttempts;
  }
  
  return false;
};

// Record failed attempt
const recordFailedAttempt = (ip) => {
  const record = attemptTracker.get(ip) || { attempts: [] };
  record.attempts.push(Date.now());
  
  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  attemptTracker.set(ip, record);
};

// Clear failed attempts
const clearAttempts = (ip) => {
  attemptTracker.delete(ip);
};

// Generate secure session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify access endpoint
router.post('/verify-access', limiter, validateCSRFToken, async (req, res) => {
  try {
    const { password } = req.body;
    const clientIP = req.ip;
    
    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }
    
    // Check if IP is locked out
    if (checkLockout(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Try again later.',
        retryAfter: 1800
      });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, CORRECT_PASSWORD_HASH);
    
    if (!isValid) {
      recordFailedAttempt(clientIP);
      
      // Log failed attempt
      console.warn(`Failed access attempt from IP: ${clientIP}`);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Clear attempts on successful authentication
    clearAttempts(clientIP);
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + SESSION_TIMEOUT;
    
    // Store session
    sessionStore.set(sessionToken, {
      createdAt: Date.now(),
      expiresAt,
      ip: clientIP,
      userAgent: req.headers['user-agent']
    });
    
    // Set secure cookie
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TIMEOUT,
      path: '/'
    });
    
    // Log successful authentication
    console.info(`Successful access from IP: ${clientIP}`);
    
    return res.status(200).json({
      success: true,
      sessionToken,
      expiresIn: SESSION_TIMEOUT / 1000
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
});

// Verify session endpoint (for checking if session is still valid)
router.get('/verify-session', (req, res) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session'
      });
    }
    
    const session = sessionStore.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      sessionStore.delete(sessionToken);
      res.clearCookie('sessionToken');
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }
    
    // Check if IP changed (optional security measure)
    if (session.ip !== req.ip) {
      console.warn(`Session IP mismatch: ${session.ip} vs ${req.ip}`);
      // You can either reject or allow based on your security policy
    }
    
    return res.status(200).json({
      success: true,
      expiresAt: session.expiresAt
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    
    if (sessionToken) {
      sessionStore.delete(sessionToken);
    }
    
    res.clearCookie('sessionToken');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
});

module.exports = router;
```

### Setup Instructions

```javascript
// app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: false });

// Generate CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Auth routes
app.use('/api', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ success: false, message: 'CSRF validation failed' });
  } else {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = app;
```

### Environment Variables

```bash
# .env
NODE_ENV=production
SESSION_SECRET=your-secret-key-here
PRIVATE_PAGE_PASSWORD_HASH=$2b$12$... # bcrypt hash of password
```

### Generate Password Hash

```javascript
// scripts/generate-hash.js
const bcrypt = require('bcrypt');

const password = 'your-password-here';
bcrypt.hash(password, 12, (err, hash) => {
  if (err) throw err;
  console.log('Password hash:', hash);
  console.log('Add this to your .env file as PRIVATE_PAGE_PASSWORD_HASH');
});
```

---

## Database Implementation (Production)

### Using Redis for Session Storage

```javascript
const redis = require('redis');
const client = redis.createClient();

// Store session
await client.setex(
  `session:${sessionToken}`,
  SESSION_TIMEOUT / 1000,
  JSON.stringify({
    createdAt: Date.now(),
    ip: clientIP,
    userAgent: req.headers['user-agent']
  })
);

// Retrieve session
const session = await client.get(`session:${sessionToken}`);

// Delete session
await client.del(`session:${sessionToken}`);
```

### Using MongoDB for Audit Logging

```javascript
const mongoose = require('mongoose');

const authLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  action: String, // 'login_attempt', 'login_success', 'login_failure'
  result: String, // 'success', 'invalid_password', 'rate_limited'
  details: mongoose.Schema.Types.Mixed
});

const AuthLog = mongoose.model('AuthLog', authLogSchema);

// Log authentication attempt
await AuthLog.create({
  ip: clientIP,
  userAgent: req.headers['user-agent'],
  action: 'login_attempt',
  result: isValid ? 'success' : 'invalid_password'
});
```

---

## Security Considerations

### 1. Password Storage
- Always hash passwords with bcrypt or Argon2
- Never store plaintext passwords
- Use salt (bcrypt does this automatically)
- Use cost factor of 12 or higher

### 2. Rate Limiting
- Implement per-IP rate limiting
- Use Redis for distributed rate limiting
- Log all failed attempts
- Alert on suspicious patterns

### 3. Session Management
- Use cryptographically secure random tokens
- Set appropriate timeout (30 minutes recommended)
- Validate IP address consistency
- Clear sessions on logout

### 4. CSRF Protection
- Generate unique token per session
- Validate on all state-changing requests
- Rotate tokens periodically
- Use SameSite cookie attribute

### 5. Logging & Monitoring
- Log all authentication attempts
- Monitor for brute force attacks
- Alert on multiple failed attempts
- Track IP addresses and user agents

### 6. HTTPS Only
- Enforce HTTPS in production
- Set Secure flag on cookies
- Implement HSTS headers
- Use TLS 1.2 or higher

---

## Testing

### Unit Tests

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Authentication', () => {
  it('should verify correct password', async () => {
    const res = await request(app)
      .post('/api/verify-access')
      .send({ password: 'correct-password' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionToken).toBeDefined();
  });
  
  it('should reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/verify-access')
      .send({ password: 'wrong-password' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  
  it('should rate limit after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/verify-access')
        .send({ password: 'wrong' });
    }
    
    const res = await request(app)
      .post('/api/verify-access')
      .send({ password: 'wrong' });
    
    expect(res.status).toBe(429);
  });
});
```

---

## Deployment Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting deployed
- [ ] Logging and monitoring active
- [ ] Database backups configured
- [ ] Error handling implemented
- [ ] CORS configured properly
- [ ] Input validation implemented
- [ ] Output encoding implemented

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Failed Authentication Attempts**
   - Alert if > 10 per minute
   - Alert if > 100 per hour

2. **Rate Limit Violations**
   - Alert if > 5 per IP per 15 minutes
   - Track repeat offenders

3. **Session Anomalies**
   - Alert on IP changes
   - Alert on unusual user agents
   - Alert on concurrent sessions

4. **System Health**
   - Monitor API response times
   - Monitor database performance
   - Monitor memory usage

---

## References

- bcrypt: https://www.npmjs.com/package/bcrypt
- express-rate-limit: https://www.npmjs.com/package/express-rate-limit
- csurf: https://www.npmjs.com/package/csurf
- helmet: https://www.npmjs.com/package/helmet
- OWASP: https://owasp.org/

---

## Support

For questions or issues with implementation, refer to:
- OWASP Authentication Cheat Sheet
- OWASP Session Management Cheat Sheet
- Node.js Security Best Practices
