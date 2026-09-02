import { BaseCrudService } from '@/integrations';
import type { Portfolio } from '@/entities';

export async function POST(request: Request) {
  try {
    // Get all portfolio images
    const result = await BaseCrudService.getAll<Portfolio>('portfolioimages');
    const allItems = result.items || [];

    // Filter items with empty image field
    const orphanedItems = allItems.filter(item => !item.image || item.image.trim() === '');

    if (orphanedItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No orphaned items found',
          deletedCount: 0,
          totalItems: allItems.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete orphaned items
    let deletedCount = 0;
    const errors: string[] = [];

    for (const item of orphanedItems) {
      try {
        await BaseCrudService.delete('portfolioimages', item._id);
        deletedCount++;
      } catch (error) {
        errors.push(`Failed to delete item ${item._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed. Deleted ${deletedCount} orphaned items.`,
        deletedCount,
        totalItems: allItems.length,
        remainingItems: allItems.length - deletedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
