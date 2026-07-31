/**
 * Upload Hooks - Vibe Best Practices
 *
 * React hooks for file uploads with CMS integration
 * Provides:
 * - State management for uploads
 * - Automatic storage in CMS
 * - Error handling
 * - Progress tracking
 */

import { useState, useCallback } from 'react';
import { uploadFile, importFromUrl, type UploadProgress, type UploadResult } from './upload-service';
import { storeMediaUrl, removeMediaUrl, type StorageOptions } from './upload-storage';
import { UploadConfig } from './upload-config';

export interface UseUploadOptions {
  kind: 'image' | 'music';
  config: UploadConfig;
  storage?: StorageOptions;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export interface UseUploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  result: UploadResult | null;
}

/**
 * Hook for uploading files with optional CMS storage
 */
export function useUpload(options: UseUploadOptions) {
  const { kind, config, storage, onSuccess, onError } = options;
  const [state, setState] = useState<UseUploadState>({
    isUploading: false,
    progress: null,
    error: null,
    result: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({
        isUploading: true,
        progress: null,
        error: null,
        result: null,
      });

      try {
        const result = await uploadFile(file, kind, config, {
          onProgress: (progress) => {
            setState((prev) => ({ ...prev, progress }));
          },
          maxRetries: 2,
          timeoutMs: 120000,
        });

        // Store in CMS if configured
        if (storage) {
          const storageResult = await storeMediaUrl(result, storage);
          if (!storageResult.success) {
            throw new Error(storageResult.error || 'Failed to store media URL');
          }
        }

        setState({
          isUploading: false,
          progress: null,
          error: null,
          result,
        });

        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setState({
          isUploading: false,
          progress: null,
          error: error.message,
          result: null,
        });
        onError?.(error);
      }
    },
    [kind, config, storage, onSuccess, onError]
  );

  const importUrl = useCallback(
    async (url: string) => {
      setState({
        isUploading: true,
        progress: null,
        error: null,
        result: null,
      });

      try {
        const result = await importFromUrl(url, kind, (progress) => {
          setState((prev) => ({ ...prev, progress }));
        });

        // Store in CMS if configured
        if (storage) {
          const storageResult = await storeMediaUrl(result, storage);
          if (!storageResult.success) {
            throw new Error(storageResult.error || 'Failed to store media URL');
          }
        }

        setState({
          isUploading: false,
          progress: null,
          error: null,
          result,
        });

        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Import failed');
        setState({
          isUploading: false,
          progress: null,
          error: error.message,
          result: null,
        });
        onError?.(error);
      }
    },
    [kind, storage, onSuccess, onError]
  );

  const remove = useCallback(async () => {
    if (!state.result || !storage) {
      return;
    }

    try {
      const success = await removeMediaUrl(state.result.mediaUrl, storage);
      if (success) {
        setState({
          isUploading: false,
          progress: null,
          error: null,
          result: null,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove media');
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }, [state.result, storage]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    upload,
    importUrl,
    remove,
    clearError,
  };
}

/**
 * Hook for multiple file uploads
 */
export interface UseMultiUploadOptions extends Omit<UseUploadOptions, 'storage'> {
  storage?: Omit<StorageOptions, 'itemId'> & { itemIds?: string[] };
}

export interface UseMultiUploadState {
  isUploading: boolean;
  progress: Map<string, UploadProgress>;
  errors: Map<string, string>;
  results: Map<string, UploadResult>;
}

export function useMultiUpload(options: UseMultiUploadOptions) {
  const { kind, config, storage, onSuccess, onError } = options;
  const [state, setState] = useState<UseMultiUploadState>({
    isUploading: false,
    progress: new Map(),
    errors: new Map(),
    results: new Map(),
  });

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      setState({
        isUploading: true,
        progress: new Map(),
        errors: new Map(),
        results: new Map(),
      });

      const results = new Map<string, UploadResult>();
      const errors = new Map<string, string>();
      const progress = new Map<string, UploadProgress>();

      for (const file of files) {
        const fileId = `${file.name}-${file.size}`;

        try {
          const result = await uploadFile(file, kind, config, {
            onProgress: (p) => {
              progress.set(fileId, p);
              setState((prev) => ({ ...prev, progress: new Map(progress) }));
            },
            maxRetries: 2,
            timeoutMs: 120000,
          });

          results.set(fileId, result);
          onSuccess?.(result);
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Upload failed';
          errors.set(fileId, error);
          onError?.(err instanceof Error ? err : new Error(error));
        }
      }

      setState({
        isUploading: false,
        progress,
        errors,
        results,
      });
    },
    [kind, config, onSuccess, onError]
  );

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: new Map() }));
  }, []);

  return {
    ...state,
    uploadMultiple,
    clearErrors,
  };
}
