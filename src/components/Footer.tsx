import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import { playClickSound } from '@/lib/click-sound';
import { useCallback, useMemo } from 'react';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function Footer() {
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
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div>
            <style>{`
              @keyframes spin-2-footer {
                0% {
                  transform: rotateY(0deg);
                }
                100% {
                  transform: rotateY(360deg);
                }
              }
              .footer-logo-container:hover .footer-logo-2-inner {
                animation: spin-2-footer 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1;
              }
              .footer-logo-2-inner {
                position: relative;
                display: inline-block;
                width: 1em;
                height: 1em;
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
              }
              .footer-logo-2-face {
                position: absolute;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                backface-visibility: hidden;
                font-size: 1em;
              }
              .footer-logo-2-front {
                color: #6F0809;
                z-index: 2;
                transform: translateZ(0.5em);
              }
              .footer-logo-2-back {
                color: #6F0809;
                transform: rotateY(180deg) translateZ(0.5em);
              }
            `}</style>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="mb-4"
            >
              <Link
                to="/"
                onClick={playClickSound}
                className="footer-logo-container relative flex items-center gap-0 group w-fit"
              >
                <span className="text-2xl font-heading font-black tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,36,0,0.8)]">
                  <span className="text-white inline-block transition-colors duration-300 group-hover:text-scarlet">
                    RED
                  </span><span 
                    className="footer-logo-2 inline-block transition-colors duration-300 -ml-2 text-lg -mt-5"
                    style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
                  >
                    <span className="footer-logo-2-inner">
                      <span className="footer-logo-2-face footer-logo-2-front text-primary">²</span>
                      <span className="footer-logo-2-face footer-logo-2-back text-primary">²</span>
                    </span>
                  </span>
                </span>
              </Link>
            </motion.div>
            <p className="text-sm text-white/60 leading-relaxed font-mono md:text-xs">
              High-end fashion photography & visual storytelling
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/50 mb-6 uppercase tracking-widest">
              Navigation
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#portfolio"
                  onClick={(e) => handleAnchorClick(e, '#portfolio')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Work
                </Link>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/50 mb-6 uppercase tracking-widest">
              Services
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Editorial
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Commercial
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Campaigns
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleAnchorClick(e, '#about')}
                  className="text-sm md:text-base font-paragraph text-white/70 hover:text-white transition-colors duration-300"
                >
                  Consulting
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-white/50 mb-6 uppercase tracking-widest">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/jmichaelzuniga"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/jordanmzuniga/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@red2studios.com"
                className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs md:text-sm font-mono text-white/40">
              © {currentYear} RED2 Studios. All rights reserved.
            </p>
            <div className="flex gap-6 md:gap-8">
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs md:text-sm font-mono text-white/40 hover:text-white/70 transition-colors duration-300 uppercase tracking-widest"
              >
                Privacy
              </a>
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs md:text-sm font-mono text-white/40 hover:text-white/70 transition-colors duration-300 uppercase tracking-widest"
              >
                Terms
              </a>
              <a
                href="#about"
                onClick={(e) => handleAnchorClick(e, '#about')}
                className="text-xs md:text-sm font-mono text-white/40 hover:text-white/70 transition-colors duration-300 uppercase tracking-widest"
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
