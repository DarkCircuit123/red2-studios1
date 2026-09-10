import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Music, Image as ImageIcon, ArrowLeft, ChevronDown } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import SEOHeadAdvanced from '@/components/SEOHeadAdvanced';
import { BLOG_PAGE_SEO } from '@/lib/seo-page-configs';

interface BlogPhoto {
  _id: string;
  title?: string;
  caption?: string;
  imageFile?: string;
  displayOrder?: number;
  blogPostId?: string;
}

interface BlogVideo {
  _id: string;
  title?: string;
  videoUrl?: string;
  thumbnail?: string;
  description?: string;
  durationInSeconds?: number;
  blogPostId?: string;
}

interface BlogMusic {
  _id: string;
  title?: string;
  audioFileUrl?: string;
  artist?: string;
  genre?: string;
  durationSeconds?: number;
  blogPostReference?: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPosts[]>([]);
  const [photos, setPhotos] = useState<Record<string, BlogPhoto[]>>({});
  const [videos, setVideos] = useState<Record<string, BlogVideo[]>>({});
  const [music, setMusic] = useState<Record<string, BlogMusic[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Load blog posts sorted by publication date (newest first)
        const postsResult = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 100 });
        const publishedPosts = (postsResult.items || [])
          .filter(p => p.status === 'Published' || !p.status)
          .sort((a, b) => {
            const dateA = new Date(a.publicationDate || 0).getTime();
            const dateB = new Date(b.publicationDate || 0).getTime();
            return dateB - dateA;
          });
        setPosts(publishedPosts);

        // Load photos for each post
        const photosResult = await BaseCrudService.getAll<BlogPhoto>('blogphotos', {}, { limit: 500 });
        const photosByPost: Record<string, BlogPhoto[]> = {};
        (photosResult.items || []).forEach(photo => {
          if (photo.blogPostId) {
            if (!photosByPost[photo.blogPostId]) {
              photosByPost[photo.blogPostId] = [];
            }
            photosByPost[photo.blogPostId].push(photo);
          }
        });
        // Sort photos by display order
        Object.keys(photosByPost).forEach(postId => {
          photosByPost[postId].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        });
        setPhotos(photosByPost);

        // Load videos for each post
        const videosResult = await BaseCrudService.getAll<BlogVideo>('blogvideos', {}, { limit: 500 });
        const videosByPost: Record<string, BlogVideo[]> = {};
        (videosResult.items || []).forEach(video => {
          if (video.blogPostId) {
            if (!videosByPost[video.blogPostId]) {
              videosByPost[video.blogPostId] = [];
            }
            videosByPost[video.blogPostId].push(video);
          }
        });
        setVideos(videosByPost);

        // Load music for each post
        const musicResult = await BaseCrudService.getAll<BlogMusic>('blogmusic', {}, { limit: 500 });
        const musicByPost: Record<string, BlogMusic[]> = {};
        (musicResult.items || []).forEach(track => {
          if (track.blogPostReference) {
            if (!musicByPost[track.blogPostReference]) {
              musicByPost[track.blogPostReference] = [];
            }
            musicByPost[track.blogPostReference].push(track);
          }
        });
        setMusic(musicByPost);
      } catch (error) {
        console.error('Error loading blog content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHeadAdvanced
        title={BLOG_PAGE_SEO.title}
        description={BLOG_PAGE_SEO.description}
        keywords={BLOG_PAGE_SEO.keywords}
        canonical={BLOG_PAGE_SEO.canonical}
        ogType={BLOG_PAGE_SEO.ogType}
        twitterCard={BLOG_PAGE_SEO.twitterCard}
        author={BLOG_PAGE_SEO.author}
        breadcrumbs={BLOG_PAGE_SEO.breadcrumbs}
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Blog',
              name: 'Photography Blog',
              description: 'Photography tips, insights, and behind-the-scenes stories',
              creator: {
                '@type': 'Person',
                name: 'Jordan Michael Zuniga',
              },
              blogPosts: posts.map(post => ({
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.excerpt,
                image: post.thumbnailImage,
                datePublished: post.publicationDate,
                author: {
                  '@type': 'Person',
                  name: post.author || 'Jordan Michael Zuniga',
                },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: BLOG_PAGE_SEO.breadcrumbs?.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: crumb.url,
              })) || [],
            },
          ],
        }}
      />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Daily Stories
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              A chronological collection of photography insights, behind-the-scenes moments, and creative explorations.
            </p>
          </motion.div>

          {/* Blog Feed */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60 text-lg">No blog posts yet. Check back soon for fresh stories.</p>
            </motion.div>
          ) : (
            <div className="space-y-12">
              {posts.map((post, idx) => {
                const postPhotos = photos[post._id] || [];
                const postVideos = videos[post._id] || [];
                const postMusic = music[post._id] || [];
                const isExpanded = expandedPost === post._id;

                return (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-l-2 border-white/20 pl-8 pb-12"
                  >
                    {/* Date Badge */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 rounded-full bg-white/60" />
                      <time className="text-sm font-mono text-white/60 uppercase tracking-wide">
                        {formatDate(post.publicationDate)}
                      </time>
                    </div>

                    {/* Title and Excerpt */}
                    <div className="mb-6">
                      <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-lg text-white/70 max-w-3xl leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Featured Image */}
                    {post.thumbnailImage && (
                      <div className="mb-8 rounded-lg overflow-hidden bg-white/5">
                        <Image
                          src={post.thumbnailImage}
                          alt={post.title || 'Blog post'}
                          className="w-full h-96 object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    {post.content && (
                      <div className="mb-8 text-base text-white/60 leading-relaxed max-w-3xl">
                        {post.content}
                      </div>
                    )}

                    {/* Media Gallery */}
                    {(postPhotos.length > 0 || postVideos.length > 0 || postMusic.length > 0) && (
                      <div className="mb-8">
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                          className="flex items-center gap-3 text-white/80 hover:text-white transition-colors mb-6 group"
                        >
                          <span className="text-sm uppercase tracking-wide font-mono">
                            Media ({postPhotos.length + postVideos.length + postMusic.length})
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-8"
                          >
                            {/* Photos Gallery */}
                            {postPhotos.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4 text-white/60">
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="text-xs uppercase tracking-wide">Photos ({postPhotos.length})</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {postPhotos.map((photo, photoIdx) => (
                                    <motion.div
                                      key={photo._id}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: photoIdx * 0.05 }}
                                      className="group rounded-lg overflow-hidden bg-white/5"
                                    >
                                      {photo.imageFile && (
                                        <div className="relative overflow-hidden h-48">
                                          <Image
                                            src={photo.imageFile}
                                            alt={photo.caption || photo.title || 'Photo'}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          />
                                        </div>
                                      )}
                                      {photo.caption && (
                                        <div className="p-3 bg-white/5">
                                          <p className="text-xs text-white/60">{photo.caption}</p>
                                        </div>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Videos */}
                            {postVideos.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4 text-white/60">
                                  <Play className="w-4 h-4" />
                                  <span className="text-xs uppercase tracking-wide">Videos ({postVideos.length})</span>
                                </div>
                                <div className="space-y-4">
                                  {postVideos.map((video) => (
                                    <motion.div
                                      key={video._id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="group rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                                    >
                                      <div className="flex gap-4 p-4">
                                        {video.thumbnail && (
                                          <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0">
                                            <Image
                                              src={video.thumbnail}
                                              alt={video.title || 'Video'}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                                              <Play className="w-5 h-5 text-white" />
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-center">
                                          <h4 className="text-sm font-semibold text-white mb-1">{video.title}</h4>
                                          {video.description && (
                                            <p className="text-xs text-white/60 mb-2">{video.description}</p>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={video.videoUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-white/60 hover:text-white transition-colors"
                                            >
                                              Watch Video
                                            </a>
                                            {video.durationInSeconds && (
                                              <span className="text-xs text-white/40">
                                                • {formatDuration(video.durationInSeconds)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Music */}
                            {postMusic.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4 text-white/60">
                                  <Music className="w-4 h-4" />
                                  <span className="text-xs uppercase tracking-wide">Music ({postMusic.length})</span>
                                </div>
                                <div className="space-y-3">
                                  {postMusic.map((track) => (
                                    <motion.div
                                      key={track._id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <h4 className="text-sm font-semibold text-white">{track.title}</h4>
                                          <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                                            {track.artist && <span>{track.artist}</span>}
                                            {track.genre && <span>• {track.genre}</span>}
                                            {track.durationSeconds && (
                                              <span>• {formatDuration(track.durationSeconds)}</span>
                                            )}
                                          </div>
                                        </div>
                                        {track.audioFileUrl && (
                                          <audio
                                            controls
                                            className="w-32 h-6"
                                            src={track.audioFileUrl}
                                          />
                                        )}
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
