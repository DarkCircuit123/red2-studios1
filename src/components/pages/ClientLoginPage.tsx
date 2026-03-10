import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { useAuthStore } from '@/lib/clientAuthStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ClientGallery {
  _id: string;
  clientName: string;
  clientEmail: string;
  galleryAccessCode: string;
  approvalStatus: string;
  galleryCoverImage: string;
  galleryExpirationDate: string;
}

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { setClientSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await BaseCrudService.getAll<ClientGallery>('clientgalleries', {}, { limit: 100 });
      const galleries = result.items || [];

      const gallery = galleries.find(
        (g) =>
          g.clientEmail?.toLowerCase() === email.toLowerCase() &&
          g.galleryAccessCode === accessCode.toUpperCase()
      );

      if (!gallery) {
        setError('Invalid email or access code. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if gallery is expired
      if (gallery.galleryExpirationDate) {
        const expirationDate = new Date(gallery.galleryExpirationDate);
        if (expirationDate < new Date()) {
          setError('This gallery has expired. Please contact the photographer.');
          setIsLoading(false);
          return;
        }
      }

      // Set client session
      setClientSession({
        clientEmail: gallery.clientEmail || '',
        galleryId: gallery._id,
        clientName: gallery.clientName || '',
      });

      // Redirect to client gallery view
      navigate(`/client-gallery/${gallery._id}`);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 uppercase">
                Client Access
              </h1>
              <p className="text-lg text-white/60">
                Enter your email and access code to view your gallery
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Access Code Input */}
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Enter your code"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 font-mono tracking-widest"
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Check your email for your unique access code
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !accessCode}
                className="w-full py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? 'Verifying...' : 'Access Gallery'}
              </button>
            </motion.form>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg text-center"
            >
              <p className="text-sm text-white/60">
                Don't have an access code?{' '}
                <a href="#contact" className="text-white hover:text-white/80 transition-colors">
                  Contact us
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
