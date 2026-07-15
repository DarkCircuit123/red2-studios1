import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactSection from '@/components/sections/ContactSection';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="pt-24">
        <ContactSection />
      </div>
      <Footer />
    </div>
  );
}
