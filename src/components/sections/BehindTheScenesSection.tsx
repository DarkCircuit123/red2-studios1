import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants, getStaggeredVariant } from '@/lib/scroll-animation-variants';
import { Image } from '@/components/ui/image';
import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { useImageFitting } from '@/hooks/useImageFitting';

interface BehindTheScenesImage {
  _id: string;
  imageName?: string;
  behindTheScenesImage?: string;
  focalPointX?: number;
  focalPointY?: number;
}

export default function BehindTheScenesSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true });
  const [images, setImages] = useState<BehindTheScenesImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

  useEffect(() => {
    const loadImages = async () => {
      try {
        // For now, create placeholder structure - in production, fetch from CMS
        // This assumes a future collection or field for behind-the-scenes images
        setImages([
          { _id: '1', imageName: 'Scene 1', behindTheScenesImage: '', focalPointX: 50, focalPointY: 50 },
          { _id: '2', imageName: 'Scene 2', behindTheScenesImage: '', focalPointX: 50, focalPointY: 50 },
          { _id: '3', imageName: 'Scene 3', behindTheScenesImage: '', focalPointX: 50, focalPointY: 50 },
        ]);
      } catch (error) {
        console.error('[BehindTheScenesSection] Failed to load images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleImageLoad = (id: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions((prev) => ({
      ...prev,
      [id]: {
        width: img.naturalWidth,
        height: img.naturalHeight,
      },
    }));
  };

  return (
    <section ref={sectionRef} className="w-full min-h-screen bg-black text-white py-20 px-4 md:px-8">
      <div className="max-w-[100rem] mx-auto">
        <motion.div
          initial="hidden"
          animate={sectionVisible ? "visible" : "hidden"}
          variants={scrollAnimationVariants.headingSlideUp}
        >
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-12">Behind The Scenes</h2>
          <motion.div
            initial="hidden"
            animate={sectionVisible ? "visible" : "hidden"}
            variants={scrollAnimationVariants.containerStagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {images.map((item, i) => {
              const dims = imageDimensions[item._id] || { width: 1, height: 1 };
              const { fitting } = useImageFitting({
                imageWidth: dims.width,
                imageHeight: dims.height,
                containerWidth: 400,
                containerHeight: 400,
                focalPoint: {
                  x: item.focalPointX ?? 50,
                  y: item.focalPointY ?? 50,
                },
                fitMode: 'cover',
              });

              return (
                <motion.div
                  key={item._id}
                  variants={getStaggeredVariant(i, 0.15, 0.12)}
                  className="bg-gray-900 rounded-lg overflow-hidden aspect-square"
                >
                  {item.behindTheScenesImage ? (
                    <Image
                      src={item.behindTheScenesImage}
                      alt={item.imageName || 'Behind the scenes'}
                      onLoad={(e) => handleImageLoad(item._id, e)}
                      className="w-full h-full"
                      style={{
                        objectFit: fitting.objectFit as any,
                        objectPosition: fitting.objectPosition,
                      }}
                      width={400}
                      height={400}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
