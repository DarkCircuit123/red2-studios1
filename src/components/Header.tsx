import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-[100rem] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-heading font-bold text-foreground dark:text-white tracking-tight"
        >
          STUDIO
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/#gallery"
            className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
          >
            Gallery
          </Link>
          <Link
            to="/#about"
            className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
          >
            About
          </Link>
          <Link
            to="/#portfolio"
            className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
          >
            Portfolio
          </Link>
          <Link
            to="/#clients"
            className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
          >
            Press
          </Link>
          <Link
            to="/#contact"
            className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Dark Mode Toggle & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800">
          <div className="max-w-[100rem] mx-auto px-6 py-4 flex flex-col gap-4">
            <Link
              to="/#gallery"
              className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
            <Link
              to="/#about"
              className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              to="/#portfolio"
              className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/#clients"
              className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Press
            </Link>
            <Link
              to="/#contact"
              className="text-sm font-paragraph text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white transition-colors"
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
