import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (item: CartItem) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (i) => i.id === item.id && i.variantId === item.variantId
        );

        let newItems: CartItem[];

        if (existingItemIndex > -1) {
          newItems = [...items];
          newItems[existingItemIndex].quantity += item.quantity;
        } else {
          newItems = [...items, item];
        }

        const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalPrice,
        });
      },

      removeItem: (id: string, variantId?: string) => {
        const { items } = get();
        const newItems = items.filter(
          (item) => !(item.id === id && item.variantId === variantId)
        );

        const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalPrice,
        });
      },

      updateQuantity: (id: string, quantity: number, variantId?: string) => {
        const { items } = get();
        const newItems = items.map((item) => {
          if (item.id === id && item.variantId === variantId) {
            return { ...item, quantity };
          }
          return item;
        });

        const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalPrice,
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
); 