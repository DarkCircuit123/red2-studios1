import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GalleryPhoto {
  _id: string;
  gallerySlug?: string;
  category?: string;
  subCategory?: string;
  title?: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  displayOrder?: number;
  featured?: boolean;
  _createdDate?: Date;
}

interface GalleryGroup {
  category: string;
  subCategories: {
    [key: string]: GalleryPhoto[];
  };
}

export default function WorkPage() {
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Fetch all gallery photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setIsLoading(true);
        // Fetch all photos with no limit - get everything
        const result = await BaseCrudService.getAll<GalleryPhoto>(
          'galleryphotos',
          {},
          { limit: 1000 } // High limit to ensure we get all photos
        );

        if (result.items && result.items.length > 0) {
          // Sort by displayOrder first, then by creation date
          const sorted = result.items.sort((a, b) => {
            const orderA = a.displayOrder ?? Number.MAX_VALUE;
            const orderB = b.displayOrder ?? Number.MAX_VALUE;
            if (orderA !== orderB) return orderA - orderB;
            
            const dateA = a._createdDate ? new Date(a._createdDate).getTime() : 0;
            const dateB = b._createdDate ? new Date(b._createdDate).getTime() : 0;
            return dateA - dateB;
          });

          setAllPhotos(sorted);

          // Set initial category and subcategory
          if (sorted.length > 0) {
            const firstCategory = sorted[0].category || 'All';
            setSelectedCategory(firstCategory);
            const firstSubCategory = sorted[0].subCategory || 'All';
            setSelectedSubCategory(firstSubCategory);
          }
        }
      } catch (error) {
        console.error('Error loading gallery photos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // Group photos by category and subcategory
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: GalleryGroup } = {};

    allPhotos.forEach((photo) => {
      const category = photo.category || 'Uncategorized';
      const subCategory = photo.subCategory || 'All';

      if (!groups[category]) {
        groups[category] = {
          category,
          subCategories: {},
        };
      }

      if (!groups[category].subCategories[subCategory]) {
        groups[category].subCategories[subCategory] = [];
      }

      groups[category].subCategories[subCategory].push(photo);
    });

    return groups;
  }, [allPhotos]);

  // Get categories and subcategories for the selected category
  const categories = Object.keys(groupedPhotos).sort();
  const subCategories = selectedCategory
    ? Object.keys(groupedPhotos[selectedCategory]?.subCategories || {}).sort()
    : [];

  // Get photos for the selected category and subcategory
  const filteredPhotos = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory) return [];
    return groupedPhotos[selectedCategory]?.subCategories[selectedSubCategory] || [];
  }, [selectedCategory, selectedSubCategory, groupedPhotos]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newSubCategories = Object.keys(
      groupedPhotos[category]?.subCategories || {}
    ).sort();
    if (newSubCategories.length > 0) {
      setSelectedSubCategory(newSubCategories[0]);
    }
  };

  // Handle subcategory change
  const handleSubCategoryChange = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
  };

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

        {/* Gallery Navigation and Content */}
        {!isLoading && allPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Category and Subcategory Tabs */}
            <div className="mb-12 space-y-6">
              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <p className="text-sm font-paragraph text-white/40 uppercase tracking-widest mb-4">
                    Category
                  </p>
                  <Tabs
                    value={selectedCategory}
                    onValueChange={handleCategoryChange}
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

              {/* Subcategories */}
              {subCategories.length > 0 && (
                <div>
                  <p className="text-sm font-paragraph text-white/40 uppercase tracking-widest mb-4">
                    Project
                  </p>
                  <Tabs
                    value={selectedSubCategory}
                    onValueChange={handleSubCategoryChange}
                    className="w-full"
                  >
                    <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1 flex flex-wrap gap-1 h-auto">
                      {subCategories.map((subCategory) => (
                        <TabsTrigger
                          key={subCategory}
                          value={subCategory}
                          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white transition-colors"
                        >
                          {subCategory}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Photo Count */}
            <div className="mb-8">
              <p className="text-sm font-paragraph text-white/40">
                {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} in this collection
              </p>
            </div>

            {/* Photo Gallery - Masonry Layout */}
            {filteredPhotos.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredPhotos.map((photo, index) => (
                  <motion.div
                    key={photo._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="break-inside-avoid group cursor-pointer overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={photo.image || photo.thumbnail || ''}
                        alt={photo.title || 'Gallery photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                      />
                    </div>
                    {photo.title && (
                      <div className="p-4 bg-black/50">
                        <p className="text-sm font-paragraph text-white/80 truncate">
                          {photo.title}
                        </p>
                        {photo.description && (
                          <p className="text-xs font-paragraph text-white/50 truncate mt-1">
                            {photo.description}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-96 flex items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-base font-paragraph text-white/50">
                    No photos in this collection yet
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && allPhotos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50">
                No photos available yet. Start uploading from the Admin Panel!
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
