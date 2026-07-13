import { useEffect } from 'react';

/**
 * Hook to set SEO meta tags for client gallery pages
 * Adds noindex/nofollow to prevent search engine indexing
 */
export const useGallerySEO = () => {
  useEffect(() => {
    // Create or update robots meta tag
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    // Create or update X-Robots-Tag header (for server-side)
    let xRobotsMeta = document.querySelector('meta[http-equiv="X-UA-Compatible"]');
    if (!xRobotsMeta) {
      xRobotsMeta = document.createElement('meta');
      xRobotsMeta.setAttribute('http-equiv', 'X-UA-Compatible');
      document.head.appendChild(xRobotsMeta);
    }

    return () => {
      // Clean up on unmount
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);
};
