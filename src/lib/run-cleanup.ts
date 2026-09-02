/**
 * Cleanup script to remove orphaned portfolio images
 * Run this from the browser console or call the API endpoint
 */

export async function runPortfolioImageCleanup() {
  try {
    console.log('Starting portfolio image cleanup...');
    
    const response = await fetch('/api/cleanup-portfolio-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Cleanup completed successfully!');
      console.log(`📊 Results:
        - Total items: ${result.totalItems}
        - Deleted: ${result.deletedCount}
        - Remaining: ${result.remainingItems}
        - Message: ${result.message}`);

      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ Errors encountered:');
        result.errors.forEach((error: string) => console.warn(`  - ${error}`));
      }
    } else {
      console.error('❌ Cleanup failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error running cleanup:', error);
    throw error;
  }
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).runPortfolioImageCleanup = runPortfolioImageCleanup;
}
