import { useState, useRef } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { PortfolioWithImages } from '@/lib/portfolio-service';
import { PortfolioImages } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { Trash2, Plus, GripVertical, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToWixMedia } from '@/lib/wix-media-upload-service';

interface ProjectFormData {
  projectName: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  imageAltText: string;
  seoTitle: string;
  seoDescription: string;
}

export default function PortfolioManager() {
  const {
    portfolios,
    isLoading,
    error,
    createPortfolio,
    updatePortfolio,
    addImage,
    updateImage,
    reorderImages,
    deleteImage,
    deletePortfolio,
  } = usePortfolio();

  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithImages | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    imageAltText: '',
    seoTitle: '',
    seoDescription: '',
  });
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [uploadingImageIds, setUploadingImageIds] = useState<Set<string>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = async () => {
    if (!formData.projectName.trim()) return;

    try {
      const newPortfolio = await createPortfolio({
        projectName: formData.projectName,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        category: formData.category,
        imageAltText: formData.imageAltText,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        mainImage: '',
        projectDate: new Date().toISOString().split('T')[0],
      });

      setSelectedPortfolio({ ...newPortfolio, images: [] });
      setFormData({
        projectName: '',
        shortDescription: '',
        fullDescription: '',
        category: '',
        imageAltText: '',
        seoTitle: '',
        seoDescription: '',
      });
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create portfolio:', err);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedPortfolio) return;

    try {
      await updatePortfolio(selectedPortfolio._id, {
        projectName: formData.projectName,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        category: formData.category,
        imageAltText: formData.imageAltText,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
      });

      setSelectedPortfolio({
        ...selectedPortfolio,
        projectName: formData.projectName,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        category: formData.category,
        imageAltText: formData.imageAltText,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
      });
    } catch (err) {
      console.error('Failed to update portfolio:', err);
    }
  };

  const handleAddImage = async (imageUrl: string) => {
    if (!selectedPortfolio) return;

    try {
      const displayOrder = (selectedPortfolio.images?.length || 0);
      await addImage(selectedPortfolio._id, {
        image: imageUrl,
        displayOrder,
        caption: '',
        altText: formData.imageAltText,
      });
    } catch (err) {
      console.error('Failed to add image:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to add image');
    }
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || !selectedPortfolio) return;

    setUploadError(null);
    const uploadingIds = new Set<string>();

    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      uploadingIds.add(tempId);
      setUploadingImageIds((prev) => new Set([...prev, tempId]));

      try {
        console.log(`[Portfolio Manager] Uploading image: ${file.name}`);
        const mediaUrl = await uploadToWixMedia(file, 'image');
        console.log(`[Portfolio Manager] Upload successful, media URL: ${mediaUrl}`);
        
        await handleAddImage(mediaUrl);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        console.error(`[Portfolio Manager] Upload failed for ${file.name}:`, err);
        setUploadError(`Failed to upload ${file.name}: ${errorMsg}`);
      } finally {
        uploadingIds.delete(tempId);
        setUploadingImageIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    }
  };

  const handleReorderImages = async (images: PortfolioImages[]) => {
    try {
      await reorderImages(images.map((img) => img._id));
    } catch (err) {
      console.error('Failed to reorder images:', err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImage(imageId);
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!window.confirm('Are you sure? This will delete the project and all its images.')) return;

    try {
      await deletePortfolio(portfolioId);
      setSelectedPortfolio(null);
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    if (!draggedImage || !selectedPortfolio?.images) return;

    const images = [...selectedPortfolio.images];
    const draggedIndex = images.findIndex((img) => img._id === draggedImage);
    const targetIndex = images.findIndex((img) => img._id === targetImageId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    [images[draggedIndex], images[targetIndex]] = [images[targetIndex], images[draggedIndex]];
    await handleReorderImages(images);
    setDraggedImage(null);
  };

  if (isLoading && portfolios.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {/* Portfolio List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Portfolio Projects</h2>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus size={18} />
            New Project
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {portfolios.map((portfolio) => (
              <motion.div
                key={portfolio._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedPortfolio?._id === portfolio._id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary'
                }`}
                onClick={() => {
                  setSelectedPortfolio(portfolio);
                  setFormData({
                    projectName: portfolio.projectName || '',
                    shortDescription: portfolio.shortDescription || '',
                    fullDescription: portfolio.fullDescription || '',
                    category: portfolio.category || '',
                    imageAltText: portfolio.imageAltText || '',
                    seoTitle: portfolio.seoTitle || '',
                    seoDescription: portfolio.seoDescription || '',
                  });
                }}
              >
                {portfolio.mainImage && (
                  <div className="mb-3 h-32 overflow-hidden rounded-lg">
                    <Image
                      src={portfolio.mainImage}
                      alt={portfolio.projectName || 'Portfolio'}
                      className="h-full w-full object-cover"
                      width={300}
                      height={200}
                    />
                  </div>
                )}
                <h3 className="font-heading font-bold">{portfolio.projectName}</h3>
                <p className="font-paragraph text-sm text-gray-600">{portfolio.category}</p>
                <p className="font-paragraph text-xs text-gray-500">{portfolio.images?.length || 0} images</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || selectedPortfolio) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold">
              {isCreating ? 'Create New Project' : 'Edit Project'}
            </h3>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setSelectedPortfolio(null);
                setFormData({
                  projectName: '',
                  shortDescription: '',
                  fullDescription: '',
                  category: '',
                  imageAltText: '',
                  seoTitle: '',
                  seoDescription: '',
                });
              }}
            >
              Close
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="font-paragraph block text-sm font-medium">Project Name *</label>
              <Input
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Project name"
              />
            </div>

            <div>
              <label className="font-paragraph block text-sm font-medium">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Photography, Design, Video"
              />
            </div>

            <div>
              <label className="font-paragraph block text-sm font-medium">Short Description</label>
              <Textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief description for cards"
                rows={2}
              />
            </div>

            <div>
              <label className="font-paragraph block text-sm font-medium">Full Description</label>
              <Textarea
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                placeholder="Detailed project description"
                rows={4}
              />
            </div>

            <div>
              <label className="font-paragraph block text-sm font-medium">Image Alt Text</label>
              <Input
                value={formData.imageAltText}
                onChange={(e) => setFormData({ ...formData, imageAltText: e.target.value })}
                placeholder="Alt text for accessibility"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="font-paragraph block text-sm font-medium">SEO Title</label>
                <Input
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="SEO title"
                />
              </div>
              <div>
                <label className="font-paragraph block text-sm font-medium">SEO Description</label>
                <Input
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="SEO description"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={isCreating ? handleCreateProject : handleUpdateProject}
              className="flex-1"
            >
              {isCreating ? 'Create Project' : 'Update Project'}
            </Button>
            {selectedPortfolio && (
              <Button
                variant="destructive"
                onClick={() => handleDeletePortfolio(selectedPortfolio._id)}
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>

          {/* Image Management */}
          {selectedPortfolio && (
            <div className="space-y-4 border-t pt-6">
              {uploadError && (
                <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-paragraph text-sm font-medium text-red-900">{uploadError}</p>
                    <button
                      onClick={() => setUploadError(null)}
                      className="font-paragraph text-xs text-red-700 hover:text-red-900 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold">Project Images</h4>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImageIds.size > 0}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {uploadingImageIds.size > 0 ? `Uploading (${uploadingImageIds.size})...` : 'Add Images'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleUploadImages(e.target.files);
                    // Reset input so same file can be selected again
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Image Grid with Drag & Drop */}
              <div className="space-y-2">
                {selectedPortfolio.images && selectedPortfolio.images.length > 0 ? (
                  selectedPortfolio.images.map((image, index) => (
                    <motion.div
                      key={image._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, image._id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, image._id)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                        draggedImage === image._id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <GripVertical size={18} className="cursor-grab text-gray-400" />
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={image.image || ''}
                          alt={image.altText || `Image ${index + 1}`}
                          className="h-full w-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-paragraph text-sm font-medium">{image.caption || `Image ${index + 1}`}</p>
                        <p className="font-paragraph text-xs text-gray-500">{image.altText}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <p className="font-paragraph text-center text-gray-500">No images yet. Add one to get started.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
