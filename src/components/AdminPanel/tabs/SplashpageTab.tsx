import React from 'react';
import SplashpageManager from '../sections/SplashpageManager';

interface SplashpageTabProps {
  onSave?: () => void;
}

export default function SplashpageTab({ onSave }: SplashpageTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Splash Page Logo</h2>
        <p className="text-gray-600 mt-2">
          Manage your website's splash page branding and logo assets.
        </p>
      </div>

      <SplashpageManager onSave={onSave} />
    </div>
  );
}
