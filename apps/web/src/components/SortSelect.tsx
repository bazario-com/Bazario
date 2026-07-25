'use client';

import { useRouter } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'best_selling', label: 'Best Selling' },
];

export function SortSelect({ categorySlug, currentSort }: { categorySlug: string; currentSort: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-muted">
        Sort by
      </label>
      <select
        id="sort"
        defaultValue={currentSort}
        className="rounded-card border border-line bg-surface px-3 py-2"
        onChange={(e) => router.push(`/category/${categorySlug}?sort=${e.target.value}`)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
