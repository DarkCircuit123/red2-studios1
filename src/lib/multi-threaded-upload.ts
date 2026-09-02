/**
 * Multi-threaded upload system with progress tracking
 * Handles concurrent uploads with configurable thread count
 */

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  result?: any;
}

export interface UploadProgress {
  taskId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface UploadOptions {
  maxConcurrent?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (taskId: string, result: any) => void;
  onError?: (taskId: string, error: string) => void;
  uploadFn: (file: File, onProgress: (percent: number) => void) => Promise<any>;
}

export class MultiThreadedUploader {
  private tasks: Map<string, UploadTask> = new Map();
  private queue: string[] = [];
  private activeUploads: Set<string> = new Set();
  private maxConcurrent: number;
  private onProgress?: (progress: UploadProgress) => void;
  private onComplete?: (taskId: string, result: any) => void;
  private onError?: (taskId: string, error: string) => void;
  private uploadFn: (file: File, onProgress: (percent: number) => void) => Promise<any>;

  constructor(options: UploadOptions) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
    this.uploadFn = options.uploadFn;
  }

  addTask(id: string, file: File): void {
    const task: UploadTask = {
      id,
      file,
      progress: 0,
      status: 'pending',
    };
    this.tasks.set(id, task);
    this.queue.push(id);
    this.processQueue();
  }

  addTasks(files: File[]): string[] {
    const ids = files.map((file, index) => {
      const id = `${Date.now()}-${index}-${Math.random()}`;
      this.addTask(id, file);
      return id;
    });
    return ids;
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeUploads.size < this.maxConcurrent) {
      const taskId = this.queue.shift();
      if (taskId) {
        this.activeUploads.add(taskId);
        this.uploadTask(taskId).finally(() => {
          this.activeUploads.delete(taskId);
          this.processQueue();
        });
      }
    }
  }

  private async uploadTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      task.status = 'uploading';
      this.notifyProgress(taskId, 0, 'uploading');

      const result = await this.uploadFn(task.file, (percent: number) => {
        task.progress = percent;
        this.notifyProgress(taskId, percent, 'uploading');
      });

      task.status = 'completed';
      task.result = result;
      task.progress = 100;
      this.notifyProgress(taskId, 100, 'completed');
      this.onComplete?.(taskId, result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      task.status = 'failed';
      task.error = errorMsg;
      this.notifyProgress(taskId, 0, 'failed', errorMsg);
      this.onError?.(taskId, errorMsg);
    }
  }

  private notifyProgress(
    taskId: string,
    progress: number,
    status: 'pending' | 'uploading' | 'completed' | 'failed',
    error?: string
  ): void {
    this.onProgress?.({
      taskId,
      progress,
      status,
      error,
    });
  }

  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  getProgress(): number {
    if (this.tasks.size === 0) return 0;
    const total = Array.from(this.tasks.values()).reduce((sum, task) => sum + task.progress, 0);
    return Math.round(total / this.tasks.size);
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      uploading: tasks.filter(t => t.status === 'uploading').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overallProgress: this.getProgress(),
    };
  }

  cancel(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      this.queue = this.queue.filter(id => id !== taskId);
      this.tasks.delete(taskId);
    }
  }

  clear(): void {
    this.tasks.clear();
    this.queue = [];
    this.activeUploads.clear();
  }
}
