'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from '@/lib/api';

interface RecentlyViewedEntry {
  product: ProductSummary;
}

export function RecentlyViewedSection() {
  const { user, authFetch } = useAuth();
  const [items, setItems] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    authFetch('/recently-viewed')
      .then((res) => (res.ok ? res.json() : []))
      .then(setItems)
      .catch(() => {});
  }, [user, authFetch]);

  if (!user || items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed">
      <h2 id="recently-viewed" className="mb-4 text-lg font-bold">
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {items.map(({ product }) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
