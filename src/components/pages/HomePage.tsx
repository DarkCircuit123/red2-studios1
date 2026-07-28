import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import FeaturedWorkSection from '@/components/sections/FeaturedWorkSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import BehindTheScenesSection from '@/components/sections/BehindTheScenesSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import InstagramSection from '@/components/sections/InstagramSection';
import ContactSection from '@/components/sections/ContactSection';

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
        <Section><FeaturedWorkSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><RubberBandCarouselSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><BehindTheScenesSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><TestimonialsSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><SponsorsSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><InstagramSection /></Section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Section><ContactSection /></Section>
      </Suspense>

      <Footer />
    </main>
  );
}
