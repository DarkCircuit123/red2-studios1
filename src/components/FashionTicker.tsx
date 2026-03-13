import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities';

interface FashionNews {
  id: string;
  title: string;
  link: string;
  pubDate: string;
}

export default function FashionTicker() {
  const [news, setNews] = useState<FashionNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFashionNews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch blog posts from CMS
        const result = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 50 });
        
        if (result.items && result.items.length > 0) {
          const blogNews: FashionNews[] = result.items.map((post) => ({
            id: post._id,
            title: post.title || 'Untitled Article',
            link: `/blog#${post._id}`,
            pubDate: post.publicationDate ? new Date(post.publicationDate).toISOString() : new Date().toISOString(),
          }));
          
          setNews(blogNews);
        } else {
          setNews([]);
        }
      } catch (err) {
        setError('Unable to load articles');
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFashionNews();

    // Refresh every 30 minutes
    const interval = setInterval(fetchFashionNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && news.length === 0) {
    return null;
  }

  // Show message if no articles
  if (!isLoading && news.length === 0) {
    return (
      <div className="w-full bg-black border-t border-b border-gray-800 py-2 overflow-hidden">
        <div className="flex items-center gap-4 px-4">
          <div className="flex-shrink-0">
            <span className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap">
              Articles
            </span>
          </div>
          <div className="flex-1 text-xs text-gray-500">
            No articles available yet
          </div>
        </div>
      </div>
    );
  }

  const duplicatedNews = [...news, ...news]; // Duplicate for seamless loop

  return (
    <div className="w-full bg-black border-t border-b border-gray-800 py-2 overflow-hidden">
      <div className="flex items-center gap-4 px-4">
        {/* Label */}
        <div className="flex-shrink-0">
          <span className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap">
            Articles
          </span>
        </div>

        {/* Ticker */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-8"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {duplicatedNews.map((item, idx) => (
              <a
                key={`${item.id}-${idx}`}
                href={item.link}
                className="flex-shrink-0 text-xs text-gray-300 hover:text-primary transition-colors duration-300 whitespace-nowrap cursor-pointer"
              >
                <span className="text-gray-600 mr-2">•</span>
                {item.title}
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
