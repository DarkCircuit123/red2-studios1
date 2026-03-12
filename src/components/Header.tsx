import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import AdminPanel from './AdminPanel';
import { playClickSound, playHoverSound } from '@/lib/click-sound';
import { throttle } from '@/lib/performance';
import { useThrottleCallback } from '@/hooks/useAdvancedOptimization';
import { respectReducedMotion } from '@/lib/performance-enhancements';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const prefersReducedMotion = respectReducedMotion();

  // Optimized throttled scroll handler with useThrottleCallback
  const handleScroll = useThrottleCallback(() => {
    setScrolled(window.scrollY > 50);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLinkClick = useCallback(() => {
    playClickSound();
  }, []);

  const handleAdminClick = useCallback(() => {
    playClickSound();
    setIsAdminOpen(true);
  }, []);

  const handleMobileMenuClick = useCallback(() => {
    playClickSound();
    setIsOpen(prev => !prev);
  }, []);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    playClickSound();
    
    // If not on homepage, navigate to homepage first
    const isHomePage = window.location.pathname === '/';
    if (!isHomePage) {
      window.location.href = `/?scroll=${hash.substring(1)}`;
      return;
    }
    
    // On homepage, scroll to element with optimized timing
    const scrollToElement = () => {
      const element = document.querySelector(hash);
      if (element) {
        // Add extra offset for fixed header
        const headerHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    };
    
    // Try immediately and with optimized delays
    scrollToElement();
    const timeout1 = setTimeout(scrollToElement, 100);
    const timeout2 = setTimeout(scrollToElement, 300);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md border-b border-primary/30'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[120rem] mx-auto px-6 md:px-8 py-6 flex items-center justify-between">
        {/* Logo - Text-based RED² with shimmer effect */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            to="/"
            onClick={handleLinkClick}
            className="relative flex items-center gap-0 group"
          >
            <span className="text-2xl font-heading font-black text-white tracking-tight hover:text-primary transition-colors duration-300">
              RED<span className="text-primary relative inline-block">
                ²
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  style={{
                    filter: 'blur(8px)',
                  }}
                />
              </span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          {[
            { href: '#portfolio', label: 'Gallery' },
            { href: '#about', label: 'About' },
            { href: '/portfolio', label: 'Work', isLink: true },
            { href: '/booking', label: 'Booking', isLink: true },
            { href: '/galleries', label: 'Galleries', isLink: true },
            { href: '#contact', label: 'Contact' },
            { href: '/play', label: 'Play', isLink: true },
            { href: '/admin-login', label: 'Admin', isLink: true },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.isLink ? (
                <Link
                  to={item.href}
                  onClick={handleLinkClick}
                  onMouseEnter={playHoverSound}
                  className="text-xs font-mono text-white/60 hover:text-primary hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.href)}
                  onMouseEnter={playHoverSound}
                  className="text-xs font-mono text-white/60 hover:text-primary hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
                >
                  {item.label}
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Admin & Mobile Menu */}
        <div className="flex items-center gap-6">
          {/* Auth Links */}
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={handleLinkClick}
                    className="text-xs font-mono text-white/60 hover:text-primary transition-colors duration-300 uppercase tracking-widest hidden sm:block"
                  >
                    {member?.profile?.nickname || 'Profile'}
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playClickSound();
                      actions.logout();
                    }}
                    className="text-xs font-mono text-white/60 hover:text-primary transition-colors duration-300 uppercase tracking-widest hidden sm:flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playClickSound();
                    actions.login();
                  }}
                  className="text-xs font-mono text-white/60 hover:text-primary transition-colors duration-300 uppercase tracking-widest hidden sm:block"
                >
                  Client Login
                </motion.button>
              )}
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdminClick}
            className="p-2 hover:bg-primary/10 transition-colors duration-300 rounded-lg"
            aria-label="Admin panel"
            title="Admin Panel"
          >
            <Settings className="w-4 h-4 text-white/40 hover:text-primary transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMobileMenuClick}
            className="md:hidden p-2 hover:bg-white/10 transition-colors duration-300 rounded-lg"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-white/60" />
            ) : (
              <Menu className="w-5 h-5 text-white/60" />
            )}
          </motion.button>
        </div>
      </nav>
      {/* Admin Panel */}
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="md:hidden bg-black/95 border-t border-primary/30 backdrop-blur-md"
        >
          <div className="max-w-[120rem] mx-auto px-8 py-6 flex flex-col gap-6">
            {[
              { href: '#portfolio', label: 'Gallery' },
              { href: '#about', label: 'About' },
              { href: '/portfolio', label: 'Work', isLink: true },
              { href: '/booking', label: 'Booking', isLink: true },
              { href: '/galleries', label: 'Galleries', isLink: true },
              { href: '#contact', label: 'Contact' },
              { href: '/play', label: 'Play', isLink: true },
              { href: '/admin-login', label: 'Admin', isLink: true },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {item.isLink ? (
                  <Link
                    to={item.href}
                    className="text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest"
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      handleLinkClick();
                      setIsOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest"
                    onMouseEnter={playHoverSound}
                    onClick={(e) => {
                      handleAnchorClick(e, item.href);
                      setIsOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                )}
              </motion.div>
            ))}
            {/* Mobile Auth */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="border-t border-primary/30 pt-6">
                    <Link
                      to="/profile"
                      className="text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest block mb-4"
                      onClick={() => {
                        handleLinkClick();
                        setIsOpen(false);
                      }}
                    >
                      {member?.profile?.nickname || 'Profile'}
                    </Link>
                    <button
                      onClick={() => {
                        playClickSound();
                        actions.logout();
                        setIsOpen(false);
                      }}
                      className="text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-primary/30 pt-6">
                    <button
                      onClick={() => {
                        playClickSound();
                        actions.login();
                        setIsOpen(false);
                      }}
                      className="text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest"
                    >
                      Client Login
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
