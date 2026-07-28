import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect } from 'react';
import { ClientsPress } from '@/entities/index';

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSponsors = async () => {
      try {
        setIsLoading(true);
        const clientsData = await Promise.race([
          BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        if (clientsData?.items && Array.isArray(clientsData.items) && clientsData.items.length > 0) {
          setSponsors(clientsData.items);
        } else {
          setSponsors([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading sponsors:', error);
          setSponsors([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadSponsors();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 tracking-tight">
            Sponsored By
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto font-mono">
            Collaborating with industry-leading partners to deliver exceptional visual experiences
          </p>
        </motion.div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60">Loading sponsors...</p>
            </div>
          ) : sponsors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60">No sponsors found</p>
            </div>
          ) : (
            sponsors.map((sponsor, index) => (
              <motion.a
                key={sponsor._id}
                href={sponsor.externalLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative flex items-center justify-center p-8 md:p-12 bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10"
              >
                <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
                  {sponsor.clientLogo ? (
                    <Image
                      src={sponsor.clientLogo}
                      alt={sponsor.clientName || 'Sponsor'}
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  ) : (
                    <p className="text-white/40 text-sm">No image</p>
                  )}
                </div>
                
                {/* Hover overlay with name */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white font-heading font-semibold text-center px-4">
                    {sponsor.clientName || 'Sponsor'}
                  </p>
                </div>
              </motion.a>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
