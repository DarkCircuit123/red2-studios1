import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect } from 'react';
import { ClientsPress } from '@/entities/index';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants, getStaggeredVariant } from '@/lib/scroll-animation-variants';

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true });

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        setIsLoading(true);
        const clientsData = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 });
        if (clientsData.items && clientsData.items.length > 0) {
          setSponsors(clientsData.items);
        } else {
          console.error('Error loading sponsors: no items found');
          setSponsors([]);
        }
      } catch (error) {
        console.error('Error loading sponsors:', error);
        setSponsors([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSponsors();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={scrollAnimationVariants.headingSlideUp}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 tracking-tight">
            Sponsored By
          </h2>
          <motion.p
            initial="hidden"
            animate={sectionVisible ? "visible" : "hidden"}
            variants={scrollAnimationVariants.textSlideUp}
            transition={{ delay: 0.15 }}
            className="text-sm md:text-base text-white/60 max-w-2xl mx-auto font-mono"
          >
            Collaborating with industry-leading partners to deliver exceptional visual experiences
          </motion.p>
        </motion.div>

        {/* Sponsors Grid */}
        <motion.div
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={scrollAnimationVariants.containerStagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
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
                variants={getStaggeredVariant(index, 0.15, 0.1)}
                whileHover={{ y: -4 }}
                className="group relative flex items-center justify-center p-8 md:p-12 bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10"
              >
                <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
                  {sponsor.clientLogo ? (
                    <Image
                      src={sponsor.clientLogo}
                      alt={sponsor.clientName || 'Sponsor'}
                      width={320}
                      height={160}
                      loading="lazy"
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
        </motion.div>
      </div>
    </section>
  );
}
