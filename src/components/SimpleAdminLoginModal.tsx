import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSimpleAdminAuth } from '@/lib/simpleAdminAuth';

interface SimpleAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function SimpleAdminLoginModal({ isOpen, onClose, onLoginSuccess }: SimpleAdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, login, clearError } = useSimpleAdminAuth();

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    
    if (success) {
      setTimeout(() => {
        onClose();
        onLoginSuccess?.();
      }, 100);
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

              {/* Content */}
              <div className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-heading font-semibold text-white mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-heading font-semibold text-white mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
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
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-heading font-bold uppercase tracking-wide rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
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
