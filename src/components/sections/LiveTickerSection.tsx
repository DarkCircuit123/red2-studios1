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
        let successCount = 0;

        for (const feed of feeds) {
          try {
            const response = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`, {
              signal: AbortSignal.timeout(8000), // 8 second timeout per feed
            });
            
            if (response.ok) {
              // Verify response is JSON before parsing
              const contentType = response.headers.get('content-type');
              if (!contentType?.includes('application/json')) {
                console.warn(`Invalid response type from ${feed.source}:`, contentType);
                continue;
              }

              let data;
              try {
                data = await response.json();
              } catch (parseErr) {
                console.warn(`Failed to parse ${feed.source} response:`, parseErr);
                continue;
              }

              if (data.items && Array.isArray(data.items)) {
                const feedStories = data.items.slice(0, 5).map((item: any) => ({
                  title: item.title || 'Untitled',
                  link: item.link || item.url || '#',
                  pubDate: item.pubDate || item.published || new Date().toISOString(),
                  source: feed.source,
                  videoUrl: item.videoUrl || item.media?.content?.[0]?.url,
                }));
                allStories.push(...feedStories);
                successCount++;
              }
            }
          } catch (err) {
            console.warn(`Error fetching ${feed.source} feed:`, err);
            // Continue with other feeds even if one fails
          }
        }

        // Only use stories if we successfully fetched them
        if (allStories.length > 0) {
          // Shuffle and limit to 20 stories
          const shuffled = allStories.sort(() => Math.random() - 0.5).slice(0, 20);
          setStories(shuffled);
        } else {
          // No stories fetched - ticker will hide
          console.warn('No RSS feeds succeeded, ticker will be hidden');
          setStories([]);
        }
      } catch (err) {
        console.error('Error fetching RSS feeds:', err);
        // Hide ticker on error - no fallback
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

  // Hide ticker if no stories are available (RSS fetch failed)
  if (stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const displayUrl = currentStory.link || '#';
  const isExternalLink = displayUrl.startsWith('http');
  const hasVideo = !!currentStory.videoUrl;

  return (
    <div className="w-full bg-gradient-to-r from-black via-black/95 to-black border-t border-b border-primary/20 py-4 px-4 relative overflow-hidden">
      {/* Animated background pulse effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="max-w-[100rem] mx-auto relative z-10">
        {/* Header with label and controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-shrink-0 relative">
            {/* Flashing red dot */}
            <motion.div
              className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full"
              animate={{ 
                opacity: [1, 0.3, 1],
                scale: [1, 1.2, 1],
                boxShadow: ['0 0 0 0 rgba(111, 8, 9, 0.7)', '0 0 0 8px rgba(111, 8, 9, 0)', '0 0 0 0 rgba(111, 8, 9, 0.7)']
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            <motion.span 
              animate={{ 
                opacity: [0.6, 1, 0.6],
                textShadow: ['0 0 0px rgba(111, 8, 9, 0)', '0 0 10px rgba(111, 8, 9, 0.8)', '0 0 0px rgba(111, 8, 9, 0)']
              }}
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

        {/* Story display with enhanced styling and animated border */}
        <motion.a 
          href={displayUrl}
          target={isExternalLink ? '_blank' : undefined}
          rel={isExternalLink ? 'noopener noreferrer' : undefined}
          animate={{ 
            borderColor: ['rgba(111, 8, 9, 0.1)', 'rgba(111, 8, 9, 0.4)', 'rgba(111, 8, 9, 0.1)'],
            boxShadow: ['0 0 0px rgba(111, 8, 9, 0)', '0 0 12px rgba(111, 8, 9, 0.3)', '0 0 0px rgba(111, 8, 9, 0)']
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="block overflow-hidden rounded-lg bg-black/30 border p-4 cursor-pointer hover:bg-black/40 transition-colors duration-200"
        >
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
                {/* Headline */}
                <div className="group block text-sm md:text-base text-gray-100 hover:text-primary transition-colors duration-300 line-clamp-2 font-medium">
                  {currentStory.title || 'Untitled Story'}
                  {isExternalLink && (
                    <ExternalLink className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

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
                <motion.a
                  href={currentStory.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-shrink-0 px-3 py-1 bg-primary hover:bg-primary/90 text-white text-xs font-heading font-bold rounded-lg transition-colors duration-200 flex items-center gap-1 whitespace-nowrap"
                  title="Watch video"
                >
                  <Video className="w-3 h-3" />
                  Watch
                </motion.a>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.a>

        {/* Progress indicators with hover preview and animated glow */}
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
              <motion.div 
                animate={idx === currentIndex ? {
                  backgroundColor: ['rgba(111, 8, 9, 1)', 'rgba(111, 8, 9, 0.7)', 'rgba(111, 8, 9, 1)'],
                  boxShadow: ['0 0 0px rgba(111, 8, 9, 0)', '0 0 8px rgba(111, 8, 9, 0.6)', '0 0 0px rgba(111, 8, 9, 0)']
                } : {}}
                transition={idx === currentIndex ? { duration: 2, repeat: Infinity } : {}}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-primary' : 'bg-gray-700 hover:bg-gray-600'
                }`} 
              />
              
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
