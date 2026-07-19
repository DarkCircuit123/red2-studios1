import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMember } from '@/integrations';
import { useSessionRateLimit } from '@/hooks/useSessionRateLimit';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ClientLoginPageContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { actions } = useMember();
  const { recordAttempt, isLocked, remainingLockoutSec } = useSessionRateLimit('login', 5, 300000, 900000);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'network' | 'credentials' | 'rate-limited' | 'unknown' | null>(null);

  // Check for action=change-password in URL
  const isChangePasswordFlow = searchParams.get('action') === 'change-password';
  const returnTo = searchParams.get('returnTo') || '/profile';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);

    // Honeypot check
    if (honeypot) {
      console.warn('[ClientLogin] Honeypot triggered');
      return;
    }

    // Rate limit check
    if (isLocked) {
      setError(`Too many attempts. Please wait ${remainingLockoutSec} seconds.`);
      setErrorType('rate-limited');
      return;
    }

    recordAttempt();
    setIsLoading(true);

    try {
      // If this is a change-password flow, use the backend endpoint
      if (isChangePasswordFlow) {
        // Call backend endpoint to authenticate and generate token
        const tokenResponse = await fetch('/api/auth/login-for-change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        const tokenData = await tokenResponse.json();
        
        // Store token in sessionStorage for ProfilePage to retrieve
        sessionStorage.setItem('pending_password_change_token', tokenData.token);
        
        // Redirect to profile
        navigate(returnTo);
      } else {
        // Standard login flow - use Wix Members login via the integration
        await actions.login(email, password);
        
        // Redirect to returnTo URL (usually /profile)
        navigate(returnTo);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err);
      }
      setError('Invalid email or password. Please try again.');
      setErrorType('credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead title="Client Access" description="Sign in to view your gallery" noindex nofollow />
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
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 uppercase">
                Client Access
              </h1>
              <p className="text-lg text-white/60">
                {isChangePasswordFlow ? 'Confirm your password to make account changes' : 'Sign in to view your gallery'}
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleLogin}
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
                  <div className="text-sm text-red-300">
                    <p>{error}</p>
                    {errorType === 'rate-limited' && (
                      <p className="text-xs text-red-400 mt-1">Please wait before trying again.</p>
                    )}
                  </div>
                </motion.div>
              )}

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
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              {/* Honeypot (hidden) */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isLocked || !email || !password}
                className="w-full py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </motion.form>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-sm text-white/60">
                Don't have an account?{' '}
                <a href="/client-register" className="text-white hover:text-white/80 transition-colors font-bold">
                  Create one
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

export default function ClientLoginPage() {
  return (
    <ErrorBoundary>
      <ClientLoginPageContent />
    </ErrorBoundary>
  );
}
