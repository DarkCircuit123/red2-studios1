import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactSection from '@/components/sections/ContactSection';
import SEOHeadAdvanced from '@/components/SEOHeadAdvanced';
import { CONTACT_PAGE_SEO } from '@/lib/seo-page-configs';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHeadAdvanced
        title={CONTACT_PAGE_SEO.title}
        description={CONTACT_PAGE_SEO.description}
        keywords={CONTACT_PAGE_SEO.keywords}
        canonical={CONTACT_PAGE_SEO.canonical}
        ogType={CONTACT_PAGE_SEO.ogType}
        twitterCard={CONTACT_PAGE_SEO.twitterCard}
        author={CONTACT_PAGE_SEO.author}
        breadcrumbs={CONTACT_PAGE_SEO.breadcrumbs}
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            {
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
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: CONTACT_PAGE_SEO.breadcrumbs?.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: crumb.url,
              })) || [],
            },
          ],
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
