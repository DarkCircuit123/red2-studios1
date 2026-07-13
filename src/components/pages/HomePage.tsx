import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import { initializeSecuritySystems, setupSecurityEventListeners } from '@/lib/security-initialization';
import {
  preloadCriticalResources,
  monitorCoreWebVitals,
  deferNonCriticalJS,
} from '@/lib/performance-enhancements';

export default function HomePage() {
  // Initialize security systems on component mount
  useEffect(() => {
    initializeSecuritySystems();
    setupSecurityEventListeners();
  }, []);

  // Initialize performance optimizations
  useEffect(() => {
    // Preload critical resources immediately
    preloadCriticalResources();

    // Monitor Core Web Vitals
    monitorCoreWebVitals((metric) => {
      if (metric.rating === 'poor' && process.env.NODE_ENV === 'development') {
        console.warn(`[Performance] ${metric.name}: ${metric.value}ms - ${metric.rating}`);
      }
    });

    // Defer non-critical initialization
    deferNonCriticalJS(() => {
      // Non-critical tasks here
    });
  }, []);

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Rubber Band Carousel */}
        <RubberBandCarouselSection />

        {/* Sponsored By */}
        <SponsorsSection />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}
