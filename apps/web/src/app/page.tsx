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
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-card bg-gradient-to-br from-ink-50 via-white to-marigold-50">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="flex flex-col justify-center gap-5">
            <span className="inline-block w-fit rounded-full bg-marigold px-3 py-1 text-xs font-bold text-ink-700">
              New season, new deals
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-ink-700 md:text-5xl">
              Shop more,
              <br />
              live more.
            </h1>
            <p className="max-w-md text-ink-400">
              Everything you love, all in one place. Discover top products from trusted sellers
              across Pakistan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/category/electronics"
                className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700 transition hover:bg-marigold-600"
              >
                Start Shopping
              </Link>
              <Link
                href="/search"
                className="rounded-card border border-ink-100 bg-white px-6 py-3 font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                Explore Deals
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-400">
              <span>✓ Secure Payments</span>
              <span>✓ Easy Returns</span>
              <span>✓ Fast Delivery</span>
              <span>✓ Verified Sellers</span>
              <span>✓ 100% Safe</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-marigold-100 to-ink-100 md:h-72 md:w-72" aria-hidden />
            <img src="/logo.png" alt="Shopina" className="relative h-36 w-36 object-contain drop-shadow-xl md:h-64 md:w-64" />
          </div>
        </div>
      </section>

      {/* Category strip */}
      {categories.length > 0 && (
        <section id="categories" aria-labelledby="shop-by-category">
          <div className="mb-5">
            <h2 id="shop-by-category" className="text-xl font-display font-bold text-ink-700">
              Explore Shopina
            </h2>
            <p className="text-sm text-ink-400">Everything you need, all in one place.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-card bg-surface p-4 text-center shadow-card transition hover:-translate-y-1 hover:shadow-cardHover"
              >
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-base" aria-hidden />
                )}
                <span className="text-xs font-medium text-ink-700">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash sale rail */}
      {flashSale.length > 0 && (
        <section id="mega-deals" aria-labelledby="flash-sale" className="rounded-card bg-ink p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="flash-sale" className="text-xl font-display font-bold text-white">
              🔥 Today's Mega Deals
            </h2>
            <div className="flex items-center gap-4">
              <FlashSaleCountdown hoursFromNow={6} />
              <Link href="/deals" className="text-sm font-semibold text-marigold hover:text-marigold-400">
                View All Deals →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {flashSale.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner row */}
      <section id="shopina-picks" aria-label="Shopina highlights" className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/search?sort=rating"
          className="group flex flex-col justify-between overflow-hidden rounded-card bg-ink-700 p-6 text-white transition hover:opacity-95"
        >
          <div>
            <p className="text-lg font-display font-bold">Shopina Picks</p>
            <p className="text-sm text-white/70">Curated just for you</p>
          </div>
          <span className="mt-4 inline-block w-fit rounded-card bg-marigold px-4 py-2 text-sm font-semibold text-ink-700 transition group-hover:bg-marigold-600">
            Explore Picks →
          </span>
        </Link>

        <Link
          href="/search?sort=newest"
          className="group flex flex-col justify-between overflow-hidden rounded-card bg-ink-50 p-6 text-ink-700 transition hover:bg-marigold-50"
        >
          <div>
            <p className="text-lg font-display font-bold">New Arrivals</p>
            <p className="text-sm text-ink-400">Fresh finds every day</p>
          </div>
          <span className="mt-4 inline-block w-fit rounded-card border border-ink-700 px-4 py-2 text-sm font-semibold text-ink-700 transition group-hover:border-marigold-600 group-hover:text-marigold-600">
            Shop Now →
          </span>
        </Link>

        <Link
          href="/deals"
          className="group flex flex-col justify-between overflow-hidden rounded-card bg-chili p-6 text-white transition hover:opacity-95"
        >
          <div>
            <p className="text-lg font-display font-bold">Up to 70% OFF</p>
            <p className="text-sm text-white/80">On top brands</p>
          </div>
          <span className="mt-4 inline-block w-fit rounded-card bg-white px-4 py-2 text-sm font-semibold text-chili transition group-hover:bg-marigold-50">
            Shop Deals →
          </span>
        </Link>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-products">
          <h2 id="featured-products" className="mb-5 text-xl font-display font-bold text-ink-700">
            Recommended for You
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Sell on Shopina */}
      <section className="rounded-card bg-ink-50 p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-2 font-display text-2xl font-bold text-ink-700">
              Sell on Shopina
            </h2>
            <p className="mb-2 text-lg font-semibold text-ink-700">Grow Your Business Online</p>
            <p className="mb-5 max-w-md text-sm text-ink-400">
              Join thousands of successful sellers on Shopina and reach millions of customers
              across Pakistan.
            </p>
            <Link
              href="/vendor/register"
              className="inline-block rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700 transition hover:bg-marigold-600"
            >
              Start Selling Now →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { step: '01', label: 'Create Store' },
              { step: '02', label: 'Add Products' },
              { step: '03', label: 'Reach Customers' },
              { step: '04', label: 'Grow Business' },
            ].map((s) => (
              <div key={s.step} className="rounded-card bg-white p-4 text-center shadow-card">
                <p className="mb-1 font-display text-lg font-extrabold text-marigold-600">{s.step}</p>
                <p className="text-xs font-medium text-ink-700">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently viewed (client-rendered, logged-in users only) */}
      <RecentlyViewedSection />
    </div>
  );
}
