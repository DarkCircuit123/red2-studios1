import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Play, Pause, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface TickerStory {
  _id: string;
  headline?: string;
  slug?: string;
  storyURL?: string;
  category?: string;
  publishDate?: Date | string;
  active?: boolean;
  priority?: number;
}

export default function LiveTickerSection() {
  const [stories, setStories] = useState<TickerStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const result = await BaseCrudService.getAll<TickerStory>('tickerstories', {}, { limit: 100 });
        
        if (result?.items && result.items.length > 0) {
          // Filter active stories and sort by priority
          const activeStories = result.items
            .filter(story => story.active !== false)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
          
          setStories(activeStories);
        } else {
          setStories([]);
        }
      } catch (err) {
        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
    // Refresh every 15 minutes
    const interval = setInterval(fetchStories, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || stories.length === 0) {
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    animationRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    }, 6000); // Change story every 6 seconds

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPaused, stories.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
  };

  if (isLoading || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const displayUrl = currentStory.storyURL || '#';
  const isExternalLink = displayUrl.startsWith('http');

  return (
    <div className="w-full bg-gradient-to-r from-black via-black/95 to-black border-t border-b border-primary/20 py-4 px-4">
      <div className="max-w-[100rem] mx-auto">
        {/* Header with label and controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-shrink-0">
            <motion.span 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap"
            >
              🔴 Live News
            </motion.span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1 border border-primary/20">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-primary/20 rounded transition-colors duration-200"
              aria-label="Previous story"
              title="Previous story"
            >
              <ChevronLeft className="w-4 h-4 text-gray-300 hover:text-primary transition-colors" />
            </button>

            <div className="w-px h-4 bg-primary/20" />

            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-primary/20 rounded transition-colors duration-200"
              aria-label={isPaused ? 'Play' : 'Pause'}
              title={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-gray-300 hover:text-primary transition-colors" />
              ) : (
                <Pause className="w-4 h-4 text-gray-300 hover:text-primary transition-colors" />
              )}
            </button>

            <div className="w-px h-4 bg-primary/20" />

            <button
              onClick={handleNext}
              className="p-2 hover:bg-primary/20 rounded transition-colors duration-200"
              aria-label="Next story"
              title="Next story"
            >
              <ChevronRight className="w-4 h-4 text-gray-300 hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Story display with enhanced styling */}
        <div className="overflow-hidden rounded-lg bg-black/30 border border-primary/10 p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-4"
            >
              {/* Category badge */}
              {currentStory.category && (
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 text-xs font-heading font-bold text-white uppercase tracking-wider px-3 py-1 bg-primary rounded-full"
                >
                  {currentStory.category}
                </motion.span>
              )}

              {/* Headline and metadata */}
              <div className="flex-1 min-w-0">
                {/* Headline link */}
                <a
                  href={displayUrl}
                  target={isExternalLink ? '_blank' : undefined}
                  rel={isExternalLink ? 'noopener noreferrer' : undefined}
                  className="group block text-sm md:text-base text-gray-100 hover:text-primary transition-colors duration-300 line-clamp-2 font-medium"
                >
                  {currentStory.headline || 'Untitled Story'}
                  {isExternalLink && (
                    <ExternalLink className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>

                {/* Publish date */}
                {currentStory.publishDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(currentStory.publishDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicators with hover preview */}
        <div className="flex gap-1 mt-4">
          {stories.map((story, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex-1 group"
              whileHover={{ scale: 1.05 }}
            >
              <div className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-primary' : 'bg-gray-700 hover:bg-gray-600'
              }`} />
              
              {/* Hover tooltip */}
              {hoveredIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 border border-primary/30 rounded px-2 py-1 text-xs text-gray-200 whitespace-nowrap z-10 pointer-events-none"
                >
                  {story.headline?.substring(0, 30)}...
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Story counter */}
        <div className="text-center mt-3 text-xs text-gray-500">
          {currentIndex + 1} / {stories.length}
        </div>
      </div>
    </div>
  );
}
