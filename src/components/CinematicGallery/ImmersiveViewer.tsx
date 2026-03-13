import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface ImmersiveViewerProps {
  images: string[];
  titles?: string[];
  years?: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export default function ImmersiveViewer({
  images,
  titles = [],
  years = [],
  isOpen,
  onClose,
  initialIndex = 0,
}: ImmersiveViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [rotation, setRotation] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (!isOpen || images.length === 0) return;
    
    const preloadImage = (src: string) => {
      const img = new window.Image();
      img.src = src;
    };

    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    
    preloadImage(images[nextIndex]);
    preloadImage(images[prevIndex]);
  }, [currentIndex, isOpen, images]);

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateViewportSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageLoaded(false);
    resetTransforms();
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if (e.key === '0') resetTransforms();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoom]);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
    resetTransforms();
  }, [images.length, resetTransforms]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoaded(false);
    resetTransforms();
  }, [images.length, resetTransforms]);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Show controls on mouse move
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);

    // Handle panning when dragging
    if (!isDragging || zoom <= 1) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Constrain pan to image bounds
    const maxPan = (zoom - 1) * 100;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight,
    });
    setImageLoaded(true);
  };

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `image-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black overflow-hidden"
        onClick={onClose}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Advanced Backdrop with Gradient Mesh */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Film Grain */}
          <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-grain" />
          
          {/* Ambient Lighting - Dynamic based on image */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-red-900/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Image Container with Advanced Rendering */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative w-full h-full flex items-center justify-center"
              style={{
                cursor: zoom > 1 ? 'grab' : 'default',
              }}
            >
              <motion.div
                animate={{
                  x: pan.x,
                  y: pan.y,
                  scale: zoom,
                  rotate: rotation,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex items-center justify-center"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <img
                  ref={imageRef}
                  src={images[currentIndex]}
                  alt={titles[currentIndex] || `Image ${currentIndex + 1}`}
                  onLoad={handleImageLoad}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.5))',
                  }}
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Advanced Loading Indicator */}
        {!imageLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white/40 text-xs tracking-widest uppercase"
              >
                Loading image...
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Metadata Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 z-30 pointer-events-none"
        >
          {titles[currentIndex] && (
            <p className="text-xs md:text-sm font-heading text-white/90 tracking-widest uppercase mb-2">
              {titles[currentIndex]}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs font-heading text-white/60">
            <span>{currentIndex + 1} / {images.length}</span>
            {years[currentIndex] && <span>•</span>}
            {years[currentIndex] && <span>{years[currentIndex]}</span>}
            {imageDimensions && (
              <>
                <span>•</span>
                <span>{imageDimensions.width} × {imageDimensions.height}px</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Advanced Control Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-30 pointer-events-none flex items-center justify-between p-4 sm:p-6 md:p-8"
        >
          {/* Left Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="pointer-events-auto p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Right Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="pointer-events-auto p-3 md:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </motion.div>

        {/* Top Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 z-30 flex items-center gap-2 pointer-events-auto"
        >
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
            <span className="text-xs text-white/60 px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>

          {/* Rotate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotate();
            }}
            className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20"
            aria-label="Rotate image"
            title="Rotate (R)"
          >
            <RotateCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20"
            aria-label="Download image"
            title="Download"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md border border-white/10 hover:border-white/20"
            aria-label="Close viewer"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentIndex + 1) / images.length }}
          transition={{ duration: 0.4 }}
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900 origin-left z-30"
        />

        {/* Keyboard Hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 text-xs font-heading text-white/40 tracking-widest uppercase pointer-events-none text-center"
        >
          <div>← → Navigate • +/- Zoom • R Rotate • 0 Reset • ESC Close</div>
          <div className="mt-1 text-white/30">Scroll to zoom • Drag to pan</div>
        </motion.div>

        {/* Thumbnail Strip (Bottom) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-20 sm:bottom-24 md:bottom-28 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 pointer-events-auto"
        >
          {images.slice(Math.max(0, currentIndex - 2), Math.min(images.length, currentIndex + 3)).map((img, idx) => {
            const actualIdx = Math.max(0, currentIndex - 2) + idx;
            return (
              <motion.button
                key={actualIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(actualIdx);
                  setImageLoaded(false);
                  resetTransforms();
                }}
                className={`relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  actualIdx === currentIndex
                    ? 'border-red-600 scale-110'
                    : 'border-white/20 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${actualIdx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
