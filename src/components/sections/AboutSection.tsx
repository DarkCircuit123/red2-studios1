import { Image } from '@/components/ui/image';
import { AboutSection as AboutSectionType } from '@/entities/index';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import FashionTicker from '@/components/FashionTicker';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants, getStaggeredVariant } from '@/lib/scroll-animation-variants';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function AboutSection() {
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const [aboutText, setAboutText] = useState('Jordan Michael Zuñiga He does not shoot what you look like. He shoots what you actually are. Born into it. Father behind a lens for 40 years. Mother with paint on her hands. Los Angeles in his blood. Amsterdam sharpened what LA started. He came back different and never stopped moving. Miami made him known. Wynwood before it was cool. Runway. Editorial. Three years of Fashion Week for fashiontv reaching 100 million viewers worldwide. Elite Model Management. Ford. Next. Irene Marie. Stefano Versace Holdings. Warner Brothers. He was not knocking on doors. He was already inside. 2011 he shot Women in Cages for PETA. It went everywhere. HuffPost. People. Getty. The opening was packed. Hulk Hogan showed up, saw the work on the walls, and put Jordan in a choke hold. That is what happens when an image lands that hard. Same year. Art Basel. Haiti: Hope in Progress. 500 collectors and diplomats through the door. World Bank. American Red Cross. The photographs funded lives rebuilt. Started on Pentax film. Shoots Sony A1 II now. The camera changed. The eye did not. RED2 Studios has no address. It is a standard of work that travels. Fully mobile across the United States, shooting hotel suites, private estates, city streets and locations that cannot be planned in advance. He is already where the shot needs to happen. Right now he is looking for new faces. Not models who have a look. Models who have something underneath it. Presence. Realness. The thing the camera either finds or it does not. Twenty-five years in. 500 projects. Still hunting for the next frame that stops people cold. If that sounds like a shoot you want to be part of, it probably is.');
  const [fontFamily, setFontFamily] = useState('font-cormorant-garamond-v2');
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true });

  const loadAboutData = async () => {
    try {
      // Load about section image from HomepageImages collection (aboutSectionImage field only)
      const imageResponse = await fetch('/api/cms/get-homepageimages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        console.log('[AboutSection] Image API response:', imageResult);
        if (imageResult?.items && imageResult.items.length > 0) {
          const images = imageResult.items[0] as any;
          console.log('[AboutSection] First image item:', images);
          console.log('[AboutSection] aboutSectionImage value:', images?.aboutSectionImage);
          // Only set aboutImage if it exists and is a valid string
          if (images?.aboutSectionImage && typeof images.aboutSectionImage === 'string' && images.aboutSectionImage.trim()) {
            console.log('[AboutSection] Setting aboutImage to:', images.aboutSectionImage);
            setAboutImage(images.aboutSectionImage);
          } else {
            console.warn('[AboutSection] aboutSectionImage is empty or invalid');
          }
        } else {
          console.warn('[AboutSection] No items returned from image API');
        }
      } else {
        console.error('[AboutSection] Image API returned non-ok status:', imageResponse.status);
      }

      // Load about text and settings from About collection using API endpoint
      try {
        const aboutResponse = await fetch('/api/cms/get-about-data', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (aboutResponse.ok) {
          const aboutResult = await aboutResponse.json();
          if (aboutResult?.items && aboutResult.items.length > 0) {
            const about = aboutResult.items[0] as any;
            if (about?.aboutText) {
              setAboutText(about.aboutText);
            }
            if (about?.fontFamily) {
              setFontFamily(about.fontFamily);
            }
          }
        }
      } catch (error) {
        console.error('[AboutSection] Error loading about settings:', error);
      }
    } catch (error) {
      console.error('[AboutSection] Error loading about image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAboutData();
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
    <section ref={sectionRef} id="about" className="relative w-full bg-black overflow-hidden">
      {/* Fashion Ticker */}
      <div className="relative z-20">
        <FashionTicker />
      </div>
      {/* Main content with reduced padding */}
      <div className="py-12 md:py-16 lg:py-20 relative">
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
          {/* Premium magazine layout with floated image */}
          <div className="space-y-4 md:space-y-6">
            {/* Header section */}
            <motion.div
              initial="hidden"
              animate={sectionVisible ? "visible" : "hidden"}
              variants={scrollAnimationVariants.headingSlideUp}
              className="space-y-3 md:space-y-4 reveal"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white leading-tight tracking-tighter">
                About
                <br />
                <motion.span
                  className="text-primary"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >Jordan</motion.span>
              </h2>
              <motion.div
                initial={{ width: 0 }}
                animate={sectionVisible ? { width: 80 } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-1 bg-gradient-to-r from-primary to-primary/40"
              />
            </motion.div>

            {/* Debug: Show if image is missing */}
            {!aboutImage && !isLoading && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                ⚠️ About section image not found in CMS. Please add an image to the HomepageImages collection.
              </div>
            )}

            {/* Editorial float layout with text wrapping */}
            <motion.div
              initial="hidden"
              animate={sectionVisible ? "visible" : "hidden"}
              variants={scrollAnimationVariants.textSlideUp}
              transition={{ delay: 0.2 }}
              className="relative reveal mx-auto max-w-4xl"
            >
              {/* Desktop/tablet floated image */}
              {aboutImage && (
                <figure className="hidden sm:block float-right w-44 md:w-52 lg:w-64 ml-6 md:ml-8 mb-5 flex-shrink-0 [shape-outside:inset(0_round_1rem)] [shape-margin:1rem] m-0">
                  <motion.div
                    initial="hidden"
                    animate={sectionVisible ? "visible" : "hidden"}
                    variants={scrollAnimationVariants.imageSlideInRight}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="aspect-[1320/2346] overflow-hidden bg-white/5 rounded-2xl border-2 border-primary/50 hover:border-primary transition-all duration-500 group flex items-center justify-center relative reveal-wipe"
                  >
                    {!isLoading && (
                      <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={sectionVisible ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <Image
                          src={aboutImage}
                          alt="Jordan Michael Zuniga"
                          width={600}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                </figure>
              )}

              {/* Text content with wrapping */}
              <div className="space-y-5">
                <p className={`text-base md:text-lg text-white/75 leading-relaxed whitespace-pre-wrap ${fontFamily}`}>
                  {aboutText}
                </p>
              </div>

              {/* Mobile image - stacked above text */}
              {aboutImage && (
                <div className="sm:hidden mx-auto w-2/3 mb-6 md:mb-8">
                  <motion.div
                    initial="hidden"
                    animate={sectionVisible ? "visible" : "hidden"}
                    variants={scrollAnimationVariants.imageSlideInLeft}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="aspect-[1320/2346] overflow-hidden bg-white/5 rounded-2xl border-2 border-primary/50 hover:border-primary transition-all duration-500 group flex items-center justify-center relative reveal-wipe"
                  >
                    {!isLoading && (
                      <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={sectionVisible ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <Image
                          src={aboutImage}
                          alt="Jordan Michael Zuniga"
                          width={600}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                </div>
              )}
            </motion.div>

            {/* Stats - below the text flow */}
            <motion.div
              initial="hidden"
              animate={sectionVisible ? "visible" : "hidden"}
              variants={scrollAnimationVariants.containerStagger}
              className="grid grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-primary/30 clear-both"
            >
              {[
                { value: '500+', label: 'Projects' },
                { value: '50+', label: 'Collaborations' },
                { value: '25+', label: 'Years' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={getStaggeredVariant(i, 0.3, 0.1)}
                  className={`space-y-3 group reveal reveal-delay-${i + 1}`}
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
          </div>
        </div>
      </div>
    </section>
  );
}
