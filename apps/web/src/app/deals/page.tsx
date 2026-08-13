import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

export default async function DealsPage() {
  const flashSale = await api.products.flashSale().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-2 text-xl font-display font-bold text-ink-700">🔥 Today's Mega Deals</h1>
      <p className="mb-6 text-sm text-muted">All active discounts across Shopina, updated daily.</p>

      {flashSale.length === 0 ? (
        <p className="py-16 text-center text-muted">No active deals right now — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {flashSale.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
