import React from 'react';
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { BaseCrudService } from '@/integrations';

interface ImageUploadManagerProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  label?: string;
  collectionId?: string;
  itemId?: string;
  fieldName?: string;
}

function ImageUploadManager({
  onImageUpload,
  currentImage,
  label = 'Upload Image',
  collectionId,
  itemId,
  fieldName
}: ImageUploadManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      // Create a canvas for auto-crop and resize
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Auto-crop to square and resize to 1200x1200 for optimal quality
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          
          canvas.width = 1200;
          canvas.height = 1200;
          
          ctx?.drawImage(img, x, y, size, size, 0, 0, 1200, 1200);
          
          // Convert to blob and create URL
          canvas.toBlob(async (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              
              // If collection info provided, save to CMS
              if (collectionId && itemId && fieldName) {
                try {
                  // Convert blob to base64 for storage
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const base64 = event.target?.result as string;
                    // Save to CMS
                    await BaseCrudService.update(collectionId, {
                      _id: itemId,
                      [fieldName]: base64
                    });
                    onImageUpload(base64);
                    setIsProcessing(false);
                  };
                  reader.readAsDataURL(blob);
                } catch {
                  onImageUpload(url);
                  setIsProcessing(false);
                }
              } else {
                // Fallback to local URL if no CMS info
                onImageUpload(url);
                setIsProcessing(false);
              }
            }
          }, 'image/jpeg', 0.95);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-white/60 bg-white/10'
            : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-white/60">Processing image...</p>
          </div>
        ) : currentImage ? (
          <div className="flex flex-col items-center gap-3">
            <Image src={currentImage} alt="Preview" className="w-24 h-24 object-cover rounded" />
            <p className="text-xs text-white/60">{label}</p>
            <p className="text-xs text-white/40">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-6 h-6 text-white/40" />
            <p className="text-sm text-white/60">{label}</p>
            <p className="text-xs text-white/40">Drag & drop or click to upload</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default React.memo(ImageUploadManager);
