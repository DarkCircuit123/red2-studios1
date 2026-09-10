import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactSection from '@/components/sections/ContactSection';
import SEOHead from '@/components/SEOHead';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="Contact RED² Studios | Get in Touch with Our Photographer"
        description="Contact us for photography inquiries, bookings, or collaborations. Professional fashion and editorial photography services available. Fully mobile across the US."
        canonical="https://red2studios.com/contact"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact RED² Studios',
          description: 'Contact page for photography inquiries and bookings',
          mainEntity: {
            '@type': 'Organization',
            name: 'RED² Studios',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'contact@red2studios.com',
              availableLanguage: 'en',
            },
          },
        }}
      />
      <Header />
      <div className="pt-24">
        <ContactSection />
      </div>
      <Footer />
    </div>
  );
}
