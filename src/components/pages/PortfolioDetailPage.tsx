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
import { playClickSound } from '@/lib/click-sound';

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Portfolio[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!id) return;

        // Load all projects for navigation
        const allData = await Promise.race([
          BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 50 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        setAllProjects(allData.items || []);

        // Load specific project
        const projectData = await Promise.race([
          BaseCrudService.getById<Portfolio>('portfolio', id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        setProject(projectData);
        
        // Preload gallery images
        if (projectData?.mainImage) {
          const img = new window.Image();
          img.src = projectData.mainImage;
        }
        if (projectData?.galleryImage1) {
          const img = new window.Image();
          img.src = projectData.galleryImage1;
        }
      } catch (error) {
        if (isMounted) {
          // Silently fail
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load image dimensions when selected image changes
  useEffect(() => {
    if (!selectedImage) {
      setImageDimensions(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = selectedImage;
  }, [selectedImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-[120rem] mx-auto px-8 py-32 text-center">
          <h1 className="text-4xl font-heading font-bold text-white mb-8">
            Project Not Found
          </h1>
          <Link
            to="/#portfolio"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-heading font-semibold text-sm tracking-wide hover:bg-white/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
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
    <div className="min-h-screen bg-black">
      <Header />

      {/* Immersive Viewer - Photography-First */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 p-2 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Dynamic container that scales to image aspect ratio */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : 'auto',
            }}
          >
            <Image
              src={selectedImage}
              alt="Full resolution image"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-[120rem] mx-auto px-8 py-24 md:py-32">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-16"
        >
          <Link
            to="/#portfolio"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-paragraph">Back to Portfolio</span>
          </Link>
        </motion.div>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-8 tracking-tighter">
            {project.projectName}
          </h1>
          <div className="flex flex-wrap gap-6 items-center">
            <span className="px-4 py-2 border border-white/20 text-white text-sm font-mono uppercase tracking-widest">
              {project.category}
            </span>
            {project.projectDate && (
              <span className="text-white/60 font-paragraph text-sm">
                {new Date(project.projectDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
            )}
          </div>
        </motion.div>

        {/* Main Image - Photography-First with Aspect Ratio Preservation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-20 w-full bg-black/50 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          onClick={() => project.mainImage && setSelectedImage(project.mainImage)}
        >
          <Image
            src={project.mainImage || 'https://static.wixstatic.com/media/e9d727_fcbd4072cbd84e428547c62bbddbf23c~mv2.png?originWidth=1152&originHeight=640'}
            alt={project.projectName}
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-24 mb-20">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-3xl font-heading font-bold text-white mb-8 tracking-tight">
              Project Overview
            </h2>
            <p className="text-base font-paragraph text-white/70 leading-relaxed mb-8">
              {project.fullDescription || project.shortDescription}
            </p>
          </motion.div>

          {/* Project Details - Minimal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="space-y-8 border-t border-white/10 pt-8">
              <div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
                  Category
                </p>
                <p className="text-base font-paragraph text-white">
                  {project.category}
                </p>
              </div>
              {project.projectDate && (
                <div>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
                    Date
                  </p>
                  <p className="text-base font-paragraph text-white">
                    {new Date(project.projectDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
                  Status
                </p>
                <p className="text-base font-paragraph text-white">
                  Completed
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gallery - Photography-First with Mixed Aspect Ratios */}
        {galleryImages.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-heading font-bold text-white mb-12 tracking-tight">
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-max">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="overflow-hidden bg-black/50 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 border-t border-white/10"
        >
          {prevProject ? (
            <Link
              to={`/portfolio/${prevProject._id}`}
              className="group flex items-center gap-4 p-8 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
              <div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">
                  Previous Project
                </p>
                <p className="text-lg font-heading font-semibold text-white group-hover:text-white/80 transition-colors">
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
              className="group flex items-center justify-end gap-4 p-8 hover:bg-white/5 transition-colors text-right"
            >
              <div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">
                  Next Project
                </p>
                <p className="text-lg font-heading font-semibold text-white group-hover:text-white/80 transition-colors">
                  {nextProject.projectName}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
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
