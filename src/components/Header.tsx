import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useMember } from '@/integrations';
import AdminPanel from './AdminPanel';
import { playClickSound, playHoverSound } from '@/lib/click-sound';
import { throttle } from '@/lib/performance';
import { useThrottleCallback } from '@/hooks/useAdvancedOptimization';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { member, isAuthenticated, isLoading, actions } = useMember();

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
          ? 'bg-black/95 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[120rem] mx-auto px-8 py-5 flex items-center justify-between from-black/20 to-transparent shadow-[inset_0px_0px_4px_0px_#bfbfbf] mix-blend-normal bg-secondary opacity-[0.82]">
        {/* Logo - Text-based RED² */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className="relative flex items-center gap-0"
        >
          <span className="text-2xl font-heading font-bold text-white tracking-tight">
            RED<span className="text-primary">²</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <a
            href="#portfolio"
            onClick={(e) => handleAnchorClick(e, '#portfolio')}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Gallery
          </a>
          <a
            href="#about"
            onClick={(e) => handleAnchorClick(e, '#about')}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            About
          </a>
          <Link
            to="/portfolio"
            onClick={handleLinkClick}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Work
          </Link>
          <Link
            to="/booking"
            onClick={handleLinkClick}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Booking
          </Link>
          <Link
            to="/galleries"
            onClick={handleLinkClick}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Galleries
          </Link>
          <a
            href="#contact"
            onClick={(e) => handleAnchorClick(e, '#contact')}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Contact
          </a>
          <Link
            to="/play"
            onClick={handleLinkClick}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Play
          </Link>
          <Link
            to="/admin-login"
            onClick={handleLinkClick}
            onMouseEnter={playHoverSound}
            className="text-xs font-mono text-white/60 hover:text-white hover:scale-[1.08] transition-all duration-300 uppercase tracking-widest"
          >
            Admin
          </Link>
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
                    className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest hidden sm:block"
                  >
                    {member?.profile?.nickname || 'Profile'}
                  </Link>
                  <button
                    onClick={() => {
                      playClickSound();
                      actions.logout();
                    }}
                    className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest hidden sm:flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    playClickSound();
                    actions.login();
                  }}
                  className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest hidden sm:block"
                >
                  Client Login
                </button>
              )}
            </>
          )}

          <button
            onClick={handleAdminClick}
            className="p-2 hover:bg-white/10 transition-colors duration-300"
            aria-label="Admin panel"
            title="Admin Panel"
          >
            <Settings className="w-4 h-4 text-white/40 hover:text-white/60" />
          </button>

          <button
            onClick={handleMobileMenuClick}
            className="md:hidden p-2 hover:bg-white/10 transition-colors duration-300"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-white/60" />
            ) : (
              <Menu className="w-5 h-5 text-white/60" />
            )}
          </button>
        </div>
      </nav>
      {/* Admin Panel */}
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 backdrop-blur-md">
          <div className="max-w-[120rem] mx-auto px-8 py-6 flex flex-col gap-6">
            <a
              href="#portfolio"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={(e) => {
                handleAnchorClick(e, '#portfolio');
                setIsOpen(false);
              }}
            >
              Gallery
            </a>
            <a
              href="#about"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={(e) => {
                handleAnchorClick(e, '#about');
                setIsOpen(false);
              }}
            >
              About
            </a>
            <Link
              to="/portfolio"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Work
            </Link>
            <Link
              to="/booking"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Booking
            </Link>
            <Link
              to="/galleries"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Galleries
            </Link>
            <a
              href="#contact"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={(e) => {
                handleAnchorClick(e, '#contact');
                setIsOpen(false);
              }}
            >
              Contact
            </a>
            <Link
              to="/play"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Play
            </Link>
            <Link
              to="/admin-login"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onMouseEnter={playHoverSound}
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Admin
            </Link>
            {/* Mobile Auth */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    <div className="border-t border-white/10 pt-6">
                      <Link
                        to="/profile"
                        className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest block mb-4"
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
                        className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
                      >
                        <LogOut className="w-3 h-3" />
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="border-t border-white/10 pt-6">
                    <button
                      onClick={() => {
                        playClickSound();
                        actions.login();
                        setIsOpen(false);
                      }}
                      className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
                    >
                      Client Login
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
