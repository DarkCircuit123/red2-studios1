import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';

interface PINAuthWrapperProps {
  galleryId: string;
  children: React.ReactNode;
}

const PIN_AUTH_KEY = 'pin_auth_';
const PIN_AUTH_EXPIRY = 30 * 60 * 1000; // 30 minutes

export default function PINAuthWrapper({ galleryId, children }: PINAuthWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPINForm, setShowPINForm] = useState(true);

  // Check if already authorized in sessionStorage
  useEffect(() => {
    const authKey = `${PIN_AUTH_KEY}${galleryId}`;
    const stored = sessionStorage.getItem(authKey);
    
    if (stored) {
      try {
        const { timestamp } = JSON.parse(stored);
        const now = Date.now();
        
        // Check if authorization is still valid (30 minutes)
        if (now - timestamp < PIN_AUTH_EXPIRY) {
          setIsAuthorized(true);
          setShowPINForm(false);
        } else {
          // Expired, clear it
          sessionStorage.removeItem(authKey);
        }
      } catch (err) {
        sessionStorage.removeItem(authKey);
      }
    }
  }, [galleryId]);

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Fetch gallery to verify PIN
      const gallery = await BaseCrudService.getById('clientgalleries', galleryId);

      if (!gallery) {
        setError('Gallery not found');
        return;
      }

      if (gallery.currentPin !== pin) {
        setError('Invalid PIN. Please try again.');
        return;
      }

      // Log successful PIN entry
      await BaseCrudService.create('pinaccesslog', {
        _id: crypto.randomUUID(),
        galleryId,
        memberEmail: 'anonymous', // Will be updated when member context is available
        attemptedAt: new Date().toISOString(),
        success: true,
        userAgent: navigator.userAgent,
      });

      // Store authorization in sessionStorage with timestamp
      const authKey = `${PIN_AUTH_KEY}${galleryId}`;
      sessionStorage.setItem(
        authKey,
        JSON.stringify({ timestamp: Date.now() })
      );

      setIsAuthorized(true);
      setShowPINForm(false);
      setPin('');
    } catch (err) {
      console.error('PIN verification error:', err);
      
      // Log failed attempt
      try {
        await BaseCrudService.create('pinaccesslog', {
          _id: crypto.randomUUID(),
          galleryId,
          memberEmail: 'anonymous',
          attemptedAt: new Date().toISOString(),
          success: false,
          userAgent: navigator.userAgent,
        });
      } catch (logErr) {
        console.error('Failed to log PIN attempt:', logErr);
      }

      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/5 border border-white/10 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Gallery Locked
            </h1>
            <p className="text-white/60 mb-8">
              This gallery requires a PIN to view. Enter it below.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 text-left">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handlePINSubmit} className="space-y-4">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 font-mono"
              />

              <button
                type="submit"
                disabled={isLoading || pin.length !== 6}
                className="w-full py-3 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Unlock Gallery'}
              </button>
            </form>

            <p className="text-xs text-white/40 mt-6">
              Your authorization will expire after 30 minutes of inactivity.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
