import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAdminAuth } from '@/components/AdminAuthProvider';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use dummy credentials - actual auth is handled by Wix Members
      await login('admin', 'admin');
      
      // Clear form and close modal on success
      setTimeout(() => {
        onClose();
        onLoginSuccess?.();
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-black border border-primary/30 rounded-lg p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-bold text-white">Admin Login</h2>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Info Message */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                  Click the button below to sign in with your Wix Member account.
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-mono text-sm uppercase tracking-widest rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In with Wix'}
                </button>
              </form>

              {/* Footer */}
              <p className="text-xs text-white/40 text-center mt-6">
                Admin access only
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
