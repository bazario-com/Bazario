import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { FlashSaleCountdown } from '@/components/FlashSaleCountdown';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';

export default async function HomePage() {
  const [categories, featured, flashSale] = await Promise.all([
    api.categories.list().catch(() => []),
    api.products.featured().catch(() => []),
    api.products.flashSale().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-card bg-ink text-white">
        <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col justify-center gap-4">
            <span className="inline-block w-fit rounded-full bg-marigold px-3 py-1 text-xs font-bold text-ink">
              New season, new deals
            </span>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Everything you need, from vendors you can trust.
            </h1>
            <p className="text-white/70">
              Thousands of verified sellers. Cash on delivery, card, JazzCash and Easypaisa —
              your choice at checkout.
            </p>
            <Link
              href="/category/electronics"
              className="w-fit rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600"
            >
              Start Shopping
            </Link>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="h-56 w-56 rounded-full bg-white/10" aria-hidden />
          </div>
        </div>
      </section>

      {/* Category strip */}
      {categories.length > 0 && (
        <section aria-labelledby="shop-by-category">
          <h2 id="shop-by-category" className="mb-4 text-lg font-bold">
            Shop by Category
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center gap-2 rounded-card bg-surface p-4 text-center shadow-card transition hover:shadow-cardHover"
              >
                <div className="h-12 w-12 rounded-full bg-base" aria-hidden />
                <span className="text-xs font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash sale rail */}
      {flashSale.length > 0 && (
        <section aria-labelledby="flash-sale" className="rounded-card bg-ink p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="flash-sale" className="text-lg font-bold text-white">
              ⚡ Flash Sale
            </h2>
            <FlashSaleCountdown hoursFromNow={6} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {flashSale.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-products">
          <h2 id="featured-products" className="mb-4 text-lg font-bold">
            Recommended for You
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      {/* Recently viewed (client-rendered, logged-in users only) */}
      <RecentlyViewedSection />
    </div>
  );
}
