import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities';
import { Image } from '@/components/ui/image';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface FashionContent {
  id: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  videoUrl?: string;
  link: string;
  pubDate: string;
  author?: string;
}

export default function LiveFashionTVFeed() {
  const [content, setContent] = useState<FashionContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchFashionContent = async () => {
      try {
        setIsLoading(true);

        // Fetch blog posts from CMS
        const result = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 12 });

        if (result.items && result.items.length > 0) {
          const fashionContent: FashionContent[] = result.items.map((post) => ({
            id: post._id,
            title: post.title || 'Untitled Article',
            excerpt: post.excerpt || post.content?.substring(0, 150) || 'Fashion news update',
            thumbnail: post.thumbnailImage || 'https://static.wixstatic.com/media/e9d727_b4d85ec0ac304b28a432ac757394304a~mv2.png?originWidth=1152&originHeight=576',
            videoUrl: post.videoUrl,
            link: post.externalLink || `/blog#${post._id}`,
            pubDate: post.publicationDate ? new Date(post.publicationDate).toLocaleDateString() : new Date().toLocaleDateString(),
            author: post.author || 'Fashion Editor',
          }));

          setContent(fashionContent);
        } else {
          setContent([]);
        }
      } catch (err) {
        console.error('Error loading fashion content:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFashionContent();
  }, []);

  // Auto-advance content
  useEffect(() => {
    if (!isPlaying || content.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % content.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [isPlaying, content.length]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading live fashion feed...</div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="w-full h-96 bg-black flex items-center justify-center">
        <div className="text-gray-400">No fashion content available</div>
      </div>
    );
  }

  const current = content[currentIndex];
  const nextIndex = (currentIndex + 1) % content.length;
  const next = content[nextIndex];

  return (
    <div className="w-full bg-black overflow-hidden">
      {/* Main TV Feed */}
      <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] bg-black">
        {/* Current Content */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={current.thumbnail}
              alt={current.title}
              className="w-full h-full object-cover"
              width={1200}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-12">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Live Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-heading font-bold text-white uppercase tracking-widest">
                    Live
                  </span>
                </div>
                <span className="text-xs text-gray-400">{current.author}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-3 line-clamp-2">
                {current.title}
              </h2>

              {/* Excerpt */}
              <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2">
                {current.excerpt}
              </p>

              {/* Meta Info */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{current.pubDate}</span>
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-heading font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
                >
                  Read More →
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-20">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 md:p-3 bg-black/50 hover:bg-primary transition-colors rounded-full backdrop-blur-sm"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 text-white" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 md:p-3 bg-black/50 hover:bg-primary transition-colors rounded-full backdrop-blur-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 z-10">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${((currentIndex + 1) / content.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="bg-black border-t border-gray-800 px-4 py-4 md:py-6">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2">
          {content.map((item, idx) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPlaying(true);
              }}
              className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all duration-300 ${
                idx === currentIndex
                  ? 'ring-2 ring-primary w-24 h-16 md:w-32 md:h-20'
                  : 'w-20 h-14 md:w-28 md:h-18 opacity-60 hover:opacity-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
                width={128}
                height={80}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-1 right-1 text-xs font-heading font-bold text-white line-clamp-1">
                {item.title}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Next Up Preview */}
      <div className="bg-black border-t border-gray-800 px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-heading font-bold mb-3">
            Next Up
          </p>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-16 h-12 md:w-24 md:h-16 rounded-lg overflow-hidden">
              <Image
                src={next.thumbnail}
                alt={next.title}
                className="w-full h-full object-cover"
                width={96}
                height={64}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-heading font-bold text-white line-clamp-2 mb-1">
                {next.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1">{next.author}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
