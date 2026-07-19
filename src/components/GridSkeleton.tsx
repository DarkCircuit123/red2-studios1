import React from 'react';
import { motion } from 'framer-motion';

interface GridSkeletonProps {
  count?: number;
  aspectRatio?: string;
  columns?: string;
}

export default function GridSkeleton({
  count = 6,
  aspectRatio = 'aspect-square',
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}: GridSkeletonProps) {
  return (
    <div className={`grid ${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${aspectRatio} bg-gray-900 rounded-lg overflow-hidden`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        </motion.div>
      ))}
    </div>
  );
}
