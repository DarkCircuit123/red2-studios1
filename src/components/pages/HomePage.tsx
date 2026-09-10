import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import RubberBandCarouselSection from '@/components/sections/RubberBandCarouselSection';
import BehindTheScenesSection from '@/components/sections/BehindTheScenesSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import SEOHeadAdvanced from '@/components/SEOHeadAdvanced';
import { generateOrganizationSchema, generateLocalBusinessSchema, generatePersonSchema } from '@/lib/seo-schema-generator';
import { HOME_PAGE_SEO } from '@/lib/seo-page-configs';

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
      <SEOHeadAdvanced
        title={HOME_PAGE_SEO.title}
        description={HOME_PAGE_SEO.description}
        keywords={HOME_PAGE_SEO.keywords}
        image="https://static.wixstatic.com/media/e9d727_d729601d70114b37ba248852e3a27734~mv2.png?originWidth=1152&originHeight=768"
        canonical={HOME_PAGE_SEO.canonical}
        ogType={HOME_PAGE_SEO.ogType}
        twitterCard={HOME_PAGE_SEO.twitterCard}
        author={HOME_PAGE_SEO.author}
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
