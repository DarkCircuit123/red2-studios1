import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import BehindTheScenesSection from '@/components/sections/BehindTheScenesSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import SEOHead from '@/components/SEOHead';

// Fallback component for sections
function SectionFallback() {
  return <div className="w-full h-screen bg-black animate-pulse" />;
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="snap-start snap-always"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
      }}
    >
      {children}
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <SEOHead
        title="RED2 Studios | Fashion & Editorial Photographer, Los Angeles"
        description="Jordan Michael Zuniga - 25 years, 500+ projects. Fashion, editorial and campaign photography. Fully mobile across the US. Book a session."
      />
      <main
        className="min-h-screen bg-black text-white overflow-x-hidden"
        style={{
          scrollBehavior: 'smooth',
          scrollSnapType: 'y mandatory',
        }}
      >
        <Header />

      <Suspense fallback={<SectionFallback />}>
        <Section><HeroSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><AboutSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><RubberBandCarouselSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><BehindTheScenesSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><SponsorsSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><ContactSection /></Section>
      </Suspense>

      <Footer />
      </main>
    </>
  );
}
