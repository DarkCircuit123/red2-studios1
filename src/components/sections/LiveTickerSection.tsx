import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, ExternalLink, Video } from 'lucide-react';

interface RSSStory {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  videoUrl?: string;
}

export default function LiveTickerSection() {
  const [stories, setStories] = useState<RSSStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchRSSFeeds = async () => {
      try {
        setIsLoading(true);
        const feeds = [
          { url: 'https://feeds.vogue.com/vogue/index.xml', source: 'Vogue' },
          { url: 'https://www.sonyalpharumors.com/feed/', source: 'Sony Alpha' },
          { url: 'https://www.fashionnetwork.com/rss/news.xml', source: 'Fashion Network' },
          { url: 'https://www.thefashionspot.com/feed/', source: 'The Fashion Spot' },
        ];

        const allStories: RSSStory[] = [];

        for (const feed of feeds) {
          try {
            const response = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.items && Array.isArray(data.items)) {
                const feedStories = data.items.slice(0, 5).map((item: any) => ({
                  title: item.title || 'Untitled',
                  link: item.link || item.url || '#',
                  pubDate: item.pubDate || item.published || new Date().toISOString(),
                  source: feed.source,
                  videoUrl: item.videoUrl || item.media?.content?.[0]?.url,
                }));
                allStories.push(...feedStories);
              }
            }
          } catch (err) {
            console.error(`Error fetching ${feed.source} feed:`, err);
          }
        }

        // Shuffle and limit to 20 stories
        const shuffled = allStories.sort(() => Math.random() - 0.5).slice(0, 20);
        setStories(shuffled.length > 0 ? shuffled : []);
      } catch (err) {
        console.error('Error fetching RSS feeds:', err);
        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRSSFeeds();
    // Refresh every 30 minutes
    const interval = setInterval(fetchRSSFeeds, 30 * 60 * 1000);
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

  const handleWatchVideo = (e: React.MouseEvent, videoUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  if (isLoading || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const displayUrl = currentStory.link || '#';
  const isExternalLink = displayUrl.startsWith('http');
  const hasVideo = !!currentStory.videoUrl;

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
              className="flex items-start justify-between gap-4"
            >
              {/* Source badge */}
              <motion.span 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0 text-xs font-heading font-bold text-white uppercase tracking-wider px-3 py-1 bg-primary rounded-full"
              >
                {currentStory.source}
              </motion.span>

              {/* Headline and metadata */}
              <div className="flex-1 min-w-0">
                {/* Headline link */}
                <a
                  href={displayUrl}
                  target={isExternalLink ? '_blank' : undefined}
                  rel={isExternalLink ? 'noopener noreferrer' : undefined}
                  className="group block text-sm md:text-base text-gray-100 hover:text-primary transition-colors duration-300 line-clamp-2 font-medium"
                >
                  {currentStory.title || 'Untitled Story'}
                  {isExternalLink && (
                    <ExternalLink className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>

                {/* Publish date */}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(currentStory.pubDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Watch Video button - only shows if video exists */}
              {hasVideo && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => handleWatchVideo(e, currentStory.videoUrl!)}
                  className="flex-shrink-0 px-3 py-1 bg-primary hover:bg-primary/90 text-white text-xs font-heading font-bold rounded-lg transition-colors duration-200 flex items-center gap-1 whitespace-nowrap"
                  title="Watch video"
                >
                  <Video className="w-3 h-3" />
                  Watch
                </motion.button>
              )}
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
                  {story.title?.substring(0, 30)}...
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
