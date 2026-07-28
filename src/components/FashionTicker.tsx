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
        let successCount = 0;

        for (const feed of feeds) {
          try {
            const response = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`, {
              signal: AbortSignal.timeout(8000), // 8 second timeout per feed
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.items && Array.isArray(data.items)) {
                const feedNews = data.items.slice(0, 5).map((item: any, idx: number) => ({
                  id: `${feed.source}-${idx}-${Date.now()}`,
                  title: item.title || 'Untitled',
                  link: item.link || item.url || '#',
                  pubDate: item.pubDate || item.published || new Date().toISOString(),
                  source: feed.source,
                }));
                allNews.push(...feedNews);
                successCount++;
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
        <div className="flex-shrink-0">
          <motion.span 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap"
          >
            🔴 Live News
          </motion.span>
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
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-xs text-gray-300 hover:text-primary transition-colors duration-300 whitespace-nowrap cursor-pointer group"
              >
                <span className="text-gray-600 mr-2">•</span>
                <span className="group-hover:underline">{item.title}</span>
                <span className="text-gray-600 ml-1 text-[10px]">({item.source})</span>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
