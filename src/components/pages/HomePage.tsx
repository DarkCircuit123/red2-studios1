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
import { generateOrganizationSchema, generateLocalBusinessSchema, generatePersonSchema } from '@/lib/seo-schema-generator';

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
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateOrganizationSchema(),
      generateLocalBusinessSchema(),
      generatePersonSchema(),
    ],
  };

  return (
    <>
      <SEOHead
        title="Professional Fashion & Editorial Photographer | RED² Studios | Los Angeles"
        description="Jordan Michael Zuniga - 25 years of experience, 500+ completed projects. Fashion, editorial, and campaign photography. Fully mobile across the US. Book your session today."
        image="https://static.wixstatic.com/media/e9d727_d729601d70114b37ba248852e3a27734~mv2.png?originWidth=1152&originHeight=768"
        canonical="https://red2studios.com"
        schema={schema}
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
