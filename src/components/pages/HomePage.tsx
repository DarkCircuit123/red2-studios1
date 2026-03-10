import React from 'react';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import Interactive3DGallerySection from '@/components/sections/Interactive3DGallerySection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import RSSTickerSection from '@/components/sections/RSSTickerSection';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useSEO } from '@/hooks/useSEO';

function HomePage() {
  useSEO('home');

  const { ref: galleryRef, isVisible: galleryVisible } = useIntersectionObserver(() => {}, { threshold: 0.1 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scrollTo = params.get('scroll');
      if (scrollTo) {
        const scrollToElement = () => {
          const element = document.querySelector(`#${scrollTo}`);
          if (element) {
            const headerHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
            window.scrollTo({
              top: elementPosition,
              behavior: 'smooth'
            });
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        const timeouts = [
          setTimeout(scrollToElement, 50),
          setTimeout(scrollToElement, 150),
          setTimeout(scrollToElement, 400)
        ];

        return () => timeouts.forEach(t => clearTimeout(t));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <HeroSection />

      <AboutSection />

      <div ref={galleryRef as any}>
        {galleryVisible && (
          <React.Suspense fallback={<div className="py-20 text-center text-white/60">Loading gallery…</div>}>
            <Interactive3DGallerySection />
          </React.Suspense>
        )}
      </div>

      <RSSTickerSection />

      <SponsorsSection />

      <ContactSection />

      <Footer />
    </div>
  );
}

export default React.memo(HomePage);
