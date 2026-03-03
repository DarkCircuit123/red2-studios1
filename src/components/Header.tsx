import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun, Settings } from 'lucide-react';
import AdminPanel from './AdminPanel';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true); // Dark mode default
  const [scrolled, setScrolled] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    // Set dark mode as default on mount
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[120rem] mx-auto px-8 py-5 flex items-center justify-between">
        {/* Logo - Ultra-minimal */}
        <Link
          to="/"
          className="text-lg font-heading font-bold text-white tracking-widest uppercase letter-spacing-2"
        >
          —
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <Link
            to="/#gallery"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Gallery
          </Link>
          <Link
            to="/#about"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            About
          </Link>
          <Link
            to="/portfolio"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Work
          </Link>
          <Link
            to="/booking"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Booking
          </Link>
          <Link
            to="/galleries"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Galleries
          </Link>
          <Link
            to="/#clients"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Press
          </Link>
          <Link
            to="/#contact"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors duration-300 uppercase tracking-widest"
          >
            Contact
          </Link>
        </div>

        {/* Dark Mode Toggle & Mobile Menu */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 hover:bg-white/5 transition-colors duration-300"
            aria-label="Admin panel"
            title="Admin Panel"
          >
            <Settings className="w-4 h-4 text-white/40 hover:text-white/60" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-white/5 transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-white/40 hover:text-white/60" />
            ) : (
              <Moon className="w-4 h-4 text-white/40 hover:text-white/60" />
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-white/5 transition-colors duration-300"
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
        <div className="md:hidden bg-slate-950/95 border-t border-white/5 backdrop-blur-md">
          <div className="max-w-[120rem] mx-auto px-8 py-6 flex flex-col gap-6">
            <Link
              to="/#gallery"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
            <Link
              to="/#about"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              to="/portfolio"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Work
            </Link>
            <Link
              to="/booking"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Booking
            </Link>
            <Link
              to="/galleries"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Galleries
            </Link>
            <Link
              to="/#clients"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Press
            </Link>
            <Link
              to="/#contact"
              className="text-xs font-mono text-white/60 hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
