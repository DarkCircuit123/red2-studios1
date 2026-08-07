import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioWithImages } from '@/lib/portfolio-service';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PortfolioGroup {
  category: string;
  projects: PortfolioWithImages[];
}

export default function WorkPage() {
  const { portfolios, isLoading } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Group portfolios by category
  const groupedPortfolios = useMemo(() => {
    const groups: { [key: string]: PortfolioGroup } = {};

    portfolios.forEach((portfolio) => {
      const category = portfolio.category || 'Uncategorized';

      if (!groups[category]) {
        groups[category] = {
          category,
          projects: [],
        };
      }

      groups[category].projects.push(portfolio);
    });

    return groups;
  }, [portfolios]);

  // Get categories
  const categories = useMemo(() => Object.keys(groupedPortfolios).sort(), [groupedPortfolios]);

  // Set initial category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Get projects for the selected category
  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedPortfolios[selectedCategory]?.projects || [];
  }, [selectedCategory, groupedPortfolios]);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="w-full max-w-[100rem] mx-auto px-6 md:px-8 py-20">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white tracking-tight mb-6">
            Our Work
          </h1>
          <p className="text-lg font-paragraph text-white/60 max-w-2xl">
            A collection of our creative photography and visual projects
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="w-full h-96 bg-black flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/50 text-sm tracking-widest uppercase"
            >
              Loading gallery...
            </motion.div>
          </div>
        )}

        {/* Gallery Navigation and Content */}
        {!isLoading && portfolios.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Category Tabs */}
            <div className="mb-12">
              {categories.length > 0 && (
                <div>
                  <p className="text-sm font-paragraph text-white/40 uppercase tracking-widest mb-4">
                    Category
                  </p>
                  <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="w-full"
                  >
                    <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1 flex flex-wrap gap-1 h-auto">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white transition-colors"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Project Count */}
            <div className="mb-8">
              <p className="text-sm font-paragraph text-white/40">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} in this category
              </p>
            </div>

            {/* Project Gallery - Grid Layout */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="group cursor-pointer overflow-hidden bg-white/5 hover:bg-white/10 transition-colors rounded-lg"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={project.mainImage || (project.images?.[0]?.imageUrl) || 'https://static.wixstatic.com/media/e9d727_3b2fe8360fd9440eb9b25e69e28303e9~mv2.png?originWidth=384&originHeight=384'}
                        alt={project.projectName || 'Portfolio project'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                        height={400}
                      />
                    </div>
                    <div className="p-4 bg-black/50">
                      <p className="text-sm font-heading font-bold text-white/80 truncate">
                        {project.projectName}
                      </p>
                      {project.shortDescription && (
                        <p className="text-xs font-paragraph text-white/50 truncate mt-1">
                          {project.shortDescription}
                        </p>
                      )}
                      {project.images && project.images.length > 0 && (
                        <p className="text-xs font-paragraph text-white/40 mt-2">
                          {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-96 flex items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-base font-paragraph text-white/50">
                    No projects in this category yet
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && portfolios.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50">
                No projects available yet. Start creating from the Admin Panel!
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
