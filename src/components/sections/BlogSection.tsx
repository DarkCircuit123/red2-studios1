import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/click-sound';

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPosts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      try {
        const result = await Promise.race([
          BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 6 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        if (result?.items && Array.isArray(result.items)) {
          setPosts(result.items);
        } else {
          setPosts([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading blog posts:', error);
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPosts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || posts.length === 0) return null;

  return (
    <section id="blog" className="relative w-full py-24 md:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-heading font-black text-white mb-4 uppercase">
            Stories & Insights
          </h2>
          <p className="text-lg text-white/60 max-w-2xl">
            Behind-the-scenes stories, photography tips, and creative insights from our latest shoots.
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <motion.article
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
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
                <div className="flex items-center gap-4 text-xs text-white/40 uppercase tracking-wide">
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
                <h3 className="text-xl font-heading font-bold text-white group-hover:text-white/80 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-sm text-white/60 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Read More Link */}
                <div className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white transition-colors pt-2">
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            to="/blog"
            onClick={playClickSound}
            className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 text-white font-heading font-bold text-sm tracking-widest uppercase hover:border-white/40 hover:bg-white/5 transition-all duration-300"
          >
            View All Stories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
