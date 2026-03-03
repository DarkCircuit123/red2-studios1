import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Portfolio[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;

        // Load all projects for navigation
        const allData = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 });
        setAllProjects(allData.items || []);

        // Load specific project
        const projectData = await BaseCrudService.getById<Portfolio>('portfolio', id);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <div className="max-w-[100rem] mx-auto px-6 py-32 text-center">
          <h1 className="text-4xl font-heading font-bold text-foreground dark:text-white mb-4">
            Project Not Found
          </h1>
          <Link
            to="/#portfolio"
            className="inline-block px-6 py-3 bg-primary dark:bg-primary-foreground text-white dark:text-foreground font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Portfolio
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentIndex = allProjects.findIndex((p) => p._id === id);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  const galleryImages = [
    project.mainImage,
    project.galleryImage1,
    project.galleryImage2,
    project.galleryImage3,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      {/* Lightbox */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <Image
            src={selectedImage}
            alt="Full size"
            className="max-w-4xl max-h-[90vh] object-contain"
          />
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-6 py-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link
            to="/#portfolio"
            className="inline-flex items-center gap-2 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </motion.div>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground dark:text-white mb-4">
            {project.projectName}
          </h1>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground rounded-full text-sm font-heading font-semibold">
              {project.category}
            </span>
            {project.projectDate && (
              <span className="text-foreground/60 dark:text-gray-400 font-paragraph">
                {new Date(project.projectDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
            )}
          </div>
        </motion.div>

        {/* Main Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 aspect-video cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => project.mainImage && setSelectedImage(project.mainImage)}
        >
          <Image
            src={project.mainImage || 'https://static.wixstatic.com/media/e9d727_fcbd4072cbd84e428547c62bbddbf23c~mv2.png?originWidth=1152&originHeight=640'}
            alt={project.projectName}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-heading font-bold text-foreground dark:text-white mb-4">
              Project Overview
            </h2>
            <p className="text-lg font-paragraph text-foreground/70 dark:text-gray-300 leading-relaxed mb-6">
              {project.fullDescription || project.shortDescription}
            </p>
          </motion.div>

          {/* Project Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <p className="text-xs font-heading font-semibold text-foreground/60 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Category
                </p>
                <p className="text-lg font-paragraph text-foreground dark:text-white">
                  {project.category}
                </p>
              </div>
              {project.projectDate && (
                <div>
                  <p className="text-xs font-heading font-semibold text-foreground/60 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Date
                  </p>
                  <p className="text-lg font-paragraph text-foreground dark:text-white">
                    {new Date(project.projectDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-heading font-semibold text-foreground/60 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Status
                </p>
                <p className="text-lg font-paragraph text-foreground dark:text-white">
                  Completed
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gallery */}
        {galleryImages.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-heading font-bold text-foreground dark:text-white mb-6">
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-foreground/10 dark:border-gray-700"
        >
          {prevProject ? (
            <Link
              to={`/portfolio/${prevProject._id}`}
              className="group flex items-center gap-4 p-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/60 dark:text-gray-400 group-hover:text-foreground dark:group-hover:text-white transition-colors" />
              <div>
                <p className="text-xs font-heading font-semibold text-foreground/60 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Previous Project
                </p>
                <p className="text-lg font-heading font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors">
                  {prevProject.projectName}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextProject ? (
            <Link
              to={`/portfolio/${nextProject._id}`}
              className="group flex items-center justify-end gap-4 p-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
            >
              <div>
                <p className="text-xs font-heading font-semibold text-foreground/60 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Next Project
                </p>
                <p className="text-lg font-heading font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors">
                  {nextProject.projectName}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/60 dark:text-gray-400 group-hover:text-foreground dark:group-hover:text-white transition-colors" />
            </Link>
          ) : (
            <div />
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
