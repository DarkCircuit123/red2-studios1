import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Share2, Clock, AlertCircle, RotateCcw, Twitter, Linkedin, Facebook, Copy } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoPlayer from '@/components/VideoPlayer';

// Calculate reading time
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Sanitize and render HTML/markdown content with enhanced security
function ContentRenderer({ content }: { content: string }) {
  const sanitizedContent = useMemo(() => {
    // Remove script tags and event handlers
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*[\"'][^\"']*[\"']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '');
    return sanitized;
  }, [content]);

  return (
    <div className="prose prose-invert max-w-none mb-12 text-base text-white/80 leading-relaxed">
      <div className="space-y-4 whitespace-pre-wrap break-words">
        {sanitizedContent}
      </div>
    </div>
  );
}

// Validate URL - hardened to block non-http protocols
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Share buttons component
function ShareButtons({ post }: { post: BlogPosts }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(post.title || 'Check out this article');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: currentUrl,
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {/* X (Twitter) */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm"
        title="Share on X"
      >
        <Twitter className="w-4 h-4" />
        <span className="hidden sm:inline">X</span>
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
        <span className="hidden sm:inline">LinkedIn</span>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
        <span className="hidden sm:inline">Facebook</span>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm"
        title="Copy link to clipboard"
      >
        <Copy className="w-4 h-4" />
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
      </button>

      {/* Native Share */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      )}
    </div>
  );
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPosts | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPosts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadPost = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!id) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const result = await BaseCrudService.getById<BlogPosts>('blogposts', id);
        if (result) {
          setPost(result);

          // Load related articles - limit to 3, filter by same category if available
          if (result.content) {
            try {
              const allPosts = await BaseCrudService.getAll<BlogPosts>('blogposts', [], { limit: 100 });
              const related = allPosts.items
                .filter((p) => p._id !== id && p.content)
                .slice(0, 3);
              setRelatedPosts(related);
            } catch {
              // Silently fail related posts load
            }
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Failed to load article. Please try again.');
        setNotFound(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      controller.abort();
    };
  }, [id]);

  const readingTime = useMemo(() => {
    return post?.content ? calculateReadingTime(post.content) : 0;
  }, [post?.content]);

  // SEO Meta Tags and JSON-LD
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Blog`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.excerpt || post.title || '');
      }

      // JSON-LD Schema for BlogPosting
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.thumbnailImage,
        datePublished: post.publicationDate,
        author: {
          '@type': 'Person',
          name: post.author || 'Author',
        },
      };
      const scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptTag);

      return () => {
        if (document.head.contains(scriptTag)) {
          document.head.removeChild(scriptTag);
        }
      };
    } else if (notFound) {
      // Soft 404 - noindex
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) {
        robots.setAttribute('content', 'noindex, nofollow');
      }
    }
  }, [post, notFound]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-heading font-bold mb-4">Error Loading Article</h1>
            <p className="text-white/60 mb-8">{error}</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded transition-colors font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Blog
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Article Not Found</h1>
            <p className="text-white/60 mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <article className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Breadcrumb Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-sm text-white/60"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{post.title}</span>
          </motion.nav>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Blog
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.header
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
                  <time dateTime={new Date(post.publicationDate).toISOString()}>
                    {new Date(post.publicationDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                </div>
              )}
              {post.author && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
              )}
              {readingTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime} min read</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-white/70 max-w-3xl mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Share Buttons */}
            {post && <ShareButtons post={post} />}
          </motion.header>

          {/* Featured Image with LCP optimization */}
          {post.thumbnailImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-lg mb-12 bg-white/5"
            >
              <div className="aspect-video w-full">
                <Image
                  src={post.thumbnailImage}
                  alt={post.title || 'Blog post featured image'}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl"
          >
            {/* Video Section - Inline player */}
            {post.videoUrl && <VideoPlayer url={post.videoUrl} title={post.title} />}

            {/* Content with sanitization */}
            {post.content && <ContentRenderer content={post.content} />}

            {/* External Link with validation */}
            {post.externalLink && isValidUrl(post.externalLink) && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <a
                  href={post.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Read Full Article
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </motion.main>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-20 pt-12 border-t border-white/10"
            >
              <h2 className="text-3xl font-heading font-bold mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost._id}
                    to={`/blog/${relatedPost._id}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-lg mb-4 bg-white/5 aspect-video">
                      {relatedPost.thumbnailImage && (
                        <Image
                          src={relatedPost.thumbnailImage}
                          alt={relatedPost.title || 'Related article'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    {relatedPost.publicationDate && (
                      <p className="text-sm text-white/40 mt-2">
                        {new Date(relatedPost.publicationDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Back to Blog */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to All Articles
            </Link>
          </motion.div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
