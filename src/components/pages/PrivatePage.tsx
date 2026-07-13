import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Unlock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ThemedContent {
  layer1Title: string;
  layer1Subtitle: string;
  layer1Warning: string;
  layer1Box1Title: string;
  layer1Box1Content: string;
  layer1Box2Title: string;
  layer1Box2Items: string[];
  layer1Box3Title: string;
  layer1Box3Content: string;
  layer2Title: string;
  layer2Subtitle: string;
  layer2Box1Title: string;
  layer2Box1Content: string;
  layer2Box2Title: string;
  layer2Box2Content: string;
  honesty: string;
}

const DEFAULT_CONTENT: ThemedContent = {
  layer1Title: 'CLASSIFIED',
  layer1Subtitle: '▓▓▓ RESTRICTED ACCESS ▓▓▓',
  layer1Warning: 'This section contains exclusive, confidential information. Unauthorized access is prohibited.',
  layer1Box1Title: 'Secret Knowledge Unlocked',
  layer1Box1Content: 'You have successfully accessed the classified archives. This exclusive section contains insider insights, behind-the-scenes stories, and confidential project details that are not available to the general public.',
  layer1Box2Title: 'Exclusive Portfolio Projects',
  layer1Box2Items: [
    'Project Codename: AURORA - Experimental photography series',
    'Project Codename: NEXUS - Unreleased commercial work',
    'Project Codename: CIPHER - Confidential client collaborations'
  ],
  layer1Box3Title: 'Behind the Scenes',
  layer1Box3Content: 'Discover the creative process, technical challenges overcome, and the stories behind each masterpiece. This section reveals the meticulous attention to detail and innovative techniques that set this work apart.',
  layer2Title: 'DEEP ARCHIVE',
  layer2Subtitle: '▓▓▓ LEVEL 2 CLEARANCE ▓▓▓',
  layer2Box1Title: 'Restricted Vault',
  layer2Box1Content: 'Access to experimental archives and unreleased conceptual work. This layer contains the most sensitive creative endeavors and classified collaborations.',
  layer2Box2Title: 'Operational Security',
  layer2Box2Content: 'All access is logged and monitored. Unauthorized distribution is prohibited under penalty of law.',
  honesty: '[FICTIONAL CONTENT FOR AESTHETIC PURPOSES]'
};

