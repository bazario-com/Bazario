'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import type { ProductVariant } from '@/lib/api';

export function AddToCartButton({ variant }: { variant: ProductVariant }) {
  const { user } = useAuth();
  const { addItem, error } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    await addItem(variant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const outOfStock = variant.stockQuantity <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm text-muted">
          Qty
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-card border border-line px-3 py-2"
          disabled={outOfStock}
        >
          {Array.from({ length: Math.min(10, variant.stockQuantity || 1) }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ),
          )}
        </select>
        <span className="text-xs text-muted">
          {outOfStock ? 'Out of stock' : `${variant.stockQuantity} available`}
        </span>
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className="w-full rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted md:w-auto"
      >
        {added ? 'Added ✓' : 'Add to Cart'}
      </button>

      {error && <p className="text-sm text-chili">{error}</p>}
    </div>
  );
}
