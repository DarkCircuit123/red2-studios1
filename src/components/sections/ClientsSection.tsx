import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { editorialTiming, editorialEasing, editorialDistance } from '@/lib/editorial-motion-system';

interface ClientsSectionProps {
  clients: any[];
  isLoading: boolean;
}

export default function ClientsSection({ clients, isLoading }: ClientsSectionProps) {
  // Use actual clients or create placeholder items
  const displayClients = clients.length > 0 ? clients : Array(8).fill(null);

  return (
    <section id="clients" className="relative w-full py-24 md:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header - Editorial Motion */}
        <motion.div
          initial={{ opacity: 0, y: editorialDistance.headingOffset.large }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: editorialTiming.headingDuration / 1000,
            ease: editorialEasing.typographySettle,
          }}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-20"
        >
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Featured In
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
            className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed"
          >
            Trusted by leading brands and publications worldwide. A testament to precision and creative excellence.
          </motion.p>
        </motion.div>

        {/* Clients Grid - Minimal aesthetic */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {displayClients.map((client, index) => (
            <motion.div
              key={client?._id || index}
              initial={{ opacity: 0, y: editorialDistance.imageOffset.medium }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: editorialTiming.imageEnter / 1000,
                delay: (index * editorialTiming.hoverDuration) / 1000,
                ease: editorialEasing.imageSettle,
              }}
              viewport={{ once: true, margin: '-100px' }}
              className="group relative aspect-square overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-6 hover:border-white/30 transition-all duration-300"
            >
              {client?.clientLogo ? (
                <Image
                  src={client.clientLogo}
                  alt={client.clientName || 'Client logo'}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/10 rounded mx-auto mb-3" />
                    <p className="text-xs font-mono text-white/30">
                      {client?.clientName || 'Brand'}
                    </p>
                  </div>
                </div>
              )}

              {/* Subtle grain overlay */}
              <div className="absolute inset-0 bg-grain opacity-5" />

              {/* Hover Info */}
              {client?.highlightDescription && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center p-4"
                >
                  <p className="text-sm font-paragraph text-white text-center">
                    {client.highlightDescription}
                  </p>
                </motion.div>
              )}

              {/* Link */}
              {client?.externalLink && (
                <a
                  href={client.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                  aria-label={`Visit ${client.clientName}`}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Stats - Ultra-minimal */}
        <motion.div
          initial={{ opacity: 0, y: editorialDistance.detailsOffset.medium }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: editorialTiming.detailsDuration / 1000,
            delay: (editorialTiming.imageEnter + editorialTiming.headingDelay + editorialTiming.headingDuration + editorialTiming.detailsDelay) / 1000,
            ease: editorialEasing.detailsSettle,
          }}
          viewport={{ once: true, margin: '-100px' }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-white/10"
        >
          <div>
            <p className="text-4xl font-heading font-bold text-white mb-3">
              50+
            </p>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Global Brands
            </p>
          </div>
          <div>
            <p className="text-4xl font-heading font-bold text-white mb-3">
              100+
            </p>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Publications Featured
            </p>
          </div>
          <div>
            <p className="text-4xl font-heading font-bold text-white mb-3">
              15+
            </p>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Countries
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
