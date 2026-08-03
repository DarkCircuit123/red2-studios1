import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuthStore';
import { useMember } from '@/integrations';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState('');
  const { login } = useAdminAuth();
  const { member, isAuthenticated, actions } = useMember();

  // Check if user is logged in and has admin access
  useEffect(() => {
    if (!isOpen) return;

    if (!isAuthenticated) {
      setError('');
      setInfo('You must be logged in with a Wix member account to access the admin panel.');
      return;
    }

    // Check if member has admin role
    const isAdmin = member?.profile?.nickname === 'admin' || 
                    (member as any)?.role === 'admin' ||
                    (member as any)?.isAdmin === true;

    if (!isAdmin) {
      setError('Your account does not have admin permissions.');
      setInfo('');
      return;
    }

    setError('');
    setInfo('');
  }, [isOpen, isAuthenticated, member]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      if (!isAuthenticated) {
        setError('You must be logged in first.');
        setIsLoading(false);
        return;
      }

      // Call login without username/password - uses Wix member session
      const success = await login();

      if (success) {
        console.log('[ADMIN LOGIN] Login successful, opening admin panel');
        // Small delay to ensure state is persisted before closing
        setTimeout(() => {
          onClose();
          onLoginSuccess?.();
        }, 100);
      } else {
        // Read fresh state directly from the store
        const storeError = useAdminAuth.getState().error;
        setError(storeError || 'Admin access denied. Check the browser console for details.');
      }
    } catch (err) {
      console.error('[ADMIN LOGIN] Error during login:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberLogin = () => {
    actions.login();
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
                  <h2 className="text-xl font-heading font-bold text-white">Admin Access</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {!isAuthenticated ? (
                  <>
                    {/* Not logged in */}
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="font-bold mb-2">Wix Member Login Required</p>
                        <p>You must log in with your Wix member account to access the admin panel.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleMemberLogin}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-heading font-bold uppercase tracking-wide rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Logging in...' : 'Log In with Wix'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Logged in */}
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-300">
                        <p className="font-bold">Logged in as:</p>
                        <p>{member?.profile?.nickname || member?.loginEmail || 'Member'}</p>
                      </div>
                    </div>

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

                    {info && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-300">{info}</p>
                      </motion.div>
                    )}

                    <button
                      onClick={handleAdminLogin}
                      disabled={isLoading || error !== ''}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-heading font-bold uppercase tracking-wide rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Verifying...' : 'Access Admin Panel'}
                    </button>

                    <button
                      onClick={() => actions.logout()}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-heading font-bold uppercase tracking-wide rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      Log Out
                    </button>
                  </>
                )}
              </div>

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
