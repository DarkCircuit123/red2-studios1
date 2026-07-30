/**
 * Upload Queue Manager
 * Handles sequential file uploads with optimization, retry logic, and detailed error tracking
 */

export interface UploadFile {
  id: string;
  file: File;
  originalSize: number;
  optimizedSize?: number;
  status: 'pending' | 'optimizing' | 'uploading' | 'success' | 'error' | 'retrying';
  progress: number;
  error?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  uploadedUrl?: string;
  startTime?: number;
  endTime?: number;
}

export interface UploadQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  optimizeImages?: boolean;
  optimizeAudio?: boolean;
  maxImageSize?: number;
  maxAudioSize?: number;
  imageQuality?: number;
  audioQuality?: number;
}

export interface UploadQueueState {
  files: UploadFile[];
  currentFileId?: string;
  isProcessing: boolean;
  totalProgress: number;
  completedCount: number;
  failedCount: number;
  successCount: number;
}

type UploadCallback = (file: UploadFile, state: UploadQueueState) => void;
type OptimizeCallback = (file: File) => Promise<File>;

class UploadQueueManager {
  private files: Map<string, UploadFile> = new Map();
  private currentFileId: string | null = null;
  private isProcessing = false;
  private config: Required<UploadQueueConfig>;
  private uploadCallback: UploadCallback | null = null;
  private optimizeCallbacks: Map<string, OptimizeCallback> = new Map();
  private stateListeners: Set<(state: UploadQueueState) => void> = new Set();

