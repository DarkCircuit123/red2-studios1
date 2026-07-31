import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, AlertCircle } from 'lucide-react';
import { useAdminAuth, MAX_FAILED_ATTEMPTS } from '@/lib/adminAuthStore';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call login and await the result
      const success = await login(username, password);

      if (success) {
        console.log('[ADMIN LOGIN] Login successful, opening admin panel');
        setUsername('');
        setPassword('');
        // Small delay to ensure state is persisted before closing
        setTimeout(() => {
          onClose();
          // Previously the admin panel required a SECOND gear click after
          // a successful login — this is what made login "appear to
          // succeed" while nothing visibly happened. Open it directly.
          onLoginSuccess?.();
        }, 100);
      } else {
        // Read fresh state directly from the store rather than the
        // destructured value above, which is captured at render time and
        // would be one attempt stale inside this same call.
        const storeError = useAdminAuth.getState().error;
        const currentFailedAttempts = useAdminAuth.getState().failedAttempts;

        // IMPORTANT: only show the "invalid password" messaging when the
        // server actually said the credentials were wrong. Previously this
        // branch showed that message unconditionally, which is why a dead
        // API route, a missing SESSION_SECRET, or a plain network error
        // all looked identical to a wrong password — the real cause was
        // invisible. Every other failure now shows its real message.
        if (storeError === 'Invalid credentials') {
          const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - currentFailedAttempts);
          setError(
            remainingAttempts > 0
              ? `Invalid username or password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
              : 'Too many failed attempts. Please try again later.'
          );
        } else {
          setError(storeError || 'Login failed for an unknown reason. Check the browser console for details.');
        }
        setPassword('');
      }
    } catch (err) {
      console.error('[ADMIN LOGIN] Error during login:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-heading font-bold text-white">Admin Login</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Username */}
                <div>
                  <label className="text-xs text-slate-300 uppercase tracking-wide font-heading font-bold block mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      disabled={isLoading}
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-slate-300 uppercase tracking-wide font-heading font-bold block mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="w-full mt-6 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-heading font-bold uppercase tracking-wide rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Footer */}
              <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
                <p className="text-xs text-slate-400 text-center">
                  Admin access only. Unauthorized access is prohibited.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
