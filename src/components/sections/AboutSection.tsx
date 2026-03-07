import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect } from 'react';

export default function AboutSection() {
  const [aboutImage, setAboutImage] = useState('https://static.wixstatic.com/media/e9d727_91ed15e69fe34eac9f33620e3c2ee65d~mv2.png?originWidth=576&originHeight=576');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAboutImage = async () => {
      try {
        setIsLoading(true);
        const watermarkSettings = await BaseCrudService.getAll('watermarksettings', {}, { limit: 1 });
        if (watermarkSettings.items && watermarkSettings.items.length > 0) {
          const settings = watermarkSettings.items[0] as any;
          if (settings.watermarkImage) {
            setAboutImage(settings.watermarkImage);
          }
        }
      } catch (error) {
        console.error('Error loading about image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAboutImage();
  }, []);

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
              About Jordan Michael Zuniga
            </h2>

            <div className="space-y-8 mb-12">
              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                Jordan Michael Zuniga is a visionary photographer specializing in capturing the essence of visual storytelling through bold imagery and refined aesthetics. With a passion for precision and luxury restraint, Jordan has developed a distinctive visual language that merges minimalist composition with powerful narrative.
              </p>

              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                His work spans editorial, commercial, and campaign photography, collaborating with emerging and established designers. Each frame is meticulously crafted to elevate brands and create lasting impressions through thoughtful composition and technical excellence.
              </p>

              <p className="text-base font-paragraph text-white/70 leading-relaxed">
                Specializing in fashion and lifestyle photography, Jordan brings a unique perspective that combines technical mastery with creative vision. Every project is an opportunity to push creative boundaries and deliver something truly exceptional.
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
              {!isLoading && (
                <>
                  <Image
                    src={aboutImage}
                    alt="Jordan Michael Zuniga"
                    width={600}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle grain overlay */}
                  <div className="absolute inset-0 bg-grain opacity-5" />
                </>
              )}
              {isLoading && (
                <div className="w-full h-full bg-white/10 animate-pulse" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
