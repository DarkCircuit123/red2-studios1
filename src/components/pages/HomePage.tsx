import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import Interactive3DGallerySection from '@/components/sections/Interactive3DGallerySection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import RSSTickerSection from '@/components/sections/RSSTickerSection';
import SplashScreen from '@/components/SplashScreen';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen on first visit in this session
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('splashScreenShown');
      return !splashShown;
    }
    return true;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('splashScreenShown', 'true');
    }
  };

  useEffect(() => {
    // Handle scroll parameter from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scrollTo = params.get('scroll');
      if (scrollTo) {
        // Wait for DOM to be ready and scroll with multiple attempts
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
        
        // Try multiple times to handle dynamic content loading
        setTimeout(scrollToElement, 50);
        setTimeout(scrollToElement, 150);
        setTimeout(scrollToElement, 400);
      }
    }
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Interactive 3D Gallery */}
        <Interactive3DGallerySection />

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
