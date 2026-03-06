import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useMember } from '@/integrations';
import AdminPanel from './AdminPanel';
import { playClickSound } from '@/lib/click-sound';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { member, isAuthenticated, isLoading, actions } = useMember();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    playClickSound();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[120rem] mx-auto px-8 py-5 flex items-center justify-between">
        {/* Logo - RED² with 2 above D */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className="relative flex items-center gap-0"
        >
          <span className="text-lg font-heading font-bold text-red-900 tracking-widest uppercase">RE</span>
          <div className="relative inline-block">
            <span className="text-xs font-heading font-bold text-white tracking-widest leading-none absolute -top-2 left-1/2 transform -translate-x-1/2">²</span>
            <span className="text-lg font-heading font-bold text-red-900 tracking-widest uppercase">D</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <Link
            to="/#portfolio"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Gallery
          </Link>
          <Link
            to="/#about"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            About
          </Link>
          <Link
            to="/portfolio"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Work
          </Link>
          <Link
            to="/booking"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Booking
          </Link>
          <Link
            to="/galleries"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Galleries
          </Link>
          <Link
            to="/#contact"
            onClick={handleLinkClick}
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Contact
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
            onClick={() => {
              playClickSound();
              setIsAdminOpen(true);
            }}
            className="p-2 hover:bg-white/10 transition-colors duration-300"
            aria-label="Admin panel"
            title="Admin Panel"
          >
            <Settings className="w-4 h-4 text-white/40 hover:text-white/60" />
          </button>

          <button
            onClick={() => {
              playClickSound();
              setIsOpen(!isOpen);
            }}
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
            <Link
              to="/#portfolio"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Gallery
            </Link>
            <Link
              to="/#about"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              About
            </Link>
            <Link
              to="/portfolio"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
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
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Galleries
            </Link>
            <Link
              to="/#contact"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => {
                handleLinkClick();
                setIsOpen(false);
              }}
            >
              Contact
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
