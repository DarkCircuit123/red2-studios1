import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/components/AdminAuthProvider';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleAdminLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanUsername, password);
      setUsername('');
      setPassword('');
      setShowPassword(false);
      onClose();
      onLoginSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-labelledby="admin-login-title"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-black border border-primary/30 rounded-lg p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 id="admin-login-title" className="text-2xl font-heading font-bold text-white">Admin Login</h2>
                <button type="button" onClick={handleClose} disabled={isLoading} className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50" aria-label="Close">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label htmlFor="admin-username" className="block text-sm font-mono text-white/60 mb-2">Username</label>
                  <input id="admin-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={128} required placeholder="Enter username" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all disabled:opacity-50" />
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-mono text-white/60 mb-2">Password</label>
                  <div className="relative">
                    <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="current-password" maxLength={256} required placeholder="Enter password" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all disabled:opacity-50 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="w-4 h-4 text-white/60" /> : <Eye className="w-4 h-4 text-white/60" />}
                    </button>
                  </div>
                </div>

                {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm" role="alert">{error}</motion.div>}

                <button type="submit" disabled={isLoading} className="w-full px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-mono text-sm uppercase tracking-widest rounded-lg transition-all duration-300 disabled:cursor-not-allowed">
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <p className="text-xs text-white/40 text-center mt-6">Admin access only</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
