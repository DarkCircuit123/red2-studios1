/**
 * Upload Queue UI Component
 * Displays upload progress with detailed status for each file
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, RotateCcw, Trash2, X } from 'lucide-react';
import type { UploadFile, UploadQueueState } from '@/lib/upload-queue';

interface UploadQueueUIProps {
  state: UploadQueueState;
  onRetry: (fileId: string) => void;
  onClear: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export default function UploadQueueUI({
  state,
  onRetry,
  onClear,
  onCancel,
  isVisible,
}: UploadQueueUIProps) {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  if (!isVisible || state.files.length === 0) {
    return null;
  }

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'uploading':
      case 'optimizing':
        return 'text-blue-500';
      case 'retrying':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'uploading':
      case 'optimizing':
        return <Upload className="w-4 h-4 animate-spin" />;
      case 'retrying':
        return <RotateCcw className="w-4 h-4 animate-spin" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Upload Queue
          </span>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
            {state.successCount}/{state.files.length}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Overall Progress */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Overall Progress</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {state.totalProgress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${state.totalProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Files List */}
      <div className="overflow-y-auto max-h-64 space-y-2 p-3">
        <AnimatePresence>
          {state.files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-2"
            >
              {/* File Header */}
              <button
                onClick={() =>
                  setExpandedFileId(expandedFileId === file.id ? null : file.id)
                }
                className="w-full flex items-start gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors text-left"
              >
                <div className={`mt-0.5 flex-shrink-0 ${getStatusColor(file.status)}`}>
                  {getStatusIcon(file.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatSize(file.originalSize)}
                    {file.optimizedSize && file.optimizedSize !== file.originalSize && (
                      <span> → {formatSize(file.optimizedSize)}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {file.progress}%
                </span>
              </button>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    file.status === 'error'
                      ? 'bg-red-500'
                      : file.status === 'success'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${file.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedFileId === file.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700"
                  >
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Status:</span>
                      <span
                        className={`text-xs font-semibold capitalize ${getStatusColor(
                          file.status
                        )}`}
                      >
                        {file.status}
                      </span>
                    </div>

                    {/* Error Message */}
                    {file.error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {file.error}
                        </p>
                        {file.errorCode && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error Code: {file.errorCode}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Timing */}
                    {file.startTime && file.endTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Duration:
                        </span>
                        <span className="text-xs font-mono text-gray-900 dark:text-white">
                          {formatDuration(file.endTime - file.startTime)}
                        </span>
                      </div>
                    )}

                    {/* Retry Count */}
                    {file.retryCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Retries:
                        </span>
                        <span className="text-xs font-mono text-gray-900 dark:text-white">
                          {file.retryCount}/{file.maxRetries}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {file.status === 'error' && file.retryCount < file.maxRetries && (
                        <button
                          onClick={() => onRetry(file.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-300 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
        {state.failedCount > 0 && (
          <div className="flex-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {state.failedCount} failed
          </div>
        )}
        {state.isProcessing && (
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs font-medium text-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
        )}
        {!state.isProcessing && state.files.some(f => f.status === 'success' || f.status === 'error') && (
          <button
            onClick={onClear}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs font-medium text-gray-900 dark:text-white transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </motion.div>
  );
}
