import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q ?? '';
  const page = Number(searchParams.page ?? 1);

  const { items, pagination } = query
    ? await api.products.list({ search: query, page })
    : { items: [], pagination: { page: 1, pageSize: 24, total: 0, totalPages: 0 } };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">
        {query ? (
          <>
            Search results for <span className="text-muted">"{query}"</span> ({pagination.total})
          </>
        ) : (
          'Search'
        )}
      </h1>

      {query && items.length === 0 && (
        <p className="py-16 text-center text-muted">
          No products matched your search — try different keywords.
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
