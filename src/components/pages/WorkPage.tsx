import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  HeroCampaignViewer,
  EditorialLayout,
  ImmersiveViewer,
} from '@/components/CinematicGallery';

export default function WorkPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);;
  const [isLoading, setIsLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
        setProjects(data.items || []);
      } catch (error) {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Prepare hero images (first 5 projects)
  const heroImages = projects.slice(0, 5).map((p) => p.mainImage || '').filter(Boolean);
  const heroTitles = projects.slice(0, 5).map((p) => p.projectName || '');

  // Prepare editorial items (all projects)
  const editorialItems = projects.map((p) => ({
    id: p._id,
    image: p.mainImage || '',
    title: p.projectName,
  }));

  // Prepare all images for viewer (flatten all gallery images)
  const allViewerImages = projects
    .flatMap((p) => [p.mainImage, p.galleryImage1, p.galleryImage2, p.galleryImage3])
    .filter(Boolean) as string[];

  const allViewerTitles = projects
    .flatMap((p) => [p.projectName, p.projectName, p.projectName, p.projectName])
    .slice(0, allViewerImages.length);

  const handleHeroImageClick = (index: number) => {
    // Find the index in the full viewer array
    const startImage = projects[index]?.mainImage;
    const viewerIndex = allViewerImages.indexOf(startImage || '');
    setViewerStartIndex(Math.max(0, viewerIndex));
    setViewerOpen(true);
  };

  const handleEditorialImageClick = (index: number) => {
    setViewerStartIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="w-full">
        {/* Hero Campaign Viewer */}
        {!isLoading && heroImages.length > 0 && (
          <HeroCampaignViewer
            images={heroImages}
            titles={heroTitles}
            onImageClick={handleHeroImageClick}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="w-full h-screen bg-black flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/50 text-sm tracking-widest uppercase"
            >
              Loading gallery...
            </motion.div>
          </div>
        )}

        {/* Editorial Layout Section */}
        {!isLoading && editorialItems.length > 0 && (
          <section className="relative w-full bg-black">
            {/* Section Divider */}
            <div className="h-24 md:h-32 flex items-center justify-center">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1 }}
                className="h-px w-32 bg-gradient-to-r from-transparent via-red-900/50 to-transparent"
              />
            </div>

            {/* Editorial Grid */}
            <EditorialLayout
              items={editorialItems}
              onImageClick={handleEditorialImageClick}
            />
          </section>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-screen flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50 mb-8">
                No projects available yet
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Immersive Viewer */}
      <ImmersiveViewer
        images={allViewerImages}
        titles={allViewerTitles}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialIndex={viewerStartIndex}
      />

      <Footer />
    </div>
  );
}
