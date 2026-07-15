import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useSearchParams } from 'react-router-dom';

// Helper: Strip HTML/markdown from content
function stripContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[#*_`\[\]()]/g, '') // Remove markdown
    .trim()
    .substring(0, 150) + '...';
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPosts[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPosts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const abortControllerRef = useRef<AbortController | null>(null);

  const ITEMS_PER_PAGE = 12;

  // Load posts with pagination
  useEffect(() => {
    const loadPosts = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await BaseCrudService.getAll<BlogPosts>(
          'blogposts',
          {},
          { limit: 100 }
        );

        const allPosts = result.items || [];
        setPosts(allPosts);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(allPosts.map(p => p.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);

        setCurrentPage(0);
        setHasMore(allPosts.length > ITEMS_PER_PAGE);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load blog posts. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter posts based on search and category
  useEffect(() => {
    let filtered = posts;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.excerpt?.toLowerCase().includes(query) ||
        p.content?.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
    setCurrentPage(0);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [posts, selectedCategory, searchQuery]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params);
  }, [selectedCategory, searchQuery, setSearchParams]);

  const displayedPosts = filteredPosts.slice(0, (currentPage + 1) * ITEMS_PER_PAGE);
  const canLoadMore = displayedPosts.length < filteredPosts.length;

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full flex items-start justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
              aria-label="Back to home page"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Stories & Insights
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              Behind-the-scenes stories, photography tips, and creative insights from our latest shoots.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 space-y-6"
          >
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search blog posts"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Category Filters */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  aria-pressed={!selectedCategory}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                    aria-pressed={selectedCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-500/80 hover:text-red-500 text-sm mt-2 underline"
                >
                  Try again
                </button>
              </div>
            </motion.div>
          )}

          {/* Blog Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : displayedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60">
                {filteredPosts.length === 0 && posts.length > 0
                  ? 'No posts match your filters.'
                  : 'No blog posts available yet.'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {displayedPosts.map((post, idx) => {
                  const maxDelay = Math.min(idx * 0.08, 0.6);
                  const contentPreview = post.excerpt || stripContent(post.content || '');

                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: maxDelay }}
                      className="group h-full"
                    >
                      <Link
                        to={`/blog/${post._id}`}
                        className="flex flex-col h-full no-underline"
                        aria-label={`Read ${post.title}`}
                      >
                        <article className="flex flex-col h-full">
                          {/* Featured Image with Play Icon */}
                          {post.thumbnailImage && (
                            <div className="relative overflow-hidden rounded-lg mb-6 aspect-video bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Image
                                src={post.thumbnailImage}
                                alt={post.title || 'Blog post thumbnail'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Play Icon Overlay for Videos */}
                              {post.videoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Content */}
                          <div className="space-y-3 flex-grow flex flex-col">
                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-xs text-white/40 uppercase tracking-wide flex-wrap">
                              {post.publicationDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <time dateTime={new Date(post.publicationDate).toISOString()}>
                                    {new Date(post.publicationDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </time>
                                </div>
                              )}
                              {post.author && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{post.author}</span>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-heading font-bold text-white group-hover:text-white/80 transition-colors line-clamp-2">
                              {post.title}
                            </h3>

                            {/* Content Preview */}
                            {contentPreview && (
                              <p className="text-sm text-white/60 line-clamp-3 flex-grow">
                                {contentPreview}
                              </p>
                            )}
                          </div>
                        </article>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {canLoadMore && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded transition-all duration-300"
                    aria-label="Load more blog posts"
                  >
                    Load More
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
