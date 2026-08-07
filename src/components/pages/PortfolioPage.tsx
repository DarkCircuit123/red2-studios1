import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { PortfolioImages } from '@/entities';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { playClickSound } from '@/lib/click-sound';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function PortfolioPage() {
  const [allImages, setAllImages] = useState<PortfolioImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Fetch all images from portfolioimages collection
  useEffect(() => {
    const fetchAllImages = async () => {
      setIsLoading(true);
      try {
        const result = await BaseCrudService.getAll<PortfolioImages>('portfolioimages', {}, { limit: 1000 });
        setAllImages(result.items || []);
      } catch (error) {
        console.error('Failed to fetch portfolio images:', error);
        setAllImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllImages();
  }, []);

  // Filter images by category
  const filteredImages = selectedCategory
    ? allImages.filter((img) => (img as any).category === selectedCategory)
    : allImages;

  // Get unique categories
  const categories = Array.from(new Set(allImages.map((img) => (img as any).category).filter(Boolean)));

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

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

      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Page Header */}
        <ScrollReveal direction="up" duration={800} className="mb-20">
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            All Photos
          </h1>
          <p className="text-base font-paragraph text-white/50 max-w-xl leading-relaxed">
            A comprehensive collection of {filteredImages.length} photography work across various categories and styles. Each image represents precision and creative excellence.
          </p>
        </ScrollReveal>

        {/* Category Filter */}
        {categories.length > 0 && (
          <ScrollReveal direction="up" duration={800} className="mb-12 flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-lg font-paragraph text-sm transition-all ${
                selectedCategory === null
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All ({allImages.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-lg font-paragraph text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {category} ({allImages.filter((img) => (img as any).category === category).length})
              </button>
            ))}
          </ScrollReveal>
        )}

        {/* Images Grid - Photography-First with Mixed Aspect Ratios */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max">
            {Array(12)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 animate-pulse min-h-[300px]"
                />
              ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max"
          >
            {filteredImages.map((image, index) => (
              <motion.div
                key={image._id}
                variants={itemVariants}
                onMouseEnter={() => setHoveredId(image._id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative overflow-hidden bg-white/5 cursor-pointer ${
                  index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                onClick={() => {
                  playClickSound();
                  setSelectedImage(image.imageUrl || '');
                }}
              >
                {/* Photography-First Container - Preserves Aspect Ratio */}
                <div className="relative w-full bg-black/30 overflow-hidden h-full">
                  {/* Image */}
                  <Image
                    src={image.imageUrl || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                    alt={image.caption || image.altText || 'Portfolio image'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    data-field-name="imageUrl"
                    data-record-id={image._id}
                  />

                  {/* Subtle grain overlay */}
                  <div className="absolute inset-0 bg-grain opacity-5" />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />

                  {/* Content - appears on hover */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={hoveredId === image._id ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col items-end justify-end p-8"
                  >
                    <div className="text-right">
                      {(image as any).category && (
                        <p className="text-xs font-mono text-white/60 mb-3 uppercase tracking-widest">
                          {(image as any).category}
                        </p>
                      )}
                      {image.caption && (
                        <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4 tracking-tight">
                          {image.caption}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 text-white hover:gap-3 transition-all">
                        <span className="text-sm font-paragraph">View</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-base font-paragraph text-white/50 mb-8">
              No images found in this category
            </p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-black font-heading font-semibold text-sm tracking-wide rounded-lg hover:bg-white/95 hover:shadow-lg hover:shadow-white/20 transition-all duration-300"
            >
              View All Photos
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
