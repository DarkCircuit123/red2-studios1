import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AboutSection() {
  const [aboutImage, setAboutImage] = useState('https://static.wixstatic.com/media/e9d727_b2c52e273a12463198e51100c1907f31~mv2.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadAboutImage = async () => {
      try {
        // Load from HomepageImages collection first
        const homepageImages = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
        if (homepageImages.items && homepageImages.items.length > 0) {
          const images = homepageImages.items[0] as any;
          if (images.aboutSectionImage) {
            setAboutImage(images.aboutSectionImage);
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

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6 },
    }),
  };

  return (
    <section id="about" className="relative w-full py-16 md:py-24 lg:py-32 bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 100% 0%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(73, 7, 8, 0.08) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
        />
      </div>
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        {/* Asymmetrical layout - image right, text left */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* Content - left side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white leading-tight tracking-tighter">
                About
                <br />
                <motion.span
                  className="text-primary"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Jordan
                </motion.span>
              </h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-primary to-primary/40"
              />
            </div>

            <div className="space-y-4 md:space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-base md:text-lg text-white/75 leading-relaxed font-paragraph"
              >
                Jordan Michael Zuniga is a visionary photographer specializing in capturing the essence of visual storytelling through bold imagery and refined aesthetics. With a passion for precision and luxury restraint, Jordan has developed a distinctive visual language that merges minimalist composition with powerful narrative.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed"
              >
                His work spans editorial, commercial, and campaign photography, collaborating with emerging and established designers. Each frame is meticulously crafted to elevate brands and create lasting impressions through thoughtful composition and technical excellence.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed"
              >
                Specializing in fashion and lifestyle photography, Jordan brings a unique perspective that combines technical mastery with creative vision. Every project is an opportunity to push creative boundaries and deliver something truly exceptional.
              </motion.p>
            </div>

            {/* Stats - enhanced with animations */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-primary/30"
            >
              {[
                { value: '500+', label: 'Projects' },
                { value: '50+', label: 'Collaborations' },
                { value: '25+', label: 'Years' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={statVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="space-y-3 group"
                >
                  <motion.p
                    className="text-5xl md:text-6xl font-heading font-black text-primary"
                    animate={{ opacity: [1, 0.8, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs md:text-sm font-mono text-white/50 uppercase tracking-widest group-hover:text-primary transition-colors">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image - right side with enhanced effects */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-full"
          >
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="aspect-square overflow-hidden bg-white/5 rounded-2xl border-2 border-primary/50 hover:border-primary transition-all duration-500 group"
            >
              {!isLoading && (
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="w-full h-full"
                >
                  <Image
                    src={aboutImage}
                    alt="Jordan Michael Zuniga"
                    width={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              )}
              {isLoading && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-full h-full bg-gradient-to-br from-primary/10 to-white/5"
                />
              )}
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-8 -right-8 w-32 h-32 border border-primary/20 rounded-full opacity-50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-12 -left-12 w-40 h-40 border border-primary/10 rounded-full opacity-30"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
