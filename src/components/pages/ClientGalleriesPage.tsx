import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/lib/clientAuthStore';
import { useGallerySEO } from '@/hooks/useGallerySEO';

interface ClientGallery {
  _id: string;
  clientName: string;
  clientEmail: string;
  galleryAccessCode: string;
  approvalStatus: string;
  galleryCoverImage: string;
  galleryExpirationDate: string;
}

// Rate limiting configuration
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  attempts: number;
  firstAttemptTime: number;
}

export default function ClientGalleriesPage() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(false);
  const { setClientSession } = useAuthStore();

  // Set SEO meta tags
  useGallerySEO();

  // Check rate limit on mount
  useEffect(() => {
    const rateLimitData = sessionStorage.getItem('galleryAccessAttempts');
    if (rateLimitData) {
      const data: RateLimitData = JSON.parse(rateLimitData);
      const now = Date.now();
      if (now - data.firstAttemptTime < RATE_LIMIT_WINDOW_MS && data.attempts >= RATE_LIMIT_ATTEMPTS) {
        setRateLimitError(true);
      }
    }
  }, []);

  const updateRateLimit = () => {
    const rateLimitData = sessionStorage.getItem('galleryAccessAttempts');
    const now = Date.now();
    let data: RateLimitData;

    if (rateLimitData) {
      data = JSON.parse(rateLimitData);
      if (now - data.firstAttemptTime >= RATE_LIMIT_WINDOW_MS) {
        // Reset if window expired
        data = { attempts: 1, firstAttemptTime: now };
      } else {
        data.attempts += 1;
      }
    } else {
      data = { attempts: 1, firstAttemptTime: now };
    }

    sessionStorage.setItem('galleryAccessAttempts', JSON.stringify(data));
    return data.attempts >= RATE_LIMIT_ATTEMPTS;
  };

  const handleAccessGallery = async (code: string) => {
    setError('');

    if (rateLimitError) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    if (!code.trim()) {
      setError('Please enter an access code.');
      return;
    }

    setIsSearching(true);

    try {
      // Query for gallery with matching access code
      const result = await BaseCrudService.getAll<ClientGallery>('clientgalleries', {}, { limit: 100 });
      
      // Find gallery with matching code
      const gallery = result.items?.find(
        (g) => g.galleryAccessCode?.toUpperCase() === code.toUpperCase()
      );

      if (!gallery) {
        const isLimited = updateRateLimit();
        if (isLimited) {
          setRateLimitError(true);
          setError('Too many failed attempts. Please try again in 15 minutes.');
        } else {
          setError('Invalid access code. Please check and try again.');
        }
        setIsSearching(false);
        return;
      }

      // Check expiration
      if (gallery.galleryExpirationDate) {
        const expirationDate = new Date(gallery.galleryExpirationDate);
        if (expirationDate < new Date()) {
          setError('This gallery has expired.');
          setIsSearching(false);
          return;
        }
      }

      // Store session in sessionStorage (not localStorage)
      const session = {
        clientEmail: gallery.clientEmail,
        galleryId: gallery._id,
        clientName: gallery.clientName,
        accessCode: code.toUpperCase(),
      };
      sessionStorage.setItem('gallerySession', JSON.stringify(session));
      setClientSession(session);

      // Clear rate limit on success
      sessionStorage.removeItem('galleryAccessAttempts');

      // Navigate to gallery
      navigate(`/client-gallery/${gallery._id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Client Galleries
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              Access your private proofing gallery with your unique access code.
            </p>
          </motion.div>

          {/* Access Code Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-16 max-w-md"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                disabled={rateLimitError}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 font-mono text-sm disabled:opacity-50"
              />
              <button
                onClick={() => handleAccessGallery(accessCode)}
                disabled={!accessCode || isSearching || rateLimitError}
                className="px-6 py-3 bg-white text-slate-950 font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Access'}
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Check your email for your unique access code
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-2xl p-6 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-white mb-2">Private Access Only</h3>
                <p className="text-sm text-white/60">
                  This gallery is protected. Only authorized clients with a valid access code can view their proofing galleries. 
                  All access is logged and galleries expire after the specified date.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
