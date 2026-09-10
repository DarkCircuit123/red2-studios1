import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Plus, ChevronDown, Upload, X } from 'lucide-react';

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

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPosts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPosts | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [photos, setPhotos] = useState<Record<string, BlogPhoto[]>>({});
  const [videos, setVideos] = useState<Record<string, BlogVideo[]>>({});
  const [music, setMusic] = useState<Record<string, BlogMusic[]>>({});

  // Form states
  const [formData, setFormData] = useState<Partial<BlogPosts>>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    status: 'Draft',
    featured: false,
  });

  useEffect(() => {
    loadBlogContent();
  }, []);

  const loadBlogContent = async () => {
    try {
      setIsLoading(true);
      const postsResult = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 100 });
      setPosts(postsResult.items || []);

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
      setPhotos(photosByPost);

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

  const handleSavePost = async () => {
    try {
      if (editingPost?._id) {
        await BaseCrudService.update('blogposts', {
          _id: editingPost._id,
          ...formData,
        });
      } else {
        await BaseCrudService.create('blogposts', {
          _id: crypto.randomUUID(),
          ...formData,
          publicationDate: new Date(),
        });
      }
      setEditingPost(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        author: '',
        status: 'Draft',
        featured: false,
      });
      setShowNewPostForm(false);
      loadBlogContent();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post and all its media?')) {
      try {
        console.log('[BlogManager] ===== DELETE POST REQUEST =====');
        console.log('[BlogManager] Post ID:', postId);

        const response = await fetch('/api/admin/blog-delete-secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });

        console.log('[BlogManager] Response status:', response.status);
        console.log('[BlogManager] Response headers:', {
          contentType: response.headers.get('content-type'),
        });

        // Parse JSON response
        let data: any;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[BlogManager] Failed to parse JSON response:', parseError);
          const text = await response.text();
          console.error('[BlogManager] Response text:', text.substring(0, 200));
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }

        console.log('[BlogManager] Delete response data:', data);

        if (!response.ok) {
          console.error('[BlogManager] Response not OK:', {
            status: response.status,
            error: data.error,
            id: data.id,
          });
          throw new Error(data.error || `Server error (${response.status}): Failed to delete post`);
        }

        if (!data.success) {
          console.error('[BlogManager] Delete not successful:', data);
          throw new Error(data.error || 'Delete operation failed');
        }

        console.log('[BlogManager] ✓ Delete successful, reloading content');
        await loadBlogContent();
      } catch (error) {
        console.error('[BlogManager] ✗ Error deleting post:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete post');
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      console.log('[BlogManager] Deleting photo:', photoId);
      const response = await fetch('/api/admin/blog-delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: 'photo',
          mediaId: photoId,
        }),
      });

      // Safely parse response - check content-type first
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[BlogManager] Failed to parse JSON response:', parseError);
          const text = await response.text();
          console.error('[BlogManager] Response text:', text.substring(0, 200));
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.error('[BlogManager] Non-JSON response received:', contentType, text.substring(0, 200));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of JSON: ${text.substring(0, 100)}`);
      }

      console.log('[BlogManager] Delete photo response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status}): Failed to delete photo`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Delete operation failed');
      }

      console.log('[BlogManager] Photo deleted successfully, reloading');
      await loadBlogContent();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete photo');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      console.log('[BlogManager] Deleting video:', videoId);
      const response = await fetch('/api/admin/blog-delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: 'video',
          mediaId: videoId,
        }),
      });

      // Safely parse response - check content-type first
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[BlogManager] Failed to parse JSON response:', parseError);
          const text = await response.text();
          console.error('[BlogManager] Response text:', text.substring(0, 200));
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.error('[BlogManager] Non-JSON response received:', contentType, text.substring(0, 200));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of JSON: ${text.substring(0, 100)}`);
      }

      console.log('[BlogManager] Delete video response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status}): Failed to delete video`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Delete operation failed');
      }

      console.log('[BlogManager] Video deleted successfully, reloading');
      await loadBlogContent();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete video');
    }
  };

  const handleDeleteMusic = async (musicId: string) => {
    try {
      console.log('[BlogManager] Deleting music:', musicId);
      const response = await fetch('/api/admin/blog-delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: 'music',
          mediaId: musicId,
        }),
      });

      // Safely parse response - check content-type first
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[BlogManager] Failed to parse JSON response:', parseError);
          const text = await response.text();
          console.error('[BlogManager] Response text:', text.substring(0, 200));
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.error('[BlogManager] Non-JSON response received:', contentType, text.substring(0, 200));
        throw new Error(`Server returned ${contentType || 'unknown'} instead of JSON: ${text.substring(0, 100)}`);
      }

      console.log('[BlogManager] Delete music response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status}): Failed to delete music`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Delete operation failed');
      }

      console.log('[BlogManager] Music deleted successfully, reloading');
      await loadBlogContent();
    } catch (error) {
      console.error('Error deleting music:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete music');
    }
  };

  const handleEditPost = (post: BlogPosts) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      status: post.status,
      featured: post.featured,
    });
    setShowNewPostForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-line border-t-admin-text rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-admin-text">Blog Manager</h2>
        <button
          onClick={() => {
            setShowNewPostForm(!showNewPostForm);
            setEditingPost(null);
            setFormData({
              title: '',
              excerpt: '',
              content: '',
              author: '',
              status: 'Draft',
              featured: false,
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-admin-raise border border-admin-line-2 rounded text-admin-text hover:bg-admin-surface transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* New/Edit Post Form */}
      {showNewPostForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-admin-surface border border-admin-line-2 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-admin-text">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h3>
            <button
              onClick={() => {
                setShowNewPostForm(false);
                setEditingPost(null);
              }}
              className="text-admin-dim hover:text-admin-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-admin-dim mb-2">Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-admin-bg border border-admin-line rounded text-admin-text placeholder-admin-faint focus:outline-none focus:border-admin-line-2"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm text-admin-dim mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 bg-admin-bg border border-admin-line rounded text-admin-text placeholder-admin-faint focus:outline-none focus:border-admin-line-2 resize-none"
                placeholder="Short summary of the post"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm text-admin-dim mb-2">Content</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 bg-admin-bg border border-admin-line rounded text-admin-text placeholder-admin-faint focus:outline-none focus:border-admin-line-2 resize-none"
                placeholder="Full post content"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-admin-dim mb-2">Author</label>
                <input
                  type="text"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 bg-admin-bg border border-admin-line rounded text-admin-text placeholder-admin-faint focus:outline-none focus:border-admin-line-2"
                  placeholder="Author name"
                />
              </div>

              <div>
                <label className="block text-sm text-admin-dim mb-2">Status</label>
                <select
                  value={formData.status || 'Draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-admin-bg border border-admin-line rounded text-admin-text focus:outline-none focus:border-admin-line-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured || false}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-admin-line bg-admin-bg"
              />
              <label htmlFor="featured" className="text-sm text-admin-dim">
                Featured Post
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSavePost}
                className="flex-1 px-4 py-2 bg-admin-raise border border-admin-line-2 rounded text-admin-text hover:bg-admin-surface transition-colors"
              >
                {editingPost ? 'Update Post' : 'Create Post'}
              </button>
              <button
                onClick={() => {
                  setShowNewPostForm(false);
                  setEditingPost(null);
                }}
                className="flex-1 px-4 py-2 bg-admin-bg border border-admin-line rounded text-admin-dim hover:text-admin-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-admin-dim">
            <p>No blog posts yet. Create your first post to get started.</p>
          </div>
        ) : (
          posts.map((post) => {
            const postPhotos = photos[post._id] || [];
            const postVideos = videos[post._id] || [];
            const postMusic = music[post._id] || [];
            const isExpanded = expandedPost === post._id;

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-admin-surface border border-admin-line rounded-lg overflow-hidden"
              >
                {/* Post Header */}
                <button
                  onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-admin-raise transition-colors"
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-admin-text">{post.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-admin-dim">
                      <span className="px-2 py-1 bg-admin-bg rounded">
                        {post.status || 'Draft'}
                      </span>
                      {post.featured && (
                        <span className="px-2 py-1 bg-admin-raise rounded">Featured</span>
                      )}
                      <span>
                        {postPhotos.length} photos • {postVideos.length} videos • {postMusic.length} tracks
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-admin-dim transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Post Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-admin-line px-6 py-4 space-y-4 bg-admin-bg"
                  >
                    {/* Post Info */}
                    <div className="space-y-2 text-sm">
                      {post.excerpt && (
                        <div>
                          <p className="text-admin-dim">Excerpt:</p>
                          <p className="text-admin-text">{post.excerpt}</p>
                        </div>
                      )}
                      {post.author && (
                        <div>
                          <p className="text-admin-dim">Author: {post.author}</p>
                        </div>
                      )}
                    </div>

                    {/* Media Sections */}
                    {(postPhotos.length > 0 || postVideos.length > 0 || postMusic.length > 0) && (
                      <div className="space-y-4 pt-4 border-t border-admin-line">
                        {/* Photos */}
                        {postPhotos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-admin-text mb-2">
                              Photos ({postPhotos.length})
                            </h4>
                            <div className="space-y-2">
                              {postPhotos.map((photo) => (
                                <div
                                  key={photo._id}
                                  className="flex items-center justify-between p-2 bg-admin-surface rounded border border-admin-line"
                                >
                                  <div className="text-sm text-admin-text">{photo.caption || photo.title || 'Untitled'}</div>
                                  <button
                                    onClick={() => handleDeletePhoto(photo._id)}
                                    className="text-admin-dim hover:text-danger transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {postVideos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-admin-text mb-2">
                              Videos ({postVideos.length})
                            </h4>
                            <div className="space-y-2">
                              {postVideos.map((video) => (
                                <div
                                  key={video._id}
                                  className="flex items-center justify-between p-2 bg-admin-surface rounded border border-admin-line"
                                >
                                  <div className="text-sm text-admin-text">{video.title || 'Untitled Video'}</div>
                                  <button
                                    onClick={() => handleDeleteVideo(video._id)}
                                    className="text-admin-dim hover:text-danger transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Music */}
                        {postMusic.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-admin-text mb-2">
                              Music ({postMusic.length})
                            </h4>
                            <div className="space-y-2">
                              {postMusic.map((track) => (
                                <div
                                  key={track._id}
                                  className="flex items-center justify-between p-2 bg-admin-surface rounded border border-admin-line"
                                >
                                  <div className="text-sm text-admin-text">
                                    {track.title} {track.artist && `- ${track.artist}`}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteMusic(track._id)}
                                    className="text-admin-dim hover:text-danger transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-admin-line">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-admin-raise border border-admin-line rounded text-admin-text hover:bg-admin-surface transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger hover:bg-danger/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
