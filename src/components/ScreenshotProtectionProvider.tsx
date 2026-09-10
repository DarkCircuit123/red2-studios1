import { useEffect } from 'react';
import { ScreenshotProtection } from '@/lib/screenshot-protection';
import { AdvancedScreenshotDefense } from '@/lib/advanced-screenshot-defense';

/**
 * ScreenshotProtectionProvider Component
 * Wraps the application to enable comprehensive screenshot and right-click protection
 * 
 * Usage: Wrap your entire app with this component
 * <ScreenshotProtectionProvider>
 *   <YourApp />
 * </ScreenshotProtectionProvider>
 */
export default function ScreenshotProtectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize screenshot protection on mount
    ScreenshotProtection.initialize();
    AdvancedScreenshotDefense.initialize();

    // Add additional runtime protections
    const protectContent = () => {
      // Prevent inspect element
      if (
        (window as any).devtools?.open ||
        (window as any).chrome?.webstore
      ) {
        ScreenshotProtection.initialize();
        AdvancedScreenshotDefense.initialize();
      }
    };

    // Run protection check periodically
    const protectionInterval = setInterval(protectContent, 1000);

    return () => {
      clearInterval(protectionInterval);
    };
  }, []);

  return <>{children}</>;
}
