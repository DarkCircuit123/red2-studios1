import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function WorkPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 100 });
        setProjects(data.items || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="w-full max-w-[100rem] mx-auto px-6 md:px-8 py-20 pt-32">
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
            Explore our portfolio of projects and creative endeavors
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
              Loading projects...
            </motion.div>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {projects.map((project, index) => (
              <Link
                key={project._id}
                to={`/portfolio/${project._id}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group cursor-pointer h-full"
                >
                  <div className="overflow-hidden bg-white/5 hover:bg-white/10 transition-colors rounded-lg h-64">
                    {project.mainImage && (
                      <Image
                        src={project.mainImage}
                        alt={project.imageAltText || project.projectName || 'Project'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-heading font-bold text-white group-hover:text-primary transition-colors">
                      {project.projectName}
                    </h3>
                    {project.shortDescription && (
                      <p className="text-sm font-paragraph text-white/60 mt-2 line-clamp-2">
                        {project.shortDescription}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-96 flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-base font-paragraph text-white/50">
                No projects available yet
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
