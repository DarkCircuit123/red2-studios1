import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Tag, Filter } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';

export default function AIImageSearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [filteredItems, setFilteredItems] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const availableTags = ['Fashion', 'Editorial', 'Commercial', 'Lifestyle', 'Minimalist', 'Bold', 'Luxury'];

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
        setPortfolioItems(data.items || []);
        setFilteredItems(data.items || []);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPortfolio();
  }, []);

  useEffect(() => {
    let results = portfolioItems;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (item) =>
          item.projectName?.toLowerCase().includes(query) ||
          item.shortDescription?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      results = results.filter((item) =>
        selectedTags.some(
          (tag) =>
            item.category?.toLowerCase().includes(tag.toLowerCase()) ||
            item.projectName?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    setFilteredItems(results);
  }, [searchQuery, selectedTags, portfolioItems]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <section className="relative w-full py-24 md:py-32 bg-black">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-red-900" />
            <span className="text-xs font-mono text-red-900 uppercase tracking-widest">AI-Powered</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tighter">
            Smart Image Discovery
          </h2>
          <p className="text-base font-paragraph text-white/60 max-w-xl leading-relaxed">
            Intelligent search and tagging system. Find exactly what you're looking for with AI-powered image recognition and semantic search.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by style, mood, or project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-colors"
            />
          </div>
        </motion.div>

        {/* Tag Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Filter by Style</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableTags.map((tag) => (
              <motion.button
                key={tag}
                onClick={() => toggleTag(tag)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-300 ${
                  selectedTags.includes(tag)
                    ? 'bg-red-900 text-white border border-red-900'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:border-white/40'
                }`}
              >
                <Tag className="w-3 h-3 inline mr-2" />
                {tag}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Results Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-sm font-mono text-white/50 uppercase tracking-widest">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Results Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60 font-paragraph">Loading images...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <Image
                    src={item.mainImage || 'https://static.wixstatic.com/media/e9d727_403fade06e9145e09633cfb8f096c86e~mv2.png'}
                    alt={item.projectName || 'Project'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">
                    {item.category || 'Uncategorized'}
                  </p>
                  <h3 className="text-sm font-heading font-bold text-white truncate">
                    {item.projectName || 'Untitled'}
                  </h3>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60 font-paragraph">No images match your search. Try different keywords or filters.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