  constructor(config: UploadQueueConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      optimizeImages: config.optimizeImages ?? true,
      optimizeAudio: config.optimizeAudio ?? true,
      maxImageSize: config.maxImageSize ?? 5 * 1024 * 1024, // 5MB
      maxAudioSize: config.maxAudioSize ?? 10 * 1024 * 1024, // 10MB
      imageQuality: config.imageQuality ?? 0.8,
      audioQuality: config.audioQuality ?? 0.9,
    };
  }

  /**
   * Add files to the upload queue
   */
  addFiles(filesToAdd: File[]): string[] {
    const ids: string[] = [];
    
    for (const file of filesToAdd) {
      const id = this.generateId();
      const uploadFile: UploadFile = {
        id,
        file,
        originalSize: file.size,
        status: 'pending',
        progress: 0,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      };
      
      this.files.set(id, uploadFile);
      ids.push(id);
      
      console.log(`[UPLOAD_QUEUE] Added file: ${file.name} (${this.formatSize(file.size)})`);
    }

    this.notifyStateChange();
    return ids;
  }

  /**
   * Register upload callback (called for each file)
   */
  onUpload(callback: UploadCallback): void {
    this.uploadCallback = callback;
  }

  /**
   * Register optimization callback for specific file type
   */
  registerOptimizer(mimeType: string, callback: OptimizeCallback): void {
    this.optimizeCallbacks.set(mimeType, callback);
  }

  /**
   * Subscribe to queue state changes
   */
  subscribe(listener: (state: UploadQueueState) => void): () => void {
    this.stateListeners.add(listener);
    // Return unsubscribe function
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Start processing the queue
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      console.warn('[UPLOAD_QUEUE] Already processing');
      return;
    }

    this.isProcessing = true;
    this.notifyStateChange();

    const fileArray = Array.from(this.files.values());
    
    for (const uploadFile of fileArray) {
      if (uploadFile.status === 'success' || uploadFile.status === 'error') {
        continue; // Skip already processed files
      }

      this.currentFileId = uploadFile.id;
      await this.processFile(uploadFile);
    }

    this.isProcessing = false;
    this.currentFileId = null;
    this.notifyStateChange();
  }

  /**
   * Retry a specific failed file
   */
  async retryFile(fileId: string): Promise<void> {
    const uploadFile = this.files.get(fileId);
    if (!uploadFile) {
      console.error(`[UPLOAD_QUEUE] File not found: ${fileId}`);
      return;
    }

    if (uploadFile.retryCount >= uploadFile.maxRetries) {
      console.error(`[UPLOAD_QUEUE] Max retries exceeded for ${uploadFile.file.name}`);
      return;
    }

    uploadFile.status = 'retrying';
    uploadFile.error = undefined;
    uploadFile.progress = 0;
    this.notifyStateChange();

    await this.processFile(uploadFile);
  }

  /**
   * Cancel upload queue
   */
  cancel(): void {
    this.isProcessing = false;
    this.currentFileId = null;
    
    for (const uploadFile of this.files.values()) {
      if (uploadFile.status === 'uploading' || uploadFile.status === 'optimizing') {
        uploadFile.status = 'pending';
        uploadFile.progress = 0;
      }
    }
    
    this.notifyStateChange();
  }

  /**
   * Clear completed files
   */
  clearCompleted(): void {
    for (const [id, uploadFile] of this.files.entries()) {
      if (uploadFile.status === 'success' || uploadFile.status === 'error') {
        this.files.delete(id);
      }
    }
    this.notifyStateChange();
  }

  /**
   * Get current queue state
   */
  getState(): UploadQueueState {
    const files = Array.from(this.files.values());
    const completedCount = files.filter(f => f.status === 'success').length;
    const failedCount = files.filter(f => f.status === 'error').length;
    const successCount = completedCount;
    const totalProgress = files.length > 0 
      ? Math.round((files.reduce((sum, f) => sum + f.progress, 0) / files.length))
      : 0;

    return {
      files,
      currentFileId: this.currentFileId || undefined,
      isProcessing: this.isProcessing,
      totalProgress,
      completedCount,
      failedCount,
      successCount,
    };
  }

  /**
   * Get a specific file
   */
  getFile(fileId: string): UploadFile | undefined {
    return this.files.get(fileId);
  }

  /**
   * Get all files
   */
  getAllFiles(): UploadFile[] {
    return Array.from(this.files.values());
  }

  // ============ Private Methods ============

  private async processFile(uploadFile: UploadFile): Promise<void> {
    uploadFile.startTime = Date.now();
    
    try {
      // Step 1: Optimize if needed
      if (this.config.optimizeImages && uploadFile.file.type.startsWith('image/')) {
        uploadFile.status = 'optimizing';
        uploadFile.progress = 10;
        this.notifyStateChange();

        const optimized = await this.optimizeImage(uploadFile.file);
        uploadFile.file = optimized;
        uploadFile.optimizedSize = optimized.size;
        
        console.log(`[UPLOAD_QUEUE] Optimized ${uploadFile.file.name}: ${this.formatSize(uploadFile.originalSize)} → ${this.formatSize(optimized.size)}`);
      }

      if (this.config.optimizeAudio && uploadFile.file.type.startsWith('audio/')) {
        uploadFile.status = 'optimizing';
        uploadFile.progress = 10;
        this.notifyStateChange();

        // Audio optimization would go here (requires external library)
        // For now, just validate size
        if (uploadFile.file.size > this.config.maxAudioSize) {
          throw new Error(`Audio file exceeds ${this.formatSize(this.config.maxAudioSize)} limit`);
        }
      }

      // Step 2: Upload
      uploadFile.status = 'uploading';
      uploadFile.progress = 20;
      this.notifyStateChange();

      if (!this.uploadCallback) {
        throw new Error('No upload callback registered');
      }

      await this.uploadCallback(uploadFile, this.getState());

      // Step 3: Mark as success
      uploadFile.status = 'success';
      uploadFile.progress = 100;
      uploadFile.endTime = Date.now();
      
      const duration = uploadFile.endTime - (uploadFile.startTime || 0);
      console.log(`[UPLOAD_QUEUE] ✓ ${uploadFile.file.name} uploaded successfully (${duration}ms)`);
      
      this.notifyStateChange();
    } catch (error) {
      uploadFile.endTime = Date.now();
      const duration = uploadFile.endTime - (uploadFile.startTime || 0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uploadFile.error = errorMessage;
      uploadFile.errorCode = this.extractErrorCode(errorMessage);
      
      console.error(`[UPLOAD_QUEUE] ✗ ${uploadFile.file.name} failed (${duration}ms): ${errorMessage}`);

      // Retry logic
      if (uploadFile.retryCount < uploadFile.maxRetries) {
        uploadFile.retryCount++;
        uploadFile.status = 'retrying';
        uploadFile.progress = 0;
        
        const delay = this.config.retryDelay * uploadFile.retryCount;
        console.log(`[UPLOAD_QUEUE] Retrying ${uploadFile.file.name} in ${delay}ms (attempt ${uploadFile.retryCount}/${uploadFile.maxRetries})`);
        
        this.notifyStateChange();
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.processFile(uploadFile);
      } else {
        uploadFile.status = 'error';
        uploadFile.progress = 0;
        console.error(`[UPLOAD_QUEUE] Max retries exceeded for ${uploadFile.file.name}`);
        this.notifyStateChange();
      }
    }
  }

  private async optimizeImage(file: File): Promise<File> {
    // Check if custom optimizer is registered
    const customOptimizer = this.optimizeCallbacks.get(file.type);
    if (customOptimizer) {
      return customOptimizer(file);
    }

    // Default optimization: resize if too large
    if (file.size > this.config.maxImageSize) {
      return this.resizeImage(file);
    }

    return file;
  }

  private async resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      // Use URL.createObjectURL instead of FileReader.readAsDataURL
      // This avoids base64 encoding overhead and is more efficient
      const objectUrl = URL.createObjectURL(file);
      
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions (max 2000px on longest side)
        const maxDim = 2000;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            // Cleanup object URL
            URL.revokeObjectURL(objectUrl);
            
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(resizedFile);
          },
          'image/jpeg',
          this.config.imageQuality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  }

  private notifyStateChange(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private extractErrorCode(message: string): string {
    if (message.includes('413')) return 'PAYLOAD_TOO_LARGE';
    if (message.includes('400')) return 'BAD_REQUEST';
    if (message.includes('401')) return 'UNAUTHORIZED';
    if (message.includes('403')) return 'FORBIDDEN';
    if (message.includes('404')) return 'NOT_FOUND';
    if (message.includes('500')) return 'SERVER_ERROR';
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network')) return 'NETWORK_ERROR';
    return 'UNKNOWN_ERROR';
  }
}

export default UploadQueueManager;
