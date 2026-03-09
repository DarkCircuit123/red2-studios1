import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rss } from 'lucide-react';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
}

function RSSTickerSection() {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        setIsLoading(true);
        // Using Vogue RSS feed - one of the most active and prestigious fashion feeds
        const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.vogue.com/feed/rss';
        
        const response = await fetch(rssUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const feedItems = data.items.slice(0, 15).map((item: any) => ({
            title: item.title || 'Fashion Update',
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString(),
          }));
          setItems(feedItems);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
        // Fallback items if RSS fails - fashion-themed content
        setItems([
          {
            title: 'Spring Fashion Trends: What\'s Hot This Season',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            title: 'Luxury Brands Redefine Elegance for 2026',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            title: 'Sustainable Fashion: The Future of Style',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            title: 'Runway Highlights: Designer Collections Unveiled',
            link: '#',
            pubDate: new Date().toISOString(),
          },
          {
            title: 'Celebrity Style: Icons Setting Fashion Standards',
            link: '#',
            pubDate: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRSS();
  }, []);

  if (isLoading) {
    return null;
  }

  // Create an infinite loop of items for the ticker
  const tickerItems = [...items, ...items, ...items];

  return (
    <section className="relative w-full py-8 bg-black border-y border-white/10 overflow-hidden">
      <div className="relative">
        {/* RSS Header */}
        <div className="max-w-[120rem] mx-auto px-8 mb-6 flex items-center gap-3">
          <Rss className="w-4 h-4 text-red-900" />
          <span className="text-xs font-mono text-red-900 uppercase tracking-widest">
            Fashion Feed • Vogue
          </span>
        </div>

        {/* Ticker Container */}
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: [0, -100 * items.length + '%'] }}
            transition={{
              duration: items.length * 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {tickerItems.map((item, idx) => (
              <motion.a
                key={`${item.title}-${idx}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-8 py-4 text-white/70 hover:text-white transition-colors duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-sm font-paragraph group-hover:text-red-900 transition-colors duration-300">
                  {item.title}
                </span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(RSSTickerSection);
