import { motion } from 'framer-motion';

export default function FeaturedWorkSection() {
  return (
    <section className="w-full min-h-screen bg-black text-white py-20 px-4 md:px-8">
      <div className="max-w-[100rem] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-12">Featured Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video" />
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
