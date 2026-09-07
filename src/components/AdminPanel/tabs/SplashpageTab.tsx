import React from 'react';
import SplashpageManager from '../sections/SplashpageManager';

interface SplashpageTabProps {
  onSave?: () => void;
}

export default function SplashpageTab({ onSave }: SplashpageTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">Splash Page Logo</h2>
        <p className="text-admin-dim mt-2 text-[13px]">
          Manage your website's splash page branding and logo assets. The splash page is the first thing visitors see when they arrive at your site. Upload a high-quality logo (recommended: 400x400px or larger, PNG with transparency for best results).
        </p>
      </div>

      <SplashpageManager onSave={onSave} />
    </div>
  );
}
