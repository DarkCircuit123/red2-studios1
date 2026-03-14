import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FashionFeed {
  id: string;
  title: string;
  description: string;
  gradient: string;
  icon: string;
}

const RubberBandCarouselSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFeed, setCurrentFeed] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const feedIntervalRef = useRef<NodeJS.Timeout>();

  // Fashion TV feed data
  const fashionFeeds: FashionFeed[] = [
    {
      id: '1',
      title: 'RUNWAY LIVE',
      description: 'Spring/Summer 2025 Collection',
      gradient: 'from-purple-600 to-pink-600',
      icon: '👗',
    },
    {
      id: '2',
      title: 'STYLE TRENDS',
      description: 'This Season\'s Must-Have Pieces',
      gradient: 'from-blue-600 to-cyan-600',
      icon: '✨',
    },
    {
      id: '3',
      title: 'DESIGNER SPOTLIGHT',
      description: 'Emerging Fashion Designers',
      gradient: 'from-orange-600 to-red-600',
      icon: '🎨',
    },
    {
      id: '4',
      title: 'STREET STYLE',
      description: 'Fashion Week Street Photography',
      gradient: 'from-green-600 to-emerald-600',
      icon: '📸',
    },
    {
      id: '5',
      title: 'LUXURY SHOWCASE',
      description: 'High Fashion Collections',
      gradient: 'from-yellow-600 to-amber-600',
      icon: '💎',
    },
    {
      id: '6',
      title: 'FASHION FORECAST',
      description: 'Next Season\'s Predictions',
      gradient: 'from-indigo-600 to-purple-600',
      icon: '🔮',
    },
  ];

  // Auto-advance feed every 5 seconds
  useEffect(() => {
    if (!isLive) return;

    feedIntervalRef.current = setInterval(() => {
      setCurrentFeed((prev) => (prev + 1) % fashionFeeds.length);
    }, 5000);

    return () => {
      if (feedIntervalRef.current) {
        clearInterval(feedIntervalRef.current);
      }
    };
  }, [isLive, fashionFeeds.length]);

  const handlePrevious = () => {
    setCurrentFeed((prev) => (prev - 1 + fashionFeeds.length) % fashionFeeds.length);
  };

  const handleNext = () => {
    setCurrentFeed((prev) => (prev + 1) % fashionFeeds.length);
  };

  const currentFeedData = fashionFeeds[currentFeed];

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[55vh] bg-black overflow-hidden"
    >
      {/* Live Fashion TV Feed */}
      <motion.div
        key={currentFeed}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className={`absolute inset-0 bg-gradient-to-br ${currentFeedData.gradient} flex items-center justify-center`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1))] bg-[length:40px_40px] animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-7xl mb-6"
          >
            {currentFeedData.icon}
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-bold mb-4 tracking-wider"
          >
            {currentFeedData.title}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl font-light mb-8 opacity-90"
          >
            {currentFeedData.description}
          </motion.p>

          {/* Live indicator */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-red-600 px-6 py-3 rounded-full font-semibold"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            LIVE NOW
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-8">
        <button
          onClick={handlePrevious}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/30"
        >
          ←
        </button>

        {/* Feed indicators */}
        <div className="flex gap-2">
          {fashionFeeds.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentFeed(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentFeed ? 'bg-white w-8' : 'bg-white/50 w-2'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/30"
        >
          →
        </button>
      </div>

      {/* Live status bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 animate-pulse" />

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
    </section>
  );
};

export default RubberBandCarouselSection;
