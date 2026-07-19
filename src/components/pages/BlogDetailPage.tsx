import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCMSResource } from '@/hooks/useCMSResource';
import VideoPlayer from '@/components/VideoPlayer';
import ShareButtons from '@/components/ShareButtons';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import ErrorBoundary from '@/components/ErrorBoundary';
import { sanitizePlainText } from '@/lib/sanitize';
import { playClickSound } from '@/lib/click-sound';

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, loading: isLoading, notFound } = useCMSResource<BlogPosts>('blogposts', id);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-white">
          <Header />
          <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
            <LoadingSpinner />
          </section>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  if (notFound || !post) {
    return (
      <ErrorBoundary>
        <SEOHead title="Article Not Found | RED2 STUDIOS" noindex />
        <div className="min-h-screen bg-black text-white">
          <Header />
          <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
            <div className="max-w-[100rem] mx-auto px-8 w-full text-center">
              <h1 className="text-4xl font-heading font-bold mb-4">Article Not Found</h1>
              <p className="text-white/60 mb-8">The article you're looking for doesn't exist.</p>
              <Link
                to="/blog"
                onClick={playClickSound}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-heading font-semibold rounded hover:bg-white/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
          </section>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  const seoSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160),
    image: post.thumbnailImage,
    datePublished: post.publicationDate,
    author: {
      '@type': 'Person',
      name: post.author || 'RED2 STUDIOS',
    },
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <ErrorBoundary>
      <SEOHead
        title={`${post.title} | RED2 STUDIOS`}
        description={post.excerpt || sanitizePlainText(post.content || '').substring(0, 160)}
        image={post.thumbnailImage}
        type="article"
        schema={seoSchema}
      />
      <div className="min-h-screen bg-black text-white">
        <Header />

        <section className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Breadcrumb
                items={[
                  { label: 'Home', to: '/' },
                  { label: 'Blog', to: '/blog' },
                  { label: post.title },
                ]}
                className="text-white/60"
              />
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                to="/blog"
                onClick={playClickSound}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </motion.div>

            {/* Article Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-white/40 uppercase tracking-wide flex-wrap mb-6">
                {post.publicationDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.publicationDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                )}
                {post.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-white/70 max-w-3xl">
                  {post.excerpt}
                </p>
              )}
            </motion.div>

            {/* Featured Image */}
            {post.thumbnailImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-lg mb-12 h-96 md:h-[500px] bg-white/5 flex items-center justify-center"
              >
                <Image
                  src={post.thumbnailImage}
                  alt={post.title || 'Blog post'}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-3xl"
            >
              {/* Main Content */}
              {post.content && (
                <div className="prose prose-invert max-w-none mb-12">
                  <div className="text-base text-white/80 leading-relaxed whitespace-pre-wrap">
                    {sanitizePlainText(post.content)}
                  </div>
                </div>
              )}

              {/* Video Section */}
              {post.videoUrl && (
                <div className="mb-12">
                  <VideoPlayer
                    url={post.videoUrl}
                    title={post.title || 'Blog video'}
                    className="rounded-lg"
                  />
                </div>
              )}

              {/* Share Buttons */}
              <div className="mb-12 pt-8 border-t border-white/10">
                <ShareButtons
                  title={post.title || 'Check out this article'}
                  url={currentUrl}
                  description={post.excerpt}
                  className="flex gap-4"
                />
              </div>

              {/* External Link */}
              {post.externalLink && (
                <div className="mt-12 pt-8 border-t border-white/10">
                  <a
                    href={post.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors font-medium"
                  >
                    Read Full Article
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </a>
                </div>
              )}
            </motion.div>

            {/* Related Articles Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-20 pt-12 border-t border-white/10"
            >
              <Link
                to="/blog"
                onClick={playClickSound}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Articles
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
