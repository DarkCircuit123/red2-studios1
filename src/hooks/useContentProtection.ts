import { useEffect } from 'react';
import { contentProtection } from '@/lib/content-protection';
import { advancedProtection } from '@/lib/advanced-content-protection';

/**
 * Hook to enable content protection on a page or component
 * @param enabled - Whether to enable protection (default: true)
 * @param advanced - Whether to enable advanced protection (default: true)
 */
export function useContentProtection(enabled: boolean = true, advanced: boolean = true): void {
  useEffect(() => {
    if (enabled) {
      contentProtection.initializeProtection();
      if (advanced) {
        advancedProtection.initializeAdvancedProtection();
      }
    }

    return () => {
      // Optionally disable on unmount
      // contentProtection.disableProtection();
    };
  }, [enabled, advanced]);
}

/**
 * Hook to check if protection is active
 */
export function useIsProtectionActive(): boolean {
  return contentProtection.isActive();
}

/**
 * Hook to manually disable protection
 */
export function useDisableProtection(): () => void {
  return () => {
    contentProtection.disableProtection();
  };
}

/**
 * Hook to get advanced protection status
 */
export function useAdvancedProtectionStatus() {
  return advancedProtection.getStatus();
}
