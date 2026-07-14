import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactSection from '@/components/sections/ContactSection';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ContactPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RED2 Studios',
    description: 'Professional photography and videography studio based in Los Angeles',
    url: 'https://red2studios.com',
    telephone: '+1 (310) 386-0405',
    email: 'hello@red2studios.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+1 (310) 386-0405',
      email: 'hello@red2studios.com',
      areaServed: 'Worldwide',
      availableLanguage: 'en',
    },
    sameAs: [
      'https://instagram.com',
      'https://linkedin.com',
      'https://twitter.com',
    ],
  };

  return (
    <>
      <Helmet>
        <title>Contact RED2 Studios | Get in Touch</title>
        <meta
          name="description"
          content="Get in touch with RED2 Studios. Contact us for photography, videography, and creative projects. Based in Los Angeles, serving worldwide."
        />
        <meta
          name="keywords"
          content="contact, photography, videography, RED2 Studios, Los Angeles"
        />
        <meta name="author" content="RED2 Studios" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact RED2 Studios | Get in Touch" />
        <meta
          property="og:description"
          content="Get in touch with RED2 Studios. Contact us for photography, videography, and creative projects."
        />
        <meta property="og:url" content="https://red2studios.com/contact" />
        <meta property="og:site_name" content="RED2 Studios" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact RED2 Studios | Get in Touch" />
        <meta
          name="twitter:description"
          content="Get in touch with RED2 Studios for photography, videography, and creative projects."
        />

        {/* Canonical */}
        <link rel="canonical" href="https://red2studios.com/contact" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <Header />
        <main aria-label="Contact RED2 Studios" className="pt-24 pb-8">
          <ErrorBoundary
            fallbackTitle="Contact Form Unavailable"
            fallbackMessage="We're experiencing technical difficulties with our contact form. Please reach out directly using the contact information below."
          >
            <ContactSection />
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </>
  );
}
