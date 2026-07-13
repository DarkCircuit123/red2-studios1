import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import LiveTickerSection from '@/components/sections/LiveTickerSection';

// Fallback component for sections
function SectionFallback() {
  return <div className="w-full h-96 bg-black animate-pulse" />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Section */}
      <Suspense fallback={<SectionFallback />}>
        <HeroSection />
      </Suspense>

      {/* Live Ticker Section */}
      <Suspense fallback={null}>
        <LiveTickerSection />
      </Suspense>

      {/* About / Vision */}
      <Suspense fallback={<SectionFallback />}>
        <AboutSection />
      </Suspense>

      {/* Rubber Band Carousel */}
      <Suspense fallback={<SectionFallback />}>
        <RubberBandCarouselSection />
      </Suspense>

      {/* Sponsored By */}
      <Suspense fallback={<SectionFallback />}>
        <SponsorsSection />
      </Suspense>

      {/* Contact / Booking */}
      <Suspense fallback={<SectionFallback />}>
        <ContactSection />
      </Suspense>

      <Footer />
    </div>
  );
}
