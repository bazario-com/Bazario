import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; sort?: string; category?: string };
}) {
  const query = searchParams.q ?? '';
  const page = Number(searchParams.page ?? 1);
  const sort = searchParams.sort;
  const hasCriteria = Boolean(query || sort || searchParams.category);

  const { items, pagination } = hasCriteria
    ? await api.products.list({
        search: query || undefined,
        page,
        sort: sort as any,
        categorySlug: searchParams.category,
      })
    : { items: [], pagination: { page: 1, pageSize: 24, total: 0, totalPages: 0 } };

  const heading = query
    ? `Search results for "${query}" (${pagination.total})`
    : sort === 'newest'
      ? 'New Arrivals'
      : sort === 'rating'
        ? 'Shopina Picks'
        : 'Search';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">{heading}</h1>

      {hasCriteria && items.length === 0 && (
        <p className="py-16 text-center text-muted">
          No products matched — try different keywords or check back soon.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
