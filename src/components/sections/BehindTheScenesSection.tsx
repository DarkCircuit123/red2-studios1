import React, { useState, useEffect } from 'react';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

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

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      // Use dedicated API endpoint for behind-the-scenes data
      const response = await fetch('/api/cms/get-behind-the-scenes');
      if (!response.ok) throw new Error('Failed to fetch behind-the-scenes items');
      
      const result = await response.json();
      if (result?.items && result.items.length > 0) {
        // Items are already sorted by the API, take first 3
        setItems(result.items.slice(0, 3));
      } else {
        console.error('Failed to load behind-the-scenes items: no items found');
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load behind-the-scenes items:', error);
      setItems([]);
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
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-[100rem] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-heading text-5xl md:text-6xl font-bold mb-4 text-black">Behind The Scenes</h2>
          <p className="font-paragraph text-lg text-gray-600 max-w-2xl mx-auto">
            Get an exclusive look at our creative process and the moments that make it all happen.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden rounded-lg mb-4 aspect-square bg-gray-100">
                {item.photo ? (
                  <Image
                    src={convertWixImageToHttps(item.photo) || item.photo}
                    alt={item.title || 'Behind the scenes'}
                    width={400}
                    height={400}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
