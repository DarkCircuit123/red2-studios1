import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useStories } from '@/hooks/useStories';

interface Story {
  _id: string;
  title: string;
  slug: string;
  sourceURL: string;
  sourceName: string;
  publicationDate: string;
  featuredImage: string;
  excerpt: string;
  fullSummary: string;
}

const ITEMS_PER_PAGE = 12;

export default function StoriesIndexPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const { fetchStories: fetchStoriesFromAPI } = useStories();

  // Fetch stories
  const fetchStories = useCallback(async (skipValue: number) => {
    try {
      const result = await fetchStoriesFromAPI(ITEMS_PER_PAGE, skipValue);
      if (!result) throw new Error('Failed to fetch stories');
      
      if (skipValue === 0) {
        setStories(result.items);
      } else {
        setStories(prev => [...prev, ...result.items]);
      }
      
      setHasMore(result.hasNext);
      setSkip(skipValue + ITEMS_PER_PAGE);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching stories:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchStoriesFromAPI]);

  // Initial load
  useEffect(() => {
    fetchStories(0);
  }, [fetchStories]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchStories(skip);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [skip, hasMore, isLoading, fetchStories]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="w-full px-6 py-16">
        <div className="max-w-[100rem] mx-auto">
          {/* Page Title */}
          <div className="mb-16">
            <h1 className="font-cormorant-garamond text-6xl font-bold text-[#e8e0d0] mb-4">
              Stories & Insights
            </h1>
            <p className="font-montserrat text-[#888888] text-sm tracking-widest">
              Curated from British Journal of Photography
            </p>
          </div>

          {/* Masonry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
            {stories.map((story, index) => (
              <motion.div
                key={story._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group cursor-pointer overflow-hidden ${
                  index % 5 === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
                }`}
              >
                <Link to={`/stories/${story.slug}`} className="block h-full">
                  <div className="relative w-full h-full bg-[#1a1a1a] overflow-hidden">
                    {/* Featured Image */}
                    <Image
                      src={story.featuredImage}
                      alt={story.title}
                      width={500}
                      height={500}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        index % 5 === 0 ? 'aspect-square' : 'aspect-square'
                      }`}
                    />

                    {/* Vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                    {/* Content overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {/* Title */}
                      <h3 className="font-cormorant-garamond text-2xl font-bold text-white mb-3 line-clamp-3">
                        {story.title}
                      </h3>

                      {/* Meta */}
                      <p className="font-montserrat text-xs tracking-widest text-[#888888]">
                        {story.sourceName} · {formatDate(story.publicationDate)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Loading indicator for infinite scroll */}
          <div ref={observerTarget} className="py-12 flex justify-center">
            {isLoading && stories.length > 0 && (
              <div className="text-[#888888] font-montserrat text-sm">
                Loading more stories...
              </div>
            )}
          </div>

          {/* Empty state */}
          {!isLoading && stories.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#888888] font-montserrat">
                No stories available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
