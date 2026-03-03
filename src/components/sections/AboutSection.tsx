import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function AboutSection() {
  return (
    <section id="about" className="relative w-full py-20 md:py-32 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-[100rem] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-200 dark:bg-slate-800">
              <Image
                src="https://static.wixstatic.com/media/e9d727_3d1e8562aca844209e2b06c4382a0d69~mv2.png?originWidth=576&originHeight=576"
                alt="Photographer portrait"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Accent element */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-primary/20 dark:border-primary/10 rounded-2xl" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground dark:text-white mb-6">
              About the Vision
            </h2>

            <div className="space-y-6 mb-8">
              <p className="text-lg font-paragraph text-foreground/70 dark:text-gray-300 leading-relaxed">
                With over a decade of experience in high-end fashion photography, I've developed a distinctive visual language that merges minimalist aesthetics with bold storytelling. Each frame is meticulously crafted to capture not just the garment, but the emotion and narrative behind it.
              </p>

              <p className="text-lg font-paragraph text-foreground/70 dark:text-gray-300 leading-relaxed">
                My work has been featured in leading fashion publications and collaborated with emerging and established designers. I believe in the power of photography to elevate brands and create lasting impressions through thoughtful composition and refined execution.
              </p>

              <p className="text-lg font-paragraph text-foreground/70 dark:text-gray-300 leading-relaxed">
                Specializing in editorial, commercial, and campaign work, I bring a unique perspective that combines technical excellence with creative vision. Every project is an opportunity to push boundaries and create something truly exceptional.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-foreground/10 dark:border-gray-700">
              <div>
                <p className="text-3xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
                  500+
                </p>
                <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
                  Projects Completed
                </p>
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
                  50+
                </p>
                <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
                  Brand Collaborations
                </p>
              </div>
              <div>
                <p className="text-3xl font-heading font-bold text-primary dark:text-primary-foreground mb-2">
                  12+
                </p>
                <p className="text-sm font-paragraph text-foreground/60 dark:text-gray-400">
                  Years Experience
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
