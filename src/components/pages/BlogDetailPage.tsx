import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Play } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPosts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      try {
        if (!id) {
          setNotFound(true);
          return;
        }
        const result = await Promise.race([
          BaseCrudService.getById<BlogPosts>('blogposts', id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        if (result) {
          setPost(result);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPost();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Article Not Found</h1>
            <p className="text-white/60 mb-8">The article you're looking for doesn't exist.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
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
                  {post.content}
                </div>
              </div>
            )}

            {/* Video Section */}
            {post.videoUrl && (
              <div className="mb-12">
                <a
                  href={post.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Watch Video
                </a>
              </div>
            )}

            {/* External Link */}
            {post.externalLink && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <a
                  href={post.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
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
  );
}
