import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';

// Fallback component for sections
function SectionFallback() {
  return <div className="w-full h-96 bg-black animate-pulse" />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white scroll-smooth" style={{ scrollBehavior: 'smooth', scrollSnapType: 'y mandatory' }}>
      <Header />

      {/* Hero Section */}
      <Suspense fallback={<SectionFallback />}>
        <div style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <HeroSection />
        </div>
      </Suspense>

      {/* About / Vision */}
      <Suspense fallback={<SectionFallback />}>
        <div style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <AboutSection />
        </div>
      </Suspense>

      {/* Rubber Band Carousel */}
      <Suspense fallback={<SectionFallback />}>
        <div style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <RubberBandCarouselSection />
        </div>
      </Suspense>

      {/* Sponsored By */}
      <Suspense fallback={<SectionFallback />}>
        <div style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <SponsorsSection />
        </div>
      </Suspense>

      {/* Contact / Booking */}
      <Suspense fallback={<SectionFallback />}>
        <div style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <ContactSection />
        </div>
      </Suspense>

      <Footer />
    </div>
  );
}
