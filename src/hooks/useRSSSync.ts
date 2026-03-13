import { useEffect } from 'react';

/**
 * Hook to sync RSS feed on component mount
 * Fetches and processes new stories from the RSS feed
 */
export function useRSSSync() {
  useEffect(() => {
    const syncFeed = async () => {
      try {
        const response = await fetch('/api/stories', {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`RSS Sync: ${data.itemsAdded} new items added`);
        }
      } catch (error) {
        console.error('Error syncing RSS feed:', error);
      }
    };

    // Sync on mount
    syncFeed();

    // Schedule sync every 6 hours
    const interval = setInterval(syncFeed, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
}
