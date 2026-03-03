import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
      <div className="max-w-[100rem] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-foreground dark:text-white mb-2">
              STUDIO
            </h3>
            <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
              High-end fashion photography & visual storytelling
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-heading font-semibold text-foreground dark:text-white mb-4 uppercase tracking-wide">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/#gallery"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/#portfolio"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  to="/#contact"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-heading font-semibold text-foreground dark:text-white mb-4 uppercase tracking-wide">
              Services
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Editorial
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Commercial
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Campaigns
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm font-paragraph text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  Consulting
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-heading font-semibold text-foreground dark:text-white mb-4 uppercase tracking-wide">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-foreground dark:text-white" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-foreground dark:text-white" />
              </a>
              <a
                href="mailto:hello@studio.com"
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5 text-foreground dark:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-paragraph text-foreground/50 dark:text-gray-500">
              © {currentYear} Studio. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-xs font-paragraph text-foreground/50 dark:text-gray-500 hover:text-foreground dark:hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-xs font-paragraph text-foreground/50 dark:text-gray-500 hover:text-foreground dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-xs font-paragraph text-foreground/50 dark:text-gray-500 hover:text-foreground dark:hover:text-white transition-colors"
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
