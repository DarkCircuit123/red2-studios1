import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
                <Link
                  to="/#portfolio"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  About
                </Link>
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
                <Link
                  to="/#contact"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Contact
                </Link>
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
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Editorial
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Commercial
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Campaigns
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-white/60 hover:text-white transition-colors"
                >
                  Consulting
                </Link>
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
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
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
              <Link
                to="/#about"
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Privacy
              </Link>
              <Link
                to="/#about"
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Terms
              </Link>
              <Link
                to="/#about"
                className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
