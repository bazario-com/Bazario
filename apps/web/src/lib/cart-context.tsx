'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';

export interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  variantId: string;
  product: { title: string; slug: string; images: { url: string }[] };
  variant: { priceCents: number; stockQuantity: number; optionsJson: Record<string, string> };
}

export interface CartState {
  id: string;
  items: CartItem[];
  subtotalCents: number;
  itemCount: number;
}

interface CartContextValue {
  cart: CartState | null;
  loading: boolean;
  error: string | null;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { authFetch, user } = useAuth();
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/cart');
      if (res.ok) setCart(await res.json());
    } finally {
      setLoading(false);
    }
  }, [authFetch, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMutation = async (request: () => Promise<Response>) => {
    setError(null);
    setLoading(true);
    try {
      const res = await request();
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? 'Something went wrong');
        return;
      }
      setCart(body);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (variantId: string, quantity = 1) =>
    handleMutation(() =>
      authFetch('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) }),
    );

  const updateItem = (itemId: string, quantity: number) =>
    handleMutation(() =>
      authFetch(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    );

  const removeItem = (itemId: string) =>
    handleMutation(() => authFetch(`/cart/items/${itemId}`, { method: 'DELETE' }));

  return (
    <CartContext.Provider value={{ cart, loading, error, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
