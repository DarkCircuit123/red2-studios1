import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface ClientsSectionProps {
  clients: any[];
  isLoading: boolean;
}

export default function ClientsSection({ clients, isLoading }: ClientsSectionProps) {
  // Use actual clients or create placeholder items
  const displayClients = clients.length > 0 ? clients : Array(8).fill(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="clients" className="relative w-full py-20 md:py-32 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-[100rem] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground dark:text-white mb-4">
            Featured In
          </h2>
          <p className="text-lg font-paragraph text-foreground/60 dark:text-gray-400 max-w-2xl mx-auto">
            Trusted by leading brands and publications worldwide
          </p>
        </motion.div>

        {/* Clients Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {displayClients.map((client, index) => (
            <motion.div
              key={client?._id || index}
              variants={itemVariants}
              className="group relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center p-6 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-300"
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
                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg mx-auto mb-2" />
                    <p className="text-xs font-paragraph text-foreground/40 dark:text-gray-500">
                      {client?.clientName || 'Brand Logo'}
                    </p>
                  </div>
                </div>
              )}

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
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-foreground/10 dark:border-gray-700"
        >
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
              50+
            </p>
            <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
              Global Brands
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
              100+
            </p>
            <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
              Publications Featured
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
              15+
            </p>
            <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
              Countries
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
