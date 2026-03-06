import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import PortfolioGrid from '@/components/sections/PortfolioGrid';
import Interactive3DGallerySection from '@/components/sections/Interactive3DGallerySection';
import BlogSection from '@/components/sections/BlogSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import SplashScreen from '@/components/SplashScreen';

export default function HomePage() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen on first visit in this session
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('splashScreenShown');
      return !splashShown;
    }
    return true;
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const portfolioData = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
        setPortfolioItems(portfolioData.items || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('splashScreenShown', 'true');
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Portfolio Grid */}
        <PortfolioGrid items={portfolioItems} isLoading={isLoading} />

        {/* Interactive 3D Gallery */}
        <Interactive3DGallerySection />

        {/* Blog / Stories */}
        <BlogSection />

        {/* Sponsored By */}
        <SponsorsSection />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}
