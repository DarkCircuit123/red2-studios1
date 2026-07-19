import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useCMSCollection } from '@/hooks/useCMSCollection';
import GridSkeleton from '@/components/GridSkeleton';
import SEOHead from '@/components/SEOHead';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function BlogPage() {
  const { items: posts, loading: isLoading } = useCMSCollection<BlogPosts>('blogposts', { limit: 50 });

  return (
    <ErrorBoundary>
      <SEOHead
        title="Blog | Stories & Insights | RED2 STUDIOS"
        description="Behind-the-scenes stories, photography tips, and creative insights from our latest shoots."
        type="website"
      />
      <div className="min-h-screen bg-black text-white">
        <Header />

        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
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

            {/* Blog Grid */}
            {isLoading ? (
              <GridSkeleton count={6} columns="grid-cols-1 md:grid-cols-2" />
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-white/60">No blog posts available yet.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map((post, idx) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <Link
                      to={`/blog/${post._id}`}
                      className="block"
                    >
                      <article className="cursor-pointer">
                        {/* Featured Image */}
                        {post.thumbnailImage && (
                          <div className="relative overflow-hidden rounded-lg mb-6 h-96 bg-white/5 flex items-center justify-center">
                            <Image
                              src={post.thumbnailImage}
                              alt={post.title || 'Blog post'}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="space-y-3">
                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-xs text-white/40 uppercase tracking-wide flex-wrap">
                            {post.publicationDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.publicationDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                            {post.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.author}
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-2xl font-heading font-bold text-white group-hover:text-white/80 transition-colors">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p className="text-base text-white/60">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Full Content Preview */}
                          {post.content && (
                            <p className="text-sm text-white/50 line-clamp-3">
                              {post.content}
                            </p>
                          )}

                          {/* Video Link */}
                          {post.videoUrl && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(post.videoUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm text-white transition-all duration-300"
                            >
                              Watch Video
                            </button>
                          )}
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
