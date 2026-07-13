import { Suspense, lazy } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Lazy-loaded sections
const AboutSection = lazy(() => import('@/components/sections/AboutSection'));
const RubberBandCarouselSection = lazy(() => import('@/components/sections/RubberBandCarouselSection'));
const BrandsSection = lazy(() => import('@/components/sections/BrandsSection'));
const ContactSection = lazy(() => import('@/components/sections/ContactSection'));
const LiveTickerSection = lazy(() => import('@/components/sections/LiveTickerSection'));

// Section-specific fallback components with proper heights
function AboutSectionFallback() {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        <div className="h-96 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function CarouselSectionFallback() {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-black">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        <div className="h-80 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function BrandsSectionFallback() {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        <div className="h-64 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function ContactSectionFallback() {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        <div className="h-96 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function TickerSectionFallback() {
  return (
    <section className="w-full py-4 md:py-6 bg-black border-t border-white/10">
      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8">
        <div className="h-12 bg-gradient-to-r from-black via-white/5 to-black animate-pulse rounded" />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main aria-label="Homepage">
        {/* Hero Section - Not lazy loaded for LCP optimization */}
        <HeroSection />

        {/* Live Ticker Section */}
        <SectionErrorBoundary sectionName="Live Ticker">
          <Suspense fallback={<TickerSectionFallback />}>
            <LiveTickerSection />
          </Suspense>
        </SectionErrorBoundary>

        {/* About / Vision Section */}
        <SectionErrorBoundary sectionName="About">
          <Suspense fallback={<AboutSectionFallback />}>
            <AboutSection />
          </Suspense>
        </SectionErrorBoundary>

        {/* Rubber Band Carousel Section */}
        <SectionErrorBoundary sectionName="Carousel">
          <Suspense fallback={<CarouselSectionFallback />}>
            <RubberBandCarouselSection />
          </Suspense>
        </SectionErrorBoundary>

        {/* Brands Section (formerly Sponsors) */}
        <SectionErrorBoundary sectionName="Brands">
          <Suspense fallback={<BrandsSectionFallback />}>
            <BrandsSection />
          </Suspense>
        </SectionErrorBoundary>

        {/* Contact / Booking Section */}
        <SectionErrorBoundary sectionName="Contact">
          <Suspense fallback={<ContactSectionFallback />}>
            <ContactSection />
          </Suspense>
        </SectionErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}