export default function PrivatePage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [layer2Unlocked, setLayer2Unlocked] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [content, setContent] = useState<ThemedContent>(DEFAULT_CONTENT);
  const konamiSequence = useRef<string[]>([]);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Secret passwords
  const SECRET_PASSWORD = 'classified';
  const LAYER2_PASSWORD = 'deeparchive';
  const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  // Load persisted rate limit state
  useEffect(() => {
    const unlockedSession = sessionStorage.getItem('privatePageUnlocked');
    if (unlockedSession === 'true') {
      setIsUnlocked(true);
    }

    const layer2Session = sessionStorage.getItem('privatePageLayer2');
    if (layer2Session === 'true') {
      setLayer2Unlocked(true);
    }

    // Restore persisted rate limit state
    const storedAttempts = sessionStorage.getItem('privatePageAttempts');
    const storedLockTime = sessionStorage.getItem('privatePageLockTime');
    
    if (storedLockTime) {
      const lockTime = parseInt(storedLockTime, 10);
      const now = Date.now();
      const elapsed = now - lockTime;
      const LOCKOUT_DURATION = 30000; // 30 seconds

      if (elapsed < LOCKOUT_DURATION) {
        setIsLocked(true);
        const remaining = Math.ceil((LOCKOUT_DURATION - elapsed) / 1000);
        setLockoutCountdown(remaining);
      } else {
        sessionStorage.removeItem('privatePageAttempts');
        sessionStorage.removeItem('privatePageLockTime');
      }
    }

    if (storedAttempts && !storedLockTime) {
      setAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked || lockoutCountdown <= 0) return;

    lockoutTimerRef.current = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setAttempts(0);
          setError('');
          sessionStorage.removeItem('privatePageAttempts');
          sessionStorage.removeItem('privatePageLockTime');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [isLocked, lockoutCountdown]);

  // Konami code listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      konamiSequence.current.push(e.key);
      if (konamiSequence.current.length > KONAMI_CODE.length) {
        konamiSequence.current.shift();
      }

      if (konamiSequence.current.join(',') === KONAMI_CODE.join(',')) {
        setIsUnlocked(true);
        sessionStorage.setItem('privatePageUnlocked', 'true');
        konamiSequence.current = [];
        console.log('🎮 Konami Code Activated! Layer 1 bypass granted.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Too many attempts. Please try again in ${lockoutCountdown}s.`);
      return;
    }

    // Trim password input
    const trimmedPassword = password.trim();

    if (trimmedPassword === SECRET_PASSWORD) {
      setIsUnlocked(true);
      setError('');
      setPassword('');
      setAttempts(0);
      sessionStorage.removeItem('privatePageAttempts');
      sessionStorage.removeItem('privatePageLockTime');
      sessionStorage.setItem('privatePageUnlocked', 'true');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('Access denied. Invalid credentials.');
      setPassword('');

      if (newAttempts >= 3) {
        setIsLocked(true);
        const lockTime = Date.now();
        sessionStorage.setItem('privatePageLockTime', lockTime.toString());
        sessionStorage.setItem('privatePageAttempts', newAttempts.toString());
        setLockoutCountdown(30);
      } else {
        sessionStorage.setItem('privatePageAttempts', newAttempts.toString());
      }
    }
  };

  const handleLayer2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedPassword = password.trim();

    if (trimmedPassword === LAYER2_PASSWORD) {
      setLayer2Unlocked(true);
      setError('');
      setPassword('');
      sessionStorage.setItem('privatePageLayer2', 'true');
      console.log('🔓 Layer 2 Unlocked! Deep archive access granted. Welcome to the red zone.');
    } else {
      setError('Layer 2 access denied.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setLayer2Unlocked(false);
    setPassword('');
    setAttempts(0);
    setError('');
    setLockoutCountdown(0);
    sessionStorage.removeItem('privatePageUnlocked');
    sessionStorage.removeItem('privatePageLayer2');
    sessionStorage.removeItem('privatePageAttempts');
    sessionStorage.removeItem('privatePageLockTime');
  };

  const animationVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
      }
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }
  };

  const motionConfig = prefersReducedMotion ? { duration: 0 } : { duration: 0.6 };

  return (
    <div className={`min-h-screen text-white overflow-hidden transition-colors duration-500 ${layer2Unlocked ? 'bg-red-950' : 'bg-black'}`}>
      <meta name="robots" content="noindex, nofollow" />
      <title>Restricted Access — {layer2Unlocked ? 'Level 2' : 'Level 1'}</title>
      
      <Header />

      {!isUnlocked ? (
        // Locked State - Layer 0
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
              transition={motionConfig}
              className="max-w-md mx-auto"
            >
              {/* Lock Icon */}
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
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
                {content.layer1Title}
              </h1>

              {/* Subtitle */}
              <p className="text-center text-white/50 font-mono text-xs uppercase tracking-widest mb-12">
                {content.layer1Subtitle}
              </p>

              {/* Honesty Tag */}
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 bg-white/5 border border-white/20 text-white/60 text-xs font-mono rounded">
                  {content.honesty}
                </span>
              </div>

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
                    {content.layer1Warning}
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
                  <label htmlFor="password-input" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                    Security Clearance Code
                  </label>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      disabled={isLocked}
                      placeholder="••••••••••••"
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-black border border-red-900/30 text-white placeholder-white/20 focus:outline-none focus:border-red-900 transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLocked}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    {isLocked && lockoutCountdown > 0 && (
                      <p className="text-xs mt-2 text-red-400/70">
                        System locked. Try again in {lockoutCountdown}s.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Attempt Counter */}
                {attempts > 0 && !isLocked && (
                  <div className="text-center text-xs font-mono text-white/40">
                    Failed attempts: {attempts}/3
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLocked || password.length === 0}
                  className="w-full py-3 bg-red-900 text-white font-heading font-bold text-sm uppercase tracking-widest hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-900"
                >
                  {isLocked ? `LOCKED (${lockoutCountdown}s)` : 'AUTHENTICATE'}
                </button>
              </motion.form>

              {/* Footer Text */}
              <p className="text-center text-xs font-mono text-white/30 mt-12 uppercase tracking-widest">
                ▓▓▓ END OF TRANSMISSION ▓▓▓
              </p>
            </motion.div>
          </div>
        </section>
      ) : !layer2Unlocked ? (
        // Unlocked State - Layer 1
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
              transition={motionConfig}
              className="max-w-2xl mx-auto"
            >
              {/* Success Icon */}
              <motion.div
                animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
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
                variants={animationVariants.container}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Content Box 1 */}
                <motion.div variants={animationVariants.item} className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h2 className="text-2xl font-heading font-bold text-white mb-4 uppercase">
                    {content.layer1Box1Title}
                  </h2>
                  <p className="text-white/70 font-paragraph leading-relaxed mb-4">
                    {content.layer1Box1Content}
                  </p>
                  <p className="text-white/60 font-mono text-sm">
                    Classification Level: TOP SECRET
                  </p>
                </motion.div>

                {/* Content Box 2 */}
                <motion.div variants={animationVariants.item} className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase">
                    {content.layer1Box2Title}
                  </h3>
                  <ul className="space-y-3 text-white/70 font-paragraph">
                    {content.layer1Box2Items.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-green-500">▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Content Box 3 */}
                <motion.div variants={animationVariants.item} className="p-8 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase">
                    {content.layer1Box3Title}
                  </h3>
                  <p className="text-white/70 font-paragraph leading-relaxed">
                    {content.layer1Box3Content}
                  </p>
                </motion.div>

                {/* Layer 2 Unlock Form */}
                <motion.div variants={animationVariants.item} className="p-8 border border-yellow-600/50 bg-yellow-600/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-yellow-600" />
                    Deeper Access Available
                  </h3>
                  <p className="text-white/70 font-paragraph leading-relaxed mb-6">
                    A hidden layer awaits. Enter the secondary clearance code to access Level 2 archives.
                  </p>
                  <form onSubmit={handleLayer2Submit} className="space-y-4">
                    <div className="relative">
                      <label htmlFor="layer2-password" className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
                        Level 2 Clearance Code
                      </label>
                      <input
                        id="layer2-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="••••••••••••"
                        autoComplete="off"
                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white placeholder-white/20 focus:outline-none focus:border-yellow-600 transition-colors font-mono text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-yellow-600/20 text-yellow-400 font-heading font-bold text-sm uppercase tracking-widest hover:bg-yellow-600/30 transition-all duration-300 border border-yellow-600/50"
                    >
                      UNLOCK LAYER 2
                    </button>
                  </form>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  variants={animationVariants.item}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
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
      ) : (
        // Unlocked State - Layer 2 (Deep Archive)
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          {/* Animated red background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(239,68,68,.1) 25%, rgba(239,68,68,.1) 26%, transparent 27%, transparent 74%, rgba(239,68,68,.1) 75%, rgba(239,68,68,.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(239,68,68,.1) 25%, rgba(239,68,68,.1) 26%, transparent 27%, transparent 74%, rgba(239,68,68,.1) 75%, rgba(239,68,68,.1) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }} />
          </div>

          <div className="max-w-[100rem] mx-auto px-8 w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionConfig}
              className="max-w-2xl mx-auto"
            >
              {/* Deep Access Icon */}
              <motion.div
                animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="flex justify-center mb-12"
              >
                <div className="w-24 h-24 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-red-500" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-4 text-center uppercase tracking-tighter">
                {content.layer2Title}
              </h1>

              {/* Status */}
              <p className="text-center text-red-500 font-mono text-xs uppercase tracking-widest mb-12">
                {content.layer2Subtitle}
              </p>

              {/* Secret Content */}
              <motion.div
                variants={animationVariants.container}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Content Box 1 */}
                <motion.div variants={animationVariants.item} className="p-8 border border-red-500/30 bg-red-500/5 backdrop-blur-sm">
                  <h2 className="text-2xl font-heading font-bold text-white mb-4 uppercase">
                    {content.layer2Box1Title}
                  </h2>
                  <p className="text-white/70 font-paragraph leading-relaxed">
                    {content.layer2Box1Content}
                  </p>
                </motion.div>

                {/* Content Box 2 */}
                <motion.div variants={animationVariants.item} className="p-8 border border-red-500/30 bg-red-500/5 backdrop-blur-sm">
                  <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase">
                    {content.layer2Box2Title}
                  </h3>
                  <p className="text-white/70 font-paragraph leading-relaxed">
                    {content.layer2Box2Content}
                  </p>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  variants={animationVariants.item}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-500/20 text-red-400 font-heading font-bold text-sm uppercase tracking-widest hover:bg-red-500/30 transition-all duration-300 border border-red-500/50 mt-8"
                >
                  TERMINATE SESSION
                </motion.button>
              </motion.div>

              {/* Footer */}
              <p className="text-center text-xs font-mono text-white/30 mt-12 uppercase tracking-widest">
                ▓▓▓ DEEP ARCHIVE ACTIVE ▓▓▓
              </p>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
