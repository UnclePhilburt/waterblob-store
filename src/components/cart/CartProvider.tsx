'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  customization?: string;
  customImage?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (
    product: { id: number; name: string; price: number; image_url?: string },
    quantity?: number,
    customization?: string | null,
    customImage?: string | null
  ) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  maintenanceMode: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_MAINTENANCE_MODE = process.env.NEXT_PUBLIC_CART_MAINTENANCE_MODE === 'true';

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function readCart(): CartItem[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem('cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem('cart');
      return [];
    }
    return parsed;
  } catch {
    localStorage.removeItem('cart');
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch {
    // Storage full or blocked
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(readCart());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const addToCart: CartContextValue['addToCart'] = useCallback(
    (product, quantity = 1, customization = null, customImage = null) => {
      if (CART_MAINTENANCE_MODE) return;

      setItems((prev) => {
        const shouldMerge = !customization;
        const existing = shouldMerge
          ? prev.find((i) => i.productId === product.id && !i.customization)
          : null;

        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + quantity } : i
          );
        } else {
          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity,
          };
          if (customization) newItem.customization = customization;
          if (customImage) newItem.customImage = customImage;
          next = [...prev, newItem];
        }
        writeCart(next);
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      writeCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        writeCart(next);
        return next;
      });
      return;
    }
    setItems((prev) => {
      const next = prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      writeCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      maintenanceMode: CART_MAINTENANCE_MODE,
    }),
    [items, itemCount, total, addToCart, removeFromCart, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
