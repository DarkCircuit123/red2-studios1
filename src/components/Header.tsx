import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import AdminPanel from './AdminPanel';
import { playClickSound, playHoverSound } from '@/lib/click-sound';
import { useThrottleCallback } from '@/hooks/useAdvancedOptimization';
import { respectReducedMotion } from '@/lib/performance-enhancements';

export default function Header() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const prefersReducedMotion = useMemo(() => respectReducedMotion(), []);

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
    
    const scrollToElement = () => {
      const element = document.querySelector(hash);
      if (element) {
        // Add extra offset for fixed header
        const headerHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    };
    
    // If not on homepage, use React Router navigation instead of full page reload
    const isHomePage = window.location.pathname === '/';
    if (!isHomePage) {
      // Navigate to homepage using React Router (no full page reload)
      navigate('/');
      // Schedule scroll after navigation completes
      setTimeout(() => {
        scrollToElement();
        setTimeout(scrollToElement, 100);
        setTimeout(scrollToElement, 300);
      }, 100);
      return;
    }
    
    // On homepage, scroll immediately with optimized timing
    scrollToElement();
    const timeout1 = setTimeout(scrollToElement, 100);
    const timeout2 = setTimeout(scrollToElement, 300);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [prefersReducedMotion, navigate]);

  const handlePageLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    playClickSound();
    navigate(path);
  }, [navigate]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-primary/30'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-[120rem] mx-auto px-6 md:px-8 py-6 flex items-center justify-between w-full relative">
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
            <span className="font-heading font-black text-white tracking-tight hover:text-primary transition-colors duration-300 text-7xl">
              RED<span className="text-primary">²</span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex items-center justify-center gap-12 absolute left-1/2 transform -translate-x-1/2">
          {[
            { href: '#about', label: 'About', isAnchor: true },
            { href: '/portfolio', label: 'Work', isLink: true },
            { href: '/booking', label: 'Booking', isLink: true, scrollTo: '#booking-form' },
            { href: '/contact', label: 'Contact', isLink: true, isPage: true },
            { href: '/play', label: 'Play', isLink: true },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.isAnchor ? (
                <a
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.href)}
                  onMouseEnter={playHoverSound}
                  className="px-4 py-3 text-xs font-mono text-white/60 hover:text-primary hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest rounded-lg hover:bg-white/5 block"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  onClick={(e) => {
                    handleLinkClick();
                    // If this is a page link with a scroll target, handle the scroll after navigation
                    if (item.scrollTo) {
                      setTimeout(() => {
                        const element = document.querySelector(item.scrollTo);
                        if (element) {
                          const headerHeight = 80;
                          const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
                          window.scrollTo({
                            top: elementPosition,
                            behavior: prefersReducedMotion ? 'auto' : 'smooth'
                          });
                        }
                      }, 100);
                    }
                  }}
                  onMouseEnter={playHoverSound}
                  className="px-4 py-3 text-xs font-mono text-white/60 hover:text-primary hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest rounded-lg hover:bg-white/5 block"
                >
                  {item.label}
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Admin & Mobile Menu - Right aligned */}
        <div className="flex items-center gap-6 ml-auto">
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
              { href: '#about', label: 'About', isAnchor: true },
              { href: '/portfolio', label: 'Work', isLink: true },
              { href: '/booking', label: 'Booking', isLink: true, scrollTo: '#booking-form' },
              { href: '/contact', label: 'Contact', isLink: true },
              { href: '/play', label: 'Play', isLink: true },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {item.isAnchor ? (
                  <a
                    href={item.href}
                    className="px-4 py-3 text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest rounded-lg hover:bg-white/5 block"
                    onMouseEnter={playHoverSound}
                    onClick={(e) => {
                      handleAnchorClick(e, item.href);
                      setIsOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="px-4 py-3 text-xs font-mono text-white/60 hover:text-primary transition-colors uppercase tracking-widest rounded-lg hover:bg-white/5 block"
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      handleLinkClick();
                      setIsOpen(false);
                      // If this is a page link with a scroll target, handle the scroll after navigation
                      if (item.scrollTo) {
                        setTimeout(() => {
                          const element = document.querySelector(item.scrollTo);
                          if (element) {
                            const headerHeight = 80;
                            const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
                            window.scrollTo({
                              top: elementPosition,
                              behavior: prefersReducedMotion ? 'auto' : 'smooth'
                            });
                          }
                        }, 100);
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      </header>
    </>
  );
}
