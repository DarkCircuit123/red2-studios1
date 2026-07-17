import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Component to handle automatic scroll management
export function ScrollToTop() {
  const location = useLocation();
  const prevLocationRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if this is the same page (same pathname)
    const isSamePage = prevLocationRef.current === location.pathname;

    // Check if the URL has a hash
    if (location.hash) {
      // URL with hash: Scroll to the target element with fixed header offset
      const scrollToElement = () => {
        const element = document.getElementById(location.hash.slice(1));
        if (element) {
          // Account for fixed header (80px) + extra padding for better visibility
          const headerHeight = 100;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({
            top: Math.max(0, elementPosition),
            behavior: 'smooth'
          });
        }
      };
      
      // Multiple attempts to ensure scroll happens after page renders
      setTimeout(scrollToElement, 100);
      setTimeout(scrollToElement, 300);
      setTimeout(scrollToElement, 600);
    } else {
      // URL without hash: Scroll to the top of the page
      // Use smooth animation if same page, auto if different page
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: isSamePage ? 'smooth' : 'auto'
      });
    }

    // Update the previous location reference
    prevLocationRef.current = location.pathname;
  }, [location]);

  return null;
}
