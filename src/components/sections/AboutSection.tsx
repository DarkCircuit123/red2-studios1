import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { useState, useEffect, useRef } from 'react';

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

  return (
    <section id="about" className="relative w-full py-24 md:py-32 lg:py-40 bg-black">
      <div className="max-w-[120rem] mx-auto px-6 md:px-8">
        {/* Asymmetrical layout - image right, text left */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 xl:gap-32 items-start">
          {/* Content - left side */}
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight tracking-tight">
                About Jordan Michael Zuniga
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary/40" />
            </div>

            <div className="space-y-8 md:space-y-10">
              <p className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed">
                Jordan Michael Zuniga is a visionary photographer specializing in capturing the essence of visual storytelling through bold imagery and refined aesthetics. With a passion for precision and luxury restraint, Jordan has developed a distinctive visual language that merges minimalist composition with powerful narrative.
              </p>

              <p className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed">
                His work spans editorial, commercial, and campaign photography, collaborating with emerging and established designers. Each frame is meticulously crafted to elevate brands and create lasting impressions through thoughtful composition and technical excellence.
              </p>

              <p className="text-base md:text-lg font-paragraph text-white/75 leading-relaxed">
                Specializing in fashion and lifestyle photography, Jordan brings a unique perspective that combines technical mastery with creative vision. Every project is an opportunity to push creative boundaries and deliver something truly exceptional.
              </p>
            </div>

            {/* Stats - ultra-minimal */}
            <div className="grid grid-cols-3 gap-8 md:gap-12 pt-12 md:pt-16 border-t border-white/10">
              <div className="space-y-3">
                <p className="text-4xl md:text-5xl font-heading font-bold text-white">
                  500+
                </p>
                <p className="text-xs md:text-sm font-mono text-white/50 uppercase tracking-widest">
                  Projects
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-4xl md:text-5xl font-heading font-bold text-white">
                  50+
                </p>
                <p className="text-xs md:text-sm font-mono text-white/50 uppercase tracking-widest">
                  Collaborations
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-4xl md:text-5xl font-heading font-bold text-white">
                  12+
                </p>
                <p className="text-xs md:text-sm font-mono text-white/50 uppercase tracking-widest">
                  Years
                </p>
              </div>
            </div>
          </div>

          {/* Image - right side, full-bleed aesthetic */}
          <div className="relative h-full">
            <div className="aspect-square overflow-hidden bg-white/5 rounded-2xl border border-white/10">
              {!isLoading && (
                <Image
                  src={aboutImage}
                  alt="Jordan Michael Zuniga"
                  width={600}
                  className="w-full h-full object-cover"
                />
              )}
              {isLoading && (
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
