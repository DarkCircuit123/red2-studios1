/**
 * eCommerce Service - Handles cart and checkout operations
 */

export interface CartItem {
  id: string;
  collectionId: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  isOpen: boolean;
  addingItemId: string | null;
  isCheckingOut: boolean;
}

/**
 * Buy now - direct checkout for one or more items
 */
export const buyNow = async (items: Array<{ collectionId: string; itemId: string; quantity?: number }>) => {
  try {
    // This would integrate with Wix Stores checkout
    // For now, this is a placeholder
    console.log('[ECOM] Buy now:', items);
  } catch (error) {
    console.error('[ECOM] Buy now error:', error);
    throw error;
  }
};

// Re-export cart types for convenience
export type { CartStore } from './cart/useCartStore';
