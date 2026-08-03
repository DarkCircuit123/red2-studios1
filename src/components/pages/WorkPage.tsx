import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

interface PhotoItem {
  id: string;
  src: string;
  alt: string;
}

export default function WorkPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
        const allPhotos: PhotoItem[] = [];

        // Extract all images from all projects
        data.items?.forEach((project) => {
          if (project.mainImage) {
            allPhotos.push({
              id: `${project._id}-main`,
              src: project.mainImage,
              alt: project.projectName || 'Project photo',
            });
          }
          if (project.galleryImage1) {
            allPhotos.push({
              id: `${project._id}-1`,
              src: project.galleryImage1,
              alt: project.projectName || 'Project photo',
            });
          }
          if (project.galleryImage2) {
            allPhotos.push({
              id: `${project._id}-2`,
              src: project.galleryImage2,
              alt: project.projectName || 'Project photo',
            });
          }
          if (project.galleryImage3) {
            allPhotos.push({
              id: `${project._id}-3`,
              src: project.galleryImage3,
              alt: project.projectName || 'Project photo',
            });
          }
        });

        setPhotos(allPhotos);
      } catch (error) {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />

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

        {/* Photo Gallery - Masonry Layout */}
        {!isLoading && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="break-inside-avoid group cursor-pointer overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  data-field-name="photo"
                  data-record-id={photo.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && photos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50">
                No photos available yet
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
