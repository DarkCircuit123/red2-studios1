import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioWithImages } from '@/lib/portfolio-service';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

interface PortfolioGroup {
  category: string;
  projects: PortfolioWithImages[];
}

export default function WorkPage() {
  const { portfolios, isLoading } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load image dimensions when selected image changes
  useEffect(() => {
    if (!selectedImage) {
      setImageDimensions(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = selectedImage;
  }, [selectedImage]);

  // Group portfolios by category
  const groupedPortfolios = useMemo(() => {
    const groups: { [key: string]: PortfolioGroup } = {};

    portfolios.forEach((portfolio) => {
      const category = portfolio.category || 'Uncategorized';

      if (!groups[category]) {
        groups[category] = {
          category,
          projects: [],
        };
      }

      groups[category].projects.push(portfolio);
    });

    return groups;
  }, [portfolios]);

  // Get categories
  const categories = useMemo(() => Object.keys(groupedPortfolios).sort(), [groupedPortfolios]);

  // Set initial category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Get projects for the selected category
  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedPortfolios[selectedCategory]?.projects || [];
  }, [selectedCategory, groupedPortfolios]);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 p-2 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Dynamic container that scales to image aspect ratio */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : 'auto',
            }}
          >
            <Image
              src={selectedImage}
              alt="Full resolution image"
              className="w-full h-full object-contain"
              data-field-name="lightbox"
            />
          </motion.div>
        </motion.div>
      )}

      <main className="w-full max-w-[100rem] mx-auto px-6 md:px-8 py-20">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white tracking-tight mb-6">
            Our Work
          </h1>
          <p className="text-lg font-paragraph text-white/60 max-w-2xl">
            A collection of our creative photography and visual projects
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="w-full h-96 bg-black flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/50 text-sm tracking-widest uppercase"
            >
              Loading gallery...
            </motion.div>
          </div>
        )}

        {/* Gallery Navigation and Content */}
        {!isLoading && portfolios.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Category Tabs */}
            <div className="mb-12">
              {categories.length > 0 && (
                <div>
                  <p className="text-sm font-paragraph text-white/40 uppercase tracking-widest mb-4">
                    Category
                  </p>
                  <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="w-full"
                  >
                    <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1 flex flex-wrap gap-1 h-auto">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white transition-colors"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Project Count */}
            <div className="mb-8">
              <p className="text-sm font-paragraph text-white/40">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} in this category
              </p>
            </div>

            {/* Project Gallery - Grid Layout with Multiple Images */}
            {filteredProjects.length > 0 ? (
              <div className="space-y-16">
                {filteredProjects.map((project, projectIndex) => {
                  // Get all images for this project
                  const allImages = [
                    ...(project.mainImage ? [project.mainImage] : []),
                    ...(project.images?.map((img) => img.imageUrl) || []),
                  ].filter(Boolean);

                  return (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: projectIndex * 0.1 }}
                      className="space-y-4"
                    >
                      {/* Project Header */}
                      <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
                          {project.projectName}
                        </h2>
                        <div className="flex items-center gap-4">
                          {project.category && (
                            <span className="px-3 py-1 bg-white/10 text-white/70 text-xs font-mono uppercase tracking-widest rounded">
                              {project.category}
                            </span>
                          )}
                          <p className="text-sm font-paragraph text-white/50">
                            {allImages.length} image{allImages.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {project.shortDescription && (
                          <p className="text-base font-paragraph text-white/60 mt-3">
                            {project.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Images Grid */}
                      {allImages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allImages.map((imageUrl, imageIndex) => (
                            <motion.div
                              key={imageIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: imageIndex * 0.05 }}
                              className="group cursor-pointer overflow-hidden bg-white/5 hover:bg-white/10 transition-colors rounded-lg"
                              onClick={() => setSelectedImage(imageUrl)}
                            >
                              <div className="relative aspect-square overflow-hidden">
                                <Image
                                  src={imageUrl}
                                  alt={`${project.projectName} - Image ${imageIndex + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  width={500}
                                  height={500}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center">
                          <p className="text-white/40 text-sm">No images available</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-96 flex items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-base font-paragraph text-white/50">
                    No projects in this category yet
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && portfolios.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50">
                No projects available yet. Start creating from the Admin Panel!
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
