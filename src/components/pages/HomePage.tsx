import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import BehindTheScenesSection from '@/components/sections/BehindTheScenesSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import SEOHead from '@/components/SEOHead';

function SectionFallback() {
  return <div className="w-full h-screen bg-black animate-pulse" aria-hidden="true" />;
}

class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[HOME] Failed to render ${this.props.name}`, error);
  }

  render() {
    if (this.state.hasError) {
      // A broken optional section must not take down the entire homepage.
      return <div className="w-full min-h-[1px] bg-black" aria-hidden="true" />;
    }
    return this.props.children;
  }
}

function Section({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <section
      className="snap-start snap-always"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
      }}
    >
      <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>
    </section>
  );
}

function ShellBoundary({ children, name }: { children: React.ReactNode; name: string }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
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
        <ShellBoundary name="Header"><Header /></ShellBoundary>

        <Suspense fallback={<SectionFallback />}>
          <Section name="HeroSection"><HeroSection /></Section>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Section name="AboutSection"><AboutSection /></Section>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Section name="RubberBandCarouselSection"><RubberBandCarouselSection /></Section>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Section name="BehindTheScenesSection"><BehindTheScenesSection /></Section>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Section name="SponsorsSection"><SponsorsSection /></Section>
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <Section name="ContactSection"><ContactSection /></Section>
        </Suspense>

        <ShellBoundary name="Footer"><Footer /></ShellBoundary>
      </main>
    </>
  );
}
