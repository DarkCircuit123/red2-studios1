import { create } from 'zustand';
import { CartItem, CartState } from '../ecom-service';

interface CartStore extends CartState {
  actions: {
    addToCart: (item: Omit<CartItem, 'id'> & { quantity?: number }) => Promise<void>;
    removeFromCart: (item: CartItem) => void;
    updateQuantity: (item: CartItem, quantity: number) => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    clearCart: () => void;
    checkout: () => Promise<void>;
  };
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  itemCount: 0,
  totalPrice: 0,
  isOpen: false,
  addingItemId: null,
  isCheckingOut: false,

  actions: {
    addToCart: async (item) => {
      set({ addingItemId: item.itemId });
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => {
          const existingItem = state.items.find(
            i => i.itemId === item.itemId && i.collectionId === item.collectionId
          );

          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map(i =>
              i.itemId === item.itemId && i.collectionId === item.collectionId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            );
          } else {
            newItems = [
              ...state.items,
              {
                ...item,
                id: `${item.collectionId}-${item.itemId}`,
                quantity: item.quantity || 1,
              },
            ];
          }

          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

          return {
            items: newItems,
            itemCount,
            totalPrice,
            addingItemId: null,
          };
        });
      } catch (error) {
        console.error('[CART] Error adding to cart:', error);
        set({ addingItemId: null });
        throw error;
      }
    },

    removeFromCart: (item) => {
      set(state => {
        const newItems = state.items.filter(i => i.id !== item.id);
        const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        return {
          items: newItems,
          itemCount,
          totalPrice,
        };
      });
    },

    updateQuantity: (item, quantity) => {
      set(state => {
        const newItems = state.items.map(i =>
          i.id === item.id ? { ...i, quantity } : i
        );
        const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        return {
          items: newItems,
          itemCount,
          totalPrice,
        };
      });
    },

    toggleCart: () => {
      set(state => ({ isOpen: !state.isOpen }));
    },

    openCart: () => {
      set({ isOpen: true });
    },

    closeCart: () => {
      set({ isOpen: false });
    },

    clearCart: () => {
      set({
        items: [],
        itemCount: 0,
        totalPrice: 0,
      });
    },

    checkout: async () => {
      set({ isCheckingOut: true });
      try {
        // Simulate checkout
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({
          items: [],
          itemCount: 0,
          totalPrice: 0,
          isOpen: false,
          isCheckingOut: false,
        });
      } catch (error) {
        console.error('[CART] Checkout error:', error);
        set({ isCheckingOut: false });
        throw error;
      }
    },
  },
}));
