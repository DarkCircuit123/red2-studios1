import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function PrivatePage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    // Check if already unlocked in session
    const unlockedSession = sessionStorage.getItem('privatePageUnlocked');
    if (unlockedSession === 'true') {
      setIsUnlocked(true);
    }

    // Check if account is locked
    const lockedUntil = sessionStorage.getItem('privatePageLockedUntil');
    if (lockedUntil) {
      const lockTime = parseInt(lockedUntil, 10);
      if (Date.now() < lockTime) {
        setIsLocked(true);
      } else {
        sessionStorage.removeItem('privatePageLockedUntil');
      }
    }

    // Load failed attempts
    const attempts = sessionStorage.getItem('privatePageFailedAttempts');
    if (attempts) {
      setFailedAttempts(parseInt(attempts, 10));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Check password locally (case-insensitive)
    const correctPassword = 'classified';
    const isCorrect = password.toLowerCase() === correctPassword;

    if (isCorrect) {
      // Password is correct - redirect to home page
      setIsUnlocked(true);
      setPassword('');
      sessionStorage.setItem('privatePageUnlocked', 'true');
      sessionStorage.setItem('privatePageFailedAttempts', '0');
      setFailedAttempts(0);
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 300);
    } else {
      // Password is incorrect
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      sessionStorage.setItem('privatePageFailedAttempts', newAttempts.toString());

      if (newAttempts >= 5) {
        // Lock the page after 5 failed attempts
        const lockDuration = 30 * 60 * 1000; // 30 minutes
        const lockUntil = Date.now() + lockDuration;
        sessionStorage.setItem('privatePageLockedUntil', lockUntil.toString());
        setIsLocked(true);
        setError('Too many failed attempts. Access locked for 30 minutes.');
      } else {
        setError(`Access denied. Invalid credentials. (${5 - newAttempts} attempts remaining)`);
      }
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />

      {!isUnlocked ? (
        // Locked State
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,0,0,.05) 25%, rgba(255,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(255,0,0,.05) 75%, rgba(255,0,0,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,0,0,.05) 25%, rgba(255,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(255,0,0,.05) 75%, rgba(255,0,0,.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="max-w-[100rem] mx-auto px-8 w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-md mx-auto"
            >
              {/* Lock Icon */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex justify-center mb-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-900/20 rounded-full blur-xl" />
                  <Lock className="w-24 h-24 text-red-900 relative" />
                </div>
              </motion.div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-4 text-center uppercase tracking-tighter">
                CLASSIFIED
              </h1>

              {/* Subtitle */}
              <p className="text-center text-white/50 font-mono text-xs uppercase tracking-widest mb-12">
                ▓▓▓ RESTRICTED ACCESS ▓▓▓
              </p>

              {/* Warning Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12 p-6 border border-red-900/50 bg-red-900/5 rounded-sm"
              >
                <div className="flex gap-4">
                  <AlertCircle className="w-5 h-5 text-red-900 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-mono text-white/70">
                    This section contains exclusive, confidential information. Unauthorized access is prohibited.
                  </p>
                </div>
              </motion.div>

              {/* Password Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                {/* Password Input */}
                <div className="relative">
                  <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                    Security Clearance Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      disabled={isLocked}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-black border border-red-900/30 text-white placeholder-white/20 focus:outline-none focus:border-red-900 transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors disabled:opacity-50"
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
                    className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-sm font-mono"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLocked || password.length === 0 || isLoading}
                  className="w-full py-3 bg-red-900 text-white font-heading font-bold text-sm uppercase tracking-widest hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-900"
                >
                  {isLoading ? 'VERIFYING...' : isLocked ? 'SYSTEM LOCKED' : 'AUTHENTICATE'}
                </button>
              </motion.form>

              {/* Footer Text */}
              <p className="text-center text-xs font-mono text-white/30 mt-12 uppercase tracking-widest">
                ▓▓▓ END OF TRANSMISSION ▓▓▓
              </p>
            </motion.div>
          </div>
        </section>
      ) : (
        // Unlocked State
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34,197,94,.1) 25%, rgba(34,197,94,.1) 26%, transparent 27%, transparent 74%, rgba(34,197,94,.1) 75%, rgba(34,197,94,.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34,197,94,.1) 25%, rgba(34,197,94,.1) 26%, transparent 27%, transparent 74%, rgba(34,197,94,.1) 75%, rgba(34,197,94,.1) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="max-w-[100rem] mx-auto px-8 w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              {/* Success Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center mb-12"
              >
                <div className="w-24 h-24 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-green-500" />
                  </div>
                </div>
              </motion.div>

              {/* Welcome Title */}
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-4 text-center uppercase tracking-tighter">
                ACCESS GRANTED
              </h1>

              {/* Status */}
              <p className="text-center text-green-500 font-mono text-xs uppercase tracking-widest mb-12">
                ▓▓▓ AUTHENTICATION SUCCESSFUL ▓▓▓
              </p>

              {/* Secret Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-8"
              >
                {/* Content Box 1 */}
                <div className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h2 className="text-2xl font-heading font-bold text-white mb-4 uppercase">
                    Secret Knowledge Unlocked
                  </h2>
                  <p className="text-white/70 font-paragraph leading-relaxed mb-4">
                    You have successfully accessed the classified archives. This exclusive section contains insider insights, behind-the-scenes stories, and confidential project details that are not available to the general public.
                  </p>
                  <p className="text-white/60 font-mono text-sm">
                    Classification Level: TOP SECRET
                  </p>
                </div>

                {/* Content Box 2 */}
                <div className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase">
                    Exclusive Portfolio Projects
                  </h3>
                  <ul className="space-y-3 text-white/70 font-paragraph">
                    <li className="flex gap-3">
                      <span className="text-green-500">▸</span>
                      <span>Project Codename: AURORA - Experimental photography series</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-500">▸</span>
                      <span>Project Codename: NEXUS - Unreleased commercial work</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-500">▸</span>
                      <span>Project Codename: CIPHER - Confidential client collaborations</span>
                    </li>
                  </ul>
                </div>

                {/* Content Box 3 */}
                <div className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase">
                    Behind the Scenes
                  </h3>
                  <p className="text-white/70 font-paragraph leading-relaxed">
                    Discover the creative process, technical challenges overcome, and the stories behind each masterpiece. This section reveals the meticulous attention to detail and innovative techniques that set this work apart.
                  </p>
                </div>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsUnlocked(false);
                    setPassword('');
                    setError('');
                    sessionStorage.removeItem('privatePageUnlocked');
                  }}
                  className="w-full py-3 bg-green-500/20 text-green-400 font-heading font-bold text-sm uppercase tracking-widest hover:bg-green-500/30 transition-all duration-300 border border-green-500/50 mt-8"
                >
                  REVOKE ACCESS
                </motion.button>
              </motion.div>

              {/* Footer */}
              <p className="text-center text-xs font-mono text-white/30 mt-12 uppercase tracking-widest">
                ▓▓▓ SECURE CONNECTION ESTABLISHED ▓▓▓
              </p>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export default React.memo(PrivatePage);
