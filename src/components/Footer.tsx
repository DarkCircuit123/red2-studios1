import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail, Facebook } from 'lucide-react';
import { playClickSound } from '@/lib/click-sound';
import { useCallback, useMemo } from 'react';

function Footer() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    playClickSound();
    
    // If not on homepage, navigate to homepage first
    const isHomePage = window.location.pathname === '/';
    if (!isHomePage) {
      window.location.href = `/${hash}`;
      return;
    }
    
    // On homepage, scroll to element
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-heading font-bold text-white mb-3 tracking-wide">
              RED2
            </h3>
            <p className="text-sm font-paragraph text-white/50">
              High-end fashion photography & visual storytelling
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/40 mb-6 uppercase tracking-widest">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#portfolio"
                  onClick={(e) => handleAnchorClick(e, '#portfolio')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Work
                </Link>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/40 mb-6 uppercase tracking-widest">
              Services
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Editorial
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Commercial
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Campaigns
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Consulting
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/40 mb-6 uppercase tracking-widest">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/jmichaelzuniga"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/jordanmzuniga/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/60 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/60 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@studio.com"
                className="p-2 text-white/60 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-white/30">
              © {currentYear} Studio. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Privacy
              </a>
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Terms
              </a>
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
