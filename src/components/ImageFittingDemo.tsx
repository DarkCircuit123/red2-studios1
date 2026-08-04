/**
 * Image Fitting System Demo & Testing Component
 * Shows how to use the professional image fitting system
 */

import React, { useState } from 'react';
import { ResponsiveImageContainer } from '@/components/ResponsiveImageContainer';
import { useImageFitting } from '@/hooks/useImageFitting';

export function ImageFittingDemo() {
  const [focalPointX, setFocalPointX] = useState(50);
  const [focalPointY, setFocalPointY] = useState(50);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  return (
    <div className="w-full bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Image Fitting System Demo</h1>

        {/* Controls */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Focal Point Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Focal Point X */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Focal Point X: {focalPointX}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={focalPointX}
                onChange={(e) => setFocalPointX(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-2">
                0% = left edge, 50% = center, 100% = right edge
              </p>
            </div>

            {/* Focal Point Y */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Focal Point Y: {focalPointY}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={focalPointY}
                onChange={(e) => setFocalPointY(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-2">
                0% = top edge, 50% = center, 100% = bottom edge
              </p>
            </div>

            {/* Fit Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Fit Mode</label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as 'cover' | 'contain')}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                <option value="cover">Cover (crop to fill)</option>
                <option value="contain">Contain (show entire image)</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                {fitMode === 'cover'
                  ? 'Image fills container, may be cropped'
                  : 'Entire image visible, may have empty space'}
              </p>
            </div>
          </div>
        </div>

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Hero Section Demo */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Hero Section (Full Screen)</h3>
            <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
              <ResponsiveImageContainer
                src="https://static.wixstatic.com/media/e9d727_60766614cfea4a3789656d1d37db4fcc~mv2.png?originWidth=1024&originHeight=384"
                alt="Hero demo"
                focalPointX={focalPointX}
                focalPointY={focalPointY}
                fitMode={fitMode}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Demonstrates full-screen hero image with focal point preservation
            </p>
          </div>

          {/* Gallery Card Demo */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Gallery Cards (Square)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
                >
                  <ResponsiveImageContainer
                    src="https://static.wixstatic.com/media/e9d727_0fc2d8f3958640cb9c91147b111984ed~mv2.png?originWidth=512&originHeight=512"
                    alt={`Gallery item ${i}`}
                    focalPointX={focalPointX}
                    focalPointY={focalPointY}
                    fitMode={fitMode}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Demonstrates consistent card dimensions with responsive fitting
            </p>
          </div>

          {/* Behind The Scenes Demo */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Behind The Scenes (Rectangular)</h3>
            <div className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
              <ResponsiveImageContainer
                src="https://static.wixstatic.com/media/e9d727_b313df41901d48a2851d08c6062bfb2b~mv2.png?originWidth=1024&originHeight=256"
                alt="Behind the scenes demo"
                focalPointX={focalPointX}
                focalPointY={focalPointY}
                fitMode={fitMode}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Demonstrates automatic crop/scale to fill placeholder
            </p>
          </div>

          {/* Responsive Demo */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Responsive Behavior</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Desktop (1200px)</p>
                <div className="w-full max-w-3xl h-48 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <ResponsiveImageContainer
                    src="https://static.wixstatic.com/media/e9d727_35f944dad6e64e6aa4f1c3d13090eb78~mv2.png?originWidth=1024&originHeight=192"
                    alt="Desktop view"
                    focalPointX={focalPointX}
                    focalPointY={focalPointY}
                    fitMode={fitMode}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Tablet (768px)</p>
                <div className="w-full max-w-2xl h-40 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <ResponsiveImageContainer
                    src="https://static.wixstatic.com/media/e9d727_ae82e27d77d74897b87ea9a331d18c9b~mv2.png?originWidth=1024&originHeight=192"
                    alt="Tablet view"
                    focalPointX={focalPointX}
                    focalPointY={focalPointY}
                    fitMode={fitMode}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Mobile (375px)</p>
                <div className="w-full max-w-sm h-32 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <ResponsiveImageContainer
                    src="https://static.wixstatic.com/media/e9d727_e6a4ff39266d4cb399a61501333653ac~mv2.png?originWidth=1024&originHeight=192"
                    alt="Mobile view"
                    focalPointX={focalPointX}
                    focalPointY={focalPointY}
                    fitMode={fitMode}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Images automatically adapt to different screen sizes while preserving focal point
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-900 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✓ Container controls the shape and size</li>
            <li>✓ Image fills the container without stretching</li>
            <li>✓ Cropping happens automatically based on aspect ratios</li>
            <li>✓ Aspect ratio is always preserved</li>
            <li>✓ Focal point positioning prevents accidental cropping</li>
            <li>✓ Responsive sizing optimizes loading for all devices</li>
            <li>✓ No manual resizing needed - just upload and go!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ImageFittingDemo;
