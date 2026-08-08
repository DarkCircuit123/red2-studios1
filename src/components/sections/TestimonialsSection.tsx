import { motion } from 'framer-motion';
import { editorialTiming, editorialEasing, editorialDistance } from '@/lib/editorial-motion-system';

export default function TestimonialsSection() {
  const testimonials = [
    { text: 'Amazing work and attention to detail.', author: 'Client A' },
    { text: 'Exceeded all expectations.', author: 'Client B' },
    { text: 'Highly recommended!', author: 'Client C' },
  ];

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
          <h2 className="text-4xl md:text-6xl font-heading font-bold">Testimonials</h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
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
              className="bg-gray-900 p-8 rounded-lg"
            >
              {/* Quote Text - Arrives First */}
              <motion.p
                initial={{ opacity: 0, y: editorialDistance.headingOffset.small }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: editorialTiming.headingDuration / 1000,
                  delay: (editorialTiming.imageEnter + editorialTiming.headingDelay + index * editorialTiming.hoverDuration) / 1000,
                  ease: editorialEasing.typographySettle,
                }}
                viewport={{ once: true, margin: '-100px' }}
                className="text-lg mb-4 italic"
              >
                "{testimonial.text}"
              </motion.p>

              {/* Author - Arrives Last */}
              <motion.p
                initial={{ opacity: 0, y: editorialDistance.detailsOffset.small }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: editorialTiming.detailsDuration / 1000,
                  delay: (editorialTiming.imageEnter + editorialTiming.headingDelay + editorialTiming.headingDuration + editorialTiming.detailsDelay + index * editorialTiming.hoverDuration) / 1000,
                  ease: editorialEasing.detailsSettle,
                }}
                viewport={{ once: true, margin: '-100px' }}
                className="font-semibold"
              >
                — {testimonial.author}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
