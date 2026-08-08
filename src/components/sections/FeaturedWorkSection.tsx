import { motion } from 'framer-motion';
import { editorialTiming, editorialEasing, editorialDistance } from '@/lib/editorial-motion-system';

export default function FeaturedWorkSection() {
  return (
    <section className="w-full min-h-screen bg-black text-white py-20 px-4 md:px-8">
      <div className="max-w-[100rem] mx-auto">
        {/* Section Header - Editorial Motion */}
        <motion.div
          initial={{ opacity: 0, y: editorialDistance.headingOffset.large }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: editorialTiming.headingDuration / 1000,
            ease: editorialEasing.typographySettle,
          }}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-heading font-bold">Featured Work</h2>
        </motion.div>

        {/* Featured Work Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[0, 1].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: editorialDistance.imageOffset.medium }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: editorialTiming.imageEnter / 1000,
                delay: (index * editorialTiming.hoverDuration) / 1000,
                ease: editorialEasing.imageSettle,
              }}
              viewport={{ once: true, margin: '-100px' }}
              className="bg-gray-900 rounded-lg overflow-hidden aspect-video"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
