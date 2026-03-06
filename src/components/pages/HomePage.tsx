import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio, ClientsPress } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import GallerySection from '@/components/sections/GallerySection';
import AboutSection from '@/components/sections/AboutSection';
import PortfolioGrid from '@/components/sections/PortfolioGrid';
import BlogSection from '@/components/sections/BlogSection';
import ClientsSection from '@/components/sections/ClientsSection';
import ContactSection from '@/components/sections/ContactSection';
import SplashScreen from '@/components/SplashScreen';

export default function HomePage() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portfolioData, clientsData] = await Promise.all([
          BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 }),
          BaseCrudService.getAll<any>('clientspress', {}, { limit: 50 }),
        ]);
        setPortfolioItems(portfolioData.items || []);
        setClients(clientsData.items || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="min-h-screen bg-white text-black">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Portfolio Grid */}
        <PortfolioGrid items={portfolioItems} isLoading={isLoading} />

        {/* Blog / Stories */}
        <BlogSection />

        {/* Clients & Press */}
        <ClientsSection clients={clients} isLoading={isLoading} />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}
