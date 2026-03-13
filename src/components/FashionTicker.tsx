import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

        // Using multiple fashion RSS feeds
        const feedUrls = [
          'https://feeds.vogue.com/vogue_en',
          'https://www.voguebusiness.com/feed',
          'https://feeds.bloomberg.com/markets/news.rss',
        ];

        const allNews: FashionNews[] = [];

        for (const url of feedUrls) {
          try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            if (!response.ok) continue;

            const data = await response.json();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, 'text/xml');

            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
              continue;
            }

            const items = xmlDoc.getElementsByTagName('item');
            for (let i = 0; i < Math.min(items.length, 5); i++) {
              const item = items[i];
              const title = item.getElementsByTagName('title')[0]?.textContent || '';
              const link = item.getElementsByTagName('link')[0]?.textContent || '';
              const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';

              if (title && link) {
                allNews.push({
                  id: `${url}-${i}`,
                  title: title.substring(0, 100),
                  link,
                  pubDate,
                });
              }
            }
          } catch (err) {
            // Continue to next feed if one fails
            continue;
          }
        }

        if (allNews.length === 0) {
          // Fallback data if feeds fail
          setNews([
            {
              id: '1',
              title: 'Fashion Week Highlights: Spring/Summer 2026 Collections Unveiled',
              link: '#',
              pubDate: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'Sustainable Fashion Trends Dominate Global Market',
              link: '#',
              pubDate: new Date().toISOString(),
            },
            {
              id: '3',
              title: 'Luxury Brands Embrace Digital Innovation',
              link: '#',
              pubDate: new Date().toISOString(),
            },
            {
              id: '4',
              title: 'Street Style Evolution: What Designers Are Watching',
              link: '#',
              pubDate: new Date().toISOString(),
            },
            {
              id: '5',
              title: 'Emerging Designers Challenge Industry Standards',
              link: '#',
              pubDate: new Date().toISOString(),
            },
          ]);
        } else {
          setNews(allNews.slice(0, 10));
        }
      } catch (err) {
        setError('Unable to load fashion news');
        // Set fallback data
        setNews([
          {
            id: '1',
            title: 'Fashion Week Highlights: Spring/Summer 2026 Collections Unveiled',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Sustainable Fashion Trends Dominate Global Market',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Luxury Brands Embrace Digital Innovation',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Street Style Evolution: What Designers Are Watching',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            id: '5',
            title: 'Emerging Designers Challenge Industry Standards',
            link: '#',
            pubDate: new Date().toISOString(),
          },
        ]);
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

  const duplicatedNews = [...news, ...news]; // Duplicate for seamless loop

  return (
    <div className="w-full bg-black border-t border-b border-gray-800 py-2 overflow-hidden">
      <div className="flex items-center gap-4 px-4">
        {/* Label */}
        <div className="flex-shrink-0">
          <span className="text-xs font-heading font-bold text-primary tracking-widest uppercase whitespace-nowrap">
            Fashion News
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
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-xs text-gray-300 hover:text-primary transition-colors duration-300 whitespace-nowrap"
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
