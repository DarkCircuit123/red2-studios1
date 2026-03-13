import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';

interface FashionItem {
  title: string;
  link: string;
  pubDate: string;
  category?: string;
}

export default function RSSTickerSection() {
  const [items, setItems] = useState<FashionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFashionNews = async () => {
      try {
        setIsLoading(true);
        // Using multiple fashion RSS feeds via CORS proxy
        const fashionFeeds = [
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.vogue.com/feed/rss',
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.harpersbazaar.com/feed/rss.xml',
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.wwd.com/feed/rss/news.xml',
        ];

        let allItems: FashionItem[] = [];

        // Fetch from multiple sources
        for (const feedUrl of fashionFeeds) {
          try {
            const response = await fetch(feedUrl);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
              const feedItems = data.items.slice(0, 8).map((item: any) => ({
                title: item.title || 'Fashion Update',
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                category: extractCategory(item.title),
              }));
              allItems = [...allItems, ...feedItems];
            }
          } catch (err) {
            console.error('Error fetching feed:', err);
          }
        }

        // If we got items, use them; otherwise use fallback
        if (allItems.length > 0) {
          setItems(allItems.slice(0, 25));
        } else {
          setItems(getFallbackItems());
        }
      } catch (err) {
        console.error('Error fetching fashion news:', err);
        setItems(getFallbackItems());
      } finally {
        setIsLoading(false);
      }
    };

    fetchFashionNews();

    // Refresh feed every 5 minutes
    const interval = setInterval(fetchFashionNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getFallbackItems = (): FashionItem[] => [
    {
      title: 'Spring/Summer 2026 Trends: Minimalism Meets Bold Colors',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Trends',
    },
    {
      title: 'Sustainable Fashion: The Future of Luxury',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Sustainability',
    },
    {
      title: 'Paris Fashion Week: The Most Anticipated Collections',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Events',
    },
    {
      title: 'The Return of Y2K: How Gen Z is Redefining Nostalgia',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Style',
    },
    {
      title: 'Designer Collaborations: Breaking Boundaries in Fashion',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'News',
    },
    {
      title: 'Maximalist Accessories: Making a Statement',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Accessories',
    },
    {
      title: 'The Evolution of Streetwear in High Fashion',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Culture',
    },
    {
      title: 'Emerging Designers to Watch This Season',
      link: '#',
      pubDate: new Date().toISOString(),
      category: 'Designers',
    },
  ];

  if (isLoading && items.length === 0) {
    return null;
  }

  // Create an infinite loop of items for the ticker
  const tickerItems = [...items, ...items, ...items];

  return (
    <section className="relative w-full py-6 md:py-8 bg-gradient-to-r from-black via-black to-black border-y border-primary/20 overflow-hidden">
      <div className="relative">
        {/* Header with animated accent */}
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 md:px-8 mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-xs font-mono text-primary uppercase tracking-widest font-bold">
              Fashion News & Trends
            </span>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          </div>
          <p className="text-xs text-white/40 font-paragraph">
            Real-time updates from the fashion world
          </p>
        </div>

        {/* Ticker Container with gradient overlay */}
        <div className="relative overflow-hidden">
          {/* Left gradient overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          {/* Right gradient overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-6 whitespace-nowrap py-4"
            animate={{ x: [0, -100 * items.length + '%'] }}
            transition={{
              duration: Math.max(items.length * 6, 30),
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
                className="flex-shrink-0 px-6 py-3 group cursor-pointer relative"
                whileHover={{ scale: 1.05 }}
              >
                {/* Background accent on hover */}
                <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-1">
                  {/* Category badge */}
                  {item.category && (
                    <div className="inline-block mb-2">
                      <span className="text-xs font-mono text-primary/70 group-hover:text-primary transition-colors duration-300 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <span className="text-sm md:text-base font-paragraph text-white/70 group-hover:text-white transition-colors duration-300 block leading-tight">
                    {item.title}
                  </span>

                  {/* Underline accent */}
                  <div className="h-0.5 bg-gradient-to-r from-primary to-transparent w-0 group-hover:w-full transition-all duration-300 mt-2" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </section>
  );
}

function extractCategory(title: string): string {
  const keywords: { [key: string]: string } = {
    trend: 'Trends',
    sustainable: 'Sustainability',
    fashion week: 'Events',
    designer: 'Designers',
    collection: 'Collections',
    style: 'Style',
    accessory: 'Accessories',
    luxury: 'Luxury',
    streetwear: 'Streetwear',
    runway: 'Runway',
  };

  const lowerTitle = title.toLowerCase();
  for (const [key, category] of Object.entries(keywords)) {
    if (lowerTitle.includes(key)) {
      return category;
    }
  }

  return 'News';
}
