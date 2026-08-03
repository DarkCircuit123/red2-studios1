import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import AdminPanel from './AdminPanel';
import AdminLoginModal from './AdminLoginModal';
import { useAdminAuth } from '@/lib/adminAuthStore';
import { playClickSound, playHoverSound } from '@/lib/click-sound';
import { respectReducedMotion } from '@/lib/performance-enhancements';
import { debugLog } from '@/lib/debug-logger';

export default function Header() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const { isAdminAuthenticated, isVerifying, logout: adminLogout, verifySession } = useAdminAuth();
  const prefersReducedMotion = useMemo(() => respectReducedMotion(), []);

  // Reconcile real auth state from the server on every page load. The
  // client no longer persists isAdminAuthenticated to localStorage (see
  // adminAuthStore.ts), so without this call every refresh would show
  // "logged out" even with a perfectly valid session cookie — this is
  // what makes a refresh correctly stay logged in.
  useEffect(() => {
    verifySession().catch(err => {
      // Silently handle verification errors - expected for unauthenticated users
      debugLog('[HEADER] Admin session verification skipped (not authenticated)');
    });
  }, [verifySession]);

  // Optimized throttled scroll handler
  useEffect(() => {
    let lastScrollTime = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime >= 100) {
        setScrolled(window.scrollY > 50);
        lastScrollTime = now;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = useCallback(() => {
    playClickSound();
  }, []);

  const handleAdminClick = useCallback(() => {
    playClickSound();
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  }, [isAdminAuthenticated]);

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
        // Add extra offset for fixed header (100px for better visibility)
        const headerHeight = 100;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: Math.max(0, elementPosition),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    };
    
    // If not on homepage, use React Router navigation instead of full page reload
    const isHomePage = window.location.pathname === '/';
    if (!isHomePage) {
      // Navigate to homepage using React Router (no full page reload)
      navigate('/');
      // Schedule scroll after navigation completes with multiple attempts
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
        {/* Logo - Text-based RED² with unified hover behavior */}
        <style>{`
          @keyframes spin-2 {
            from {
              transform: rotateY(0deg);
            }
            to {
              transform: rotateY(360deg);
            }
          }
          .logo-container:hover .logo-2 {
            animation: spin-2 4s linear infinite;
          }
        `}</style>
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.98 }}
          className="logo-container group"
        >
          <Link
            to="/"
            onClick={handleLinkClick}
            className="relative flex items-center gap-0"
          >
            <span className="font-heading font-black tracking-tight text-7xl transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(111,8,9,0.8)]">
              <span className="text-white inline-block transition-colors duration-300 group-hover:text-primary">
                RED
              </span>
              <span 
                className="logo-2 text-primary inline-block transition-colors duration-300 group-hover:text-white"
                style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
              >
                ²
              </span>
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
          {/* Admin gear icon - always show, but behavior changes based on auth */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdminClick}
            disabled={isVerifying}
            className={`p-2 transition-colors duration-300 rounded-lg ${
              isVerifying
                ? 'opacity-50 cursor-wait'
                : isAdminAuthenticated
                ? 'hover:bg-primary/10'
                : 'hover:bg-white/10'
            }`}
            aria-label="Admin panel"
            title={isVerifying ? 'Checking session…' : isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}
          >
            <Settings className={`w-4 h-4 transition-colors ${
              isAdminAuthenticated
                ? 'text-primary hover:text-primary/80'
                : 'text-white/60 hover:text-white'
            }`} />
          </motion.button>

          {/* Admin Logout Button - only show when authenticated */}
          {isAdminAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClickSound();
                adminLogout();
                setIsAdminOpen(false);
              }}
              className="p-2 hover:bg-red-500/10 transition-colors duration-300 rounded-lg"
              aria-label="Admin logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-500 hover:text-red-600 transition-colors" />
            </motion.button>
          )}

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
      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsAdminOpen(true)}
      />
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
