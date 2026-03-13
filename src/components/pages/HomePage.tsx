import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import DraggableCarousel from '@/components/DraggableCarousel';
import SponsorsSection from '@/components/sections/SponsorsSection';
import ContactSection from '@/components/sections/ContactSection';
import RSSTickerSection from '@/components/sections/RSSTickerSection';
import { initializeSecuritySystems, setupSecurityEventListeners } from '@/lib/security-initialization';
import {
  preloadCriticalResources,
  monitorCoreWebVitals,
  deferNonCriticalJS,
} from '@/lib/performance-enhancements';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

export default function HomePage() {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Initialize security systems on component mount
  useEffect(() => {
    initializeSecuritySystems();
    setupSecurityEventListeners();
  }, []);

  // Initialize performance optimizations
  useEffect(() => {
    // Preload critical resources immediately
    preloadCriticalResources();

    // Monitor Core Web Vitals
    monitorCoreWebVitals((metric) => {
      if (metric.rating === 'poor') {
        console.warn(`[Performance] ${metric.name}: ${metric.value}ms - ${metric.rating}`);
      }
    });

    // Defer non-critical initialization
    deferNonCriticalJS(() => {
      // Non-critical tasks here
    });
  }, []);

  // Load portfolio items for carousel
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 12 });
        setPortfolioItems(data.items || []);
      } catch (error) {
        // Silently fail
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    loadPortfolio();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Hero Section */}
        <HeroSection />

        {/* About / Vision */}
        <AboutSection />

        {/* Draggable Carousel Gallery */}
        <DraggableCarousel items={portfolioItems} isLoading={isLoadingPortfolio} />

        {/* RSS Ticker */}
        <RSSTickerSection />

        {/* Sponsored By */}
        <SponsorsSection />

        {/* Contact / Booking */}
        <ContactSection />

        <Footer />
      </div>
    </>
  );
}
