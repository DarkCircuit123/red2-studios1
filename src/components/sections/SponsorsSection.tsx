import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function SponsorsSection() {
  const sponsors = [
    {
      id: '1',
      name: 'BorrisFX',
      logo: 'https://static.wixstatic.com/media/e9d727_d938c5afb26f4253beab928151fb3578~mv2.jpg',
      link: 'https://www.borisfx.com'
    },
    {
      id: '2',
      name: 'Adobe',
      logo: 'https://static.wixstatic.com/media/e9d727_640dbe9d85624b36858be9f9f1b7d40b~mv2.png?originWidth=384&originHeight=256',
      link: 'https://www.adobe.com'
    },
    {
      id: '3',
      name: 'DaVinci Resolve',
      logo: 'https://static.wixstatic.com/media/e9d727_640dbe9d85624b36858be9f9f1b7d40b~mv2.png?originWidth=384&originHeight=256',
      link: 'https://www.davinciresolve.com'
    }
  ];

  return (
    <section className="relative w-full py-20 md:py-28 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 tracking-tight">
            Sponsored By
          </h2>
          <p className="text-sm md:text-base font-paragraph text-white/60 max-w-2xl mx-auto">
            Collaborating with industry-leading partners to deliver exceptional visual experiences
          </p>
        </motion.div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {sponsors.map((sponsor, index) => (
            <motion.a
              key={sponsor.id}
              href={sponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative flex items-center justify-center p-8 md:p-12 bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10"
            >
              <div className="relative w-full h-32 md:h-40 flex items-center justify-center">
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              
              {/* Hover overlay with name */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <p className="text-white font-heading font-semibold text-center px-4">
                  {sponsor.name}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
