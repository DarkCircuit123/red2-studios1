import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function AboutSection() {
  return (
    <section id="about" className="relative w-full py-24 md:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Asymmetrical layout - image right, text left */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Content - left side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-12 tracking-tighter leading-tight">
              About the Vision
            </h2>

            <div className="space-y-8 mb-12">
              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                With over a decade of experience in high-end fashion photography, I've developed a distinctive visual language that merges minimalist aesthetics with bold storytelling. Each frame is meticulously crafted to capture not just the garment, but the emotion and narrative behind it.
              </p>

              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                My work has been featured in leading fashion publications and collaborated with emerging and established designers. I believe in the power of photography to elevate brands and create lasting impressions through thoughtful composition and refined execution.
              </p>

              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                Specializing in editorial, commercial, and campaign work, I bring a unique perspective that combines technical excellence with creative vision. Every project is an opportunity to push boundaries and create something truly exceptional.
              </p>
            </div>

            {/* Stats - ultra-minimal */}
            <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/10">
              <div>
                <p className="text-4xl font-heading font-bold text-white mb-3">
                  500+
                </p>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Projects
                </p>
              </div>
              <div>
                <p className="text-4xl font-heading font-bold text-white mb-3">
                  50+
                </p>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Collaborations
                </p>
              </div>
              <div>
                <p className="text-4xl font-heading font-bold text-white mb-3">
                  12+
                </p>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Years
                </p>
              </div>
            </div>
          </motion.div>

          {/* Image - right side, full-bleed aesthetic */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-full"
          >
            <div className="aspect-square overflow-hidden bg-white/5">
              <Image
                src="https://static.wixstatic.com/media/e9d727_3d1e8562aca844209e2b06c4382a0d69~mv2.png?originWidth=576&originHeight=576"
                alt="Photographer portrait"
                className="w-full h-full object-cover"
              />
              {/* Subtle grain overlay */}
              <div className="absolute inset-0 bg-grain opacity-5" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
