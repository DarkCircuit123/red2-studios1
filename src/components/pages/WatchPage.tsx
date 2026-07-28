import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, Tag } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Reels {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  title?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  category?: string;
  featured?: boolean;
  order?: number;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [reel, setReel] = useState<Reels | null>(null);
  const [allReels, setAllReels] = useState<Reels[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Load all reels for sidebar
        const allResult = await Promise.race([
          BaseCrudService.getAll<Reels>('reels', {}, { limit: 50 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        const sorted = (allResult.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        setAllReels(sorted);

        // Load specific reel if ID provided
        if (id) {
          const result = await Promise.race([
            BaseCrudService.getById<Reels>('reels', id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          
          if (!isMounted) return;
          
          if (result) {
            setReel(result);
          } else {
            setNotFound(true);
          }
        } else if (sorted.length > 0) {
          // Default to first reel if no ID
          setReel(sorted[0]);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        if (isMounted) {
          setNotFound(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (notFound || !reel) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="max-w-[100rem] mx-auto px-8 w-full text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Video Not Found</h1>
            <p className="text-white/60 mb-8">The video you're looking for doesn't exist.</p>
            <Link
              to="/watch"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Videos
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/watch"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Videos
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              {/* Video Container */}
              <div className="relative overflow-hidden rounded-lg mb-8 bg-black aspect-video flex items-center justify-center border border-white/10">
                {reel.videoUrl ? (
                  <iframe
                    src={reel.videoUrl}
                    title={reel.title || 'Video'}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : reel.thumbnail ? (
                  <Image
                    src={reel.thumbnail}
                    alt={reel.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Play className="w-16 h-16 text-white/30" />
                    <p className="text-white/40">No video available</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
                  {reel.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
                  {reel.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {reel.duration}
                    </div>
                  )}
                  {reel.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {reel.category}
                    </div>
                  )}
                </div>

                {/* Watch Button */}
                {reel.videoUrl && (
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors font-medium mt-6"
                  >
                    <Play className="w-5 h-5" />
                    Watch on Platform
                  </a>
                )}
              </motion.div>
            </motion.div>

            {/* Sidebar - Video List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <h2 className="text-2xl font-heading font-bold text-white mb-6">More Videos</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {allReels.map((video) => (
                  <Link
                    key={video._id}
                    to={`/watch/${video._id}`}
                    className={`group block p-4 rounded-lg border transition-all duration-300 ${
                      reel._id === video._id
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {/* Thumbnail */}
                    {video.thumbnail && (
                      <div className="relative overflow-hidden rounded mb-3 aspect-video bg-white/5 flex items-center justify-center">
                        <Image
                          src={video.thumbnail}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-heading font-bold text-white text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>

                    {/* Duration */}
                    {video.duration && (
                      <p className="text-xs text-white/40 mt-2">{video.duration}</p>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
