import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateRandomBookingDates } from '@/lib/generate-random-bookings';
import { BaseCrudService } from '@/integrations';

export default function SeedBookingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedBookings = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const bookings = generateRandomBookingDates();
      console.log(`Creating ${bookings.length} random booking slots...`);

      let successCount = 0;
      const errors: string[] = [];

      for (const booking of bookings) {
        try {
          await BaseCrudService.create('bookingavailability', booking);
          successCount++;
        } catch (err) {
          errors.push(`Failed to create booking for ${booking.bookingDate}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (successCount > 0) {
        setResult({
          success: true,
          message: `Successfully created ${successCount} booking slots!`,
          count: successCount,
        });
      }

      if (errors.length > 0) {
        setError(`${errors.length} bookings failed to create. Check console for details.`);
        console.error('Booking creation errors:', errors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error seeding bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Seed Bookings
            </h1>
            <p className="text-lg text-white/60 mb-8">
              Generate 10 random booking dates for each of the next 4 months to populate the booking calendar.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold mb-4">What this does:</h2>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">•</span>
                      <span>Creates 10 random dates per month for the current and next 3 months</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">•</span>
                      <span>Assigns random time slots (9 AM - 6 PM)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">•</span>
                      <span>Assigns random session types (Portrait, Product, Event, etc.)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent mt-1">•</span>
                      <span>Marks all slots as available</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-4">
                    Total bookings to create: <span className="font-bold text-white">~40 slots</span>
                  </p>

                  <button
                    onClick={handleSeedBookings}
                    disabled={isLoading}
                    className="w-full px-8 py-4 bg-white text-black font-heading font-bold text-lg rounded hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating Bookings...
                      </>
                    ) : (
                      'Seed Bookings Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {result && result.success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-green-500/20 border border-green-500/50 text-green-400 rounded flex items-start gap-3 mb-8"
              >
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{result.message}</p>
                  <p className="text-sm text-green-300/80 mt-1">
                    Visit the <a href="/booking" className="underline hover:no-underline">booking page</a> to see your new slots!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-red-500/20 border border-red-500/50 text-red-400 rounded flex items-start gap-3"
              >
                <X className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
