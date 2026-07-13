import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

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
        console.error('Error fetching ticker stories:', err);
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
    }, 5000); // Change story every 5 seconds

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
    <div className="w-full bg-black border-t border-b border-gray-800 py-3 px-4">
      <div className="max-w-[100rem] mx-auto">
        {/* Header with label and controls */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex-shrink-0">
            <span className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap">
              Live News
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors duration-200"
              aria-label="Previous story"
              title="Previous story"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors duration-200"
              aria-label={isPaused ? 'Play' : 'Pause'}
              title={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
              ) : (
                <Pause className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors duration-200"
              aria-label="Next story"
              title="Next story"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Story display */}
        <div className="overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            {/* Category badge */}
            {currentStory.category && (
              <span className="flex-shrink-0 text-xs font-heading font-semibold text-primary uppercase tracking-wider px-2 py-1 bg-primary/10 rounded">
                {currentStory.category}
              </span>
            )}

            {/* Headline link */}
            <a
              href={displayUrl}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noopener noreferrer' : undefined}
              className="flex-1 text-sm text-gray-200 hover:text-primary transition-colors duration-300 line-clamp-2 cursor-pointer"
            >
              {currentStory.headline || 'Untitled Story'}
            </a>

            {/* Publish date */}
            {currentStory.publishDate && (
              <span className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                {new Date(currentStory.publishDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </motion.div>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-1 mt-3">
          {stories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                idx === currentIndex ? 'bg-primary' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              aria-label={`Go to story ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
