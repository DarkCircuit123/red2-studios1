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
          Manage your website's splash page branding and logo assets.
        </p>
      </div>

      <SplashpageManager onSave={onSave} />
    </div>
  );
}
