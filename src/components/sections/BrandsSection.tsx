import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect } from 'react';
import { ClientsPress } from '@/entities/index';
import { editorialTiming, editorialEasing, editorialDistance } from '@/lib/editorial-motion-system';

export default function BrandsSection() {
  const [brands, setBrands] = useState<ClientsPress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setIsLoading(true);
        const clientsData = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 });
        if (clientsData.items && clientsData.items.length > 0) {
          setBrands(clientsData.items);
        } else {
          setBrands([]);
        }
      } catch (error) {
        console.error('Error loading brands:', error);
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadBrands();
  }, []);

  return (
    <section className="relative w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header - Editorial Motion */}
        <motion.div
          initial={{ opacity: 0, y: editorialDistance.headingOffset.large }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: editorialTiming.headingDuration / 1000,
            ease: editorialEasing.typographySettle,
          }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 tracking-tight">
            Featured Brands
          </h2>
          <motion.p
            initial={{ opacity: 0, y: editorialDistance.detailsOffset.medium }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: editorialTiming.detailsDuration / 1000,
              delay: editorialTiming.detailsDelay / 1000,
              ease: editorialEasing.detailsSettle,
            }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-sm md:text-base text-white/60 max-w-2xl mx-auto font-mono"
          >
            Collaborating with industry-leading partners to deliver exceptional visual experiences
          </motion.p>
        </motion.div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60">Loading brands...</p>
            </div>
          ) : brands.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60">No brands found</p>
            </div>
          ) : (
            brands.map((brand, index) => (
              <motion.a
                key={brand._id}
                href={brand.externalLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: editorialDistance.imageOffset.medium }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: editorialTiming.imageEnter / 1000,
                  delay: (index * editorialTiming.hoverDuration) / 1000,
                  ease: editorialEasing.imageSettle,
                }}
                viewport={{ once: true, margin: '-100px' }}
                className="group relative flex items-center justify-center p-8 md:p-12 bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10"
              >
                <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
                  {brand.clientLogo ? (
                    <Image
                      src={brand.clientLogo}
                      alt={brand.clientName || 'Brand'}
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  ) : (
                    <p className="text-white/40 text-sm">No image</p>
                  )}
                </div>
                
                {/* Hover overlay with name */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white font-heading font-semibold text-center px-4">
                    {brand.clientName || 'Brand'}
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
