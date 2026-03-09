import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
// lazy load 3D gallery since it's heavy
const Interactive3DGallerySection = React.lazy(() => import('@/components/sections/Interactive3DGallerySection'));
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import RSSTickerSection from '@/components/sections/RSSTickerSection';
import SplashScreen from '@/components/SplashScreen';
import { useEffectOnce } from '@/hooks/useAdvancedOptimization';
import { useIntersectionObserver } from '@/hooks/useAdvancedOptimization';
import { initializeSecuritySystems, setupSecurityEventListeners } from '@/lib/security-initialization';
import { useSEO } from '@/hooks/useSEO';

function HomePage() {
  // SEO optimization for homepage
  useSEO('home');

  const { ref: galleryRef, isVisible: galleryVisible } = useIntersectionObserver(() => {}, { threshold: 0.1 });
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen on first visit in this session
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('splashScreenShown');
      return !splashShown;
    }
    return true;
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('splashScreenShown', 'true');
    }
  }, []);

  // Initialize security systems on component mount
  useEffect(() => {
    initializeSecuritySystems();
    setupSecurityEventListeners();
  }, []);

  // Optimized scroll parameter handling with useEffectOnce
  useEffectOnce(() => {
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
            // Clean up URL after successful scroll
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        // Optimized timing for dynamic content loading
        const timeouts = [
          setTimeout(scrollToElement, 50),
          setTimeout(scrollToElement, 150),
          setTimeout(scrollToElement, 400)
        ];

        return () => timeouts.forEach(t => clearTimeout(t));
      }
    }
  });

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Interactive 3D Gallery (lazy load when visible) */}
        <div ref={galleryRef as any}>
          {galleryVisible && (
            <React.Suspense fallback={<div className="py-20 text-center text-white/60">Loading gallery…</div>}>
              <Interactive3DGallerySection />
            </React.Suspense>
          )}
        </div>

        {/* RSS Ticker */}
        <RSSTickerSection />

        {/* Sponsored By */}
        <SponsorsSection />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}

export default React.memo(HomePage);
