import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useSessionRateLimit } from '@/hooks/useSessionRateLimit';
import { useAuthStore } from '@/lib/clientAuthStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ClientRegisterPageContent() {
  const navigate = useNavigate();
  const { setClientSession } = useAuthStore();
  const { recordAttempt, isLocked, remainingLockoutSec } = useSessionRateLimit('register', 3, 300000, 900000);
  
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Honeypot check
    if (honeypot) {
      console.warn('[ClientRegister] Honeypot triggered');
      return;
    }

    // Rate limit check
    if (isLocked) {
      setError(`Too many attempts. Please wait ${remainingLockoutSec} seconds.`);
      return;
    }

    // Validation
    if (!clientName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!tosAccepted || !privacyAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    recordAttempt();
    setIsLoading(true);

    try {
      // Create session with proper timestamps
      const sessionId = crypto.randomUUID();
      const sessionIssuedAt = Date.now();
      const sessionExpiresAt = sessionIssuedAt + 7 * 24 * 60 * 60 * 1000; // 7 days

      // Set client session with full shape
      setClientSession({
        clientEmail: email.toLowerCase(),
        clientName: clientName.trim(),
        accountId: sessionId,
        isAccountLogin: true,
        galleryIds: [],
        sessionIssuedAt,
        sessionExpiresAt,
        sessionId,
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/client-gallery-access');
      }, 1500);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', err);
      }
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead title="Create Account" description="Register for client gallery access" noindex nofollow />
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 uppercase">
                Create Account
              </h1>
              <p className="text-lg text-white/60">
                Sign up to access your gallery
              </p>
            </motion.div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">Account created successfully! Redirecting...</p>
              </motion.div>
            )}

            {/* Rate Limit Warning */}
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">Too many attempts. Please wait {remainingLockoutSec}s.</p>
              </motion.div>
            )}

            {/* Registration Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleRegister}
              className="space-y-6"
            >
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Honeypot (hidden) */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* TOS Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="tos"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 cursor-pointer"
                />
                <label htmlFor="tos" className="text-sm text-white/60 cursor-pointer">
                  I accept the{' '}
                  <a href="/terms" className="text-white hover:text-white/80 transition-colors font-bold">
                    Terms of Service
                  </a>
                </label>
              </div>

              {/* Privacy Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border border-white/20 bg-white/5 cursor-pointer"
                />
                <label htmlFor="privacy" className="text-sm text-white/60 cursor-pointer">
                  I accept the{' '}
                  <a href="/privacy" className="text-white hover:text-white/80 transition-colors font-bold">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isLocked || !clientName || !email || !password || !confirmPassword || !tosAccepted || !privacyAccepted}
                className="w-full py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </motion.form>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-sm text-white/60">
                Already have an account?{' '}
                <a href="/client-login" className="text-white hover:text-white/80 transition-colors font-bold">
                  Sign in
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function ClientRegisterPage() {
  return (
    <ErrorBoundary>
      <ClientRegisterPageContent />
    </ErrorBoundary>
  );
}
