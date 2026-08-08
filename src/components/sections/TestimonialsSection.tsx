import { motion } from 'framer-motion';

export default function TestimonialsSection() {
  const testimonials = [
    { text: 'Amazing work and attention to detail.', author: 'Client A' },
    { text: 'Exceeded all expectations.', author: 'Client B' },
    { text: 'Highly recommended!', author: 'Client C' },
  ];

  return (
    <section className="w-full min-h-screen bg-black text-white py-20 px-4 md:px-8">
      <div className="max-w-[100rem] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-12">Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900 p-8 rounded-lg"
              >
                <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold">— {testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
