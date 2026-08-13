import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FashionNews {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// Fallback stories to show if RSS feeds fail
const FALLBACK_NEWS: FashionNews[] = [
  {
    id: 'fallback-1',
    title: 'Fashion Week Highlights: Spring/Summer 2025 Collections',
    link: 'https://www.vogue.com',
    source: 'Vogue',
    pubDate: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    title: 'Photography Trends: Mastering Natural Light',
    link: 'https://www.sonyalpharumors.com',
    source: 'Sony Alpha',
    pubDate: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    title: 'Sustainable Fashion: The Future of the Industry',
    link: 'https://www.fashionnetwork.com',
    source: 'Fashion Network',
    pubDate: new Date().toISOString(),
  },
  {
    id: 'fallback-4',
    title: 'Celebrity Style: Red Carpet Moments',
    link: 'https://www.thefashionspot.com',
    source: 'The Fashion Spot',
    pubDate: new Date().toISOString(),
  },
  {
    id: 'fallback-5',
    title: 'New Camera Gear: Latest Releases',
    link: 'https://www.sonyalpharumors.com',
    source: 'Sony Alpha',
    pubDate: new Date().toISOString(),
  },
];

export default function FashionTicker() {
  const [news, setNews] = useState<FashionNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchFashionNews = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // RSS feeds from real fashion and media sources
        const feeds = [
          { url: 'https://feeds.vogue.com/vogue/index.xml', source: 'Vogue' },
          { url: 'https://www.sonyalpharumors.com/feed/', source: 'Sony Alpha' },
          { url: 'https://www.fashionnetwork.com/rss/news.xml', source: 'Fashion Network' },
          { url: 'https://www.thefashionspot.com/feed/', source: 'The Fashion Spot' },
        ];

        const allNews: FashionNews[] = [];

        for (const feed of feeds) {
          try {
            // FIX: Use manual timeout instead of AbortSignal.timeout() for compatibility
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`, {
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              // Verify response is JSON before parsing
              const contentType = response.headers.get('content-type');
              if (!contentType?.includes('application/json')) {
                console.warn(`Invalid response type from ${feed.source}:`, contentType);
                continue;
              }

              let data;
              try {
                data = await response.json();
              } catch (parseErr) {
                console.warn(`Failed to parse ${feed.source} response:`, parseErr);
                continue;
              }

              if (data.items && Array.isArray(data.items)) {
                const feedNews = data.items.slice(0, 5).map((item: any, idx: number) => ({
                  id: `${feed.source}-${idx}-${Date.now()}`,
                  title: item.title || 'Untitled',
                  link: item.link || item.url || '#',
                  pubDate: item.pubDate || item.published || new Date().toISOString(),
                  source: feed.source,
                }));
                allNews.push(...feedNews);
              }
            }
          } catch (err) {
            console.warn(`Error fetching ${feed.source} feed:`, err);
            // Continue with other feeds even if one fails
          }
        }

        // If we got some stories, use them; otherwise use fallback
        let finalNews = allNews;
        if (allNews.length === 0) {
          console.warn('No RSS feeds succeeded, using fallback stories');
          finalNews = FALLBACK_NEWS;
          setHasError(true);
        }

        // Shuffle and limit to 30 stories for the ticker
        const shuffled = finalNews.sort(() => Math.random() - 0.5).slice(0, 30);
        setNews(shuffled);
      } catch (err) {
        console.error('Error fetching fashion news:', err);
        setNews(FALLBACK_NEWS);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFashionNews();

    // Refresh every 30 minutes
    const interval = setInterval(fetchFashionNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Always show the ticker if we have news (even if loading or error)
  if (news.length === 0) {
    return null;
  }

  const duplicatedNews = [...news, ...news]; // Duplicate for seamless loop

  return (
    <div className="w-full bg-black border-t border-b border-gray-800 py-2 overflow-hidden">
      <div className="flex items-center gap-4 px-4">
        {/* Label */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex-shrink-0 text-xs font-heading font-bold text-primary uppercase tracking-widest whitespace-nowrap"
        >
          📰 Fashion News
        </motion.div>

        {/* Ticker */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            animate={{ x: [0, -100 * news.length + '%'] }}
            transition={{
              duration: news.length * 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="flex gap-8 whitespace-nowrap"
          >
            {duplicatedNews.map((item, idx) => (
              <motion.a
                key={`${item.id}-${idx}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 inline-block text-sm text-gray-300 hover:text-primary transition-colors duration-200 line-clamp-1 max-w-xs"
              >
                <span className="text-primary font-bold mr-2">{item.source}:</span>
                {item.title}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
