import { useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { Image, type ImageProps } from '@/components/ui/image';
import WixImageResolver from '@/lib/wix-image-resolver';

interface EnlargeableImageProps extends ImageProps {
  onEnlarge?: () => void;
  showIndicator?: boolean;
}

export default function EnlargeableImage({
  onEnlarge,
  showIndicator = true,
  className = '',
  src,
  ...imageProps
}: EnlargeableImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Resolve the image URL through WixImageResolver
  const resolved = WixImageResolver.resolve(src);
  const resolvedSrc = resolved.url;

  const handleClick = () => {
    onEnlarge?.();
  };

  return (
    <div
      className="relative inline-block w-full h-full group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label="Click to enlarge image"
    >
      <Image
        {...imageProps}
        src={resolvedSrc}
        className={`${className} transition-opacity duration-300 ${
          isHovered ? 'opacity-90' : 'opacity-100'
        }`}
      />

      {/* Enlarge Indicator */}
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
          pointerEvents="none"
        >
          <motion.div
            animate={{ scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className="bg-white/90 p-3 rounded-full shadow-lg"
          >
            <Maximize2 className="w-5 h-5 text-black" />
          </motion.div>
        </motion.div>
      )}

      {/* Static indicator for non-hover states (mobile/accessibility) */}
      {showIndicator && !isHovered && (
        <div className="absolute bottom-2 right-2 bg-white/70 p-1.5 rounded-full shadow-md opacity-60 group-hover:opacity-0 transition-opacity duration-300">
          <Maximize2 className="w-4 h-4 text-black" />
        </div>
      )}
    </div>
  );
}
