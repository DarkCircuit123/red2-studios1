import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants, getStaggeredVariant } from '@/lib/scroll-animation-variants';

export default function BehindTheScenesSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true });

  return (
    <section ref={sectionRef} className="w-full min-h-screen bg-black text-white py-20 px-4 md:px-8">
      <div className="max-w-[100rem] mx-auto">
        <motion.div
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={scrollAnimationVariants.headingSlideUp}
        >
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-12">Behind The Scenes</h2>
          <motion.div
            initial="hidden"
            animate={sectionVisible ? "visible" : "hidden"}
            variants={scrollAnimationVariants.containerStagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map((item, i) => (
              <motion.div
                key={item}
                variants={getStaggeredVariant(i, 0.15, 0.12)}
                className="bg-gray-900 rounded-lg overflow-hidden aspect-square"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
