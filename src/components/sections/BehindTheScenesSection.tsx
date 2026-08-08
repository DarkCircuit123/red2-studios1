import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { useEditorialMotion } from '@/hooks/useEditorialMotion';
import { editorialMotionVariants, getStaggeredVariant } from '@/lib/scroll-animation-variants';

interface BehindTheScenesItem {
  _id: string;
  photo?: string;
  title?: string;
  description?: string;
  order?: number;
  dateTaken?: string;
}

export default function BehindTheScenesSection() {
  const [items, setItems] = useState<BehindTheScenesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible: sectionVisible } = useEditorialMotion({ triggerOnce: true });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<BehindTheScenesItem>('behindthescenes', [], { limit: 100 });
      const sorted = result.items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(sorted.slice(0, 3));
    } catch (error) {
      console.error('Failed to load behind-the-scenes items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="max-w-[100rem] mx-auto px-4 md:px-8">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-[100rem] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={editorialMotionVariants.headingSlideUp}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-heading text-5xl md:text-6xl font-bold mb-4 text-black">Behind The Scenes</h2>
          <motion.p
            initial="hidden"
            animate={sectionVisible ? "visible" : "hidden"}
            variants={getStaggeredVariant(1, 0.2, 0.1)}
            className="font-paragraph text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Get an exclusive look at our creative process and the moments that make it all happen.
          </motion.p>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={editorialMotionVariants.container}
        >
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              variants={getStaggeredVariant(index, 0.1, 0.12)}
              className="group"
            >
              {/* Image Container */}
              <motion.div
                className="relative overflow-hidden rounded-lg mb-4 aspect-square bg-gray-100"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {item.photo ? (
                  <Image
                    src={item.photo}
                    alt={item.title || 'Behind the scenes'}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </motion.div>

              {/* Content */}
              <motion.div
                initial="hidden"
                animate={sectionVisible ? "visible" : "hidden"}
                variants={getStaggeredVariant(index + 1, 0.3, 0.12)}
              >
                {item.title && (
                  <h3 className="font-heading text-lg font-semibold mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                )}
                {item.description && (
                  <p className="font-paragraph text-sm text-gray-600 line-clamp-3 mb-3">
                    {item.description}
                  </p>
                )}
                {item.dateTaken && (
                  <p className="font-paragraph text-xs text-gray-500">
                    {new Date(item.dateTaken).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
