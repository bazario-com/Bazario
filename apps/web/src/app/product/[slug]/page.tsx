import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { api, formatPriceCents } from '@/lib/api';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ReviewForm } from '@/components/ReviewForm';
import { RecordProductView } from '@/components/RecordProductView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await api.products.bySlug(params.slug).catch(() => null);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 155),
    openGraph: { title: product.title, description: product.description.slice(0, 155) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await api.products.bySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const defaultVariant = product.variants[0];
  const discountedPriceCents = defaultVariant?.priceCents ?? product.basePriceCents;

  // Structured data (schema.org/Product) so search engines can render rich
  // results — price, availability and rating straight in the SERP snippet.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    brand: product.brand ?? undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: (discountedPriceCents / 100).toFixed(2),
      availability:
        defaultVariant && defaultVariant.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecordProductView productId={product.id} />

      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{' '}
        /{' '}
        <Link href={`/category/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>{' '}
        / <span className="text-ink900text">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-card bg-base">
            <img
              src={`https://placehold.co/600x600/F6F7FB/5B6272?text=${encodeURIComponent(product.title.slice(0, 24))}`}
              alt={product.images[0]?.altText ?? product.title}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(1, 5).map((img) => (
                <div key={img.id} className="h-16 w-16 overflow-hidden rounded-card bg-base">
                  <img src={img.url} alt={img.altText ?? product.title} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {product.brand && <p className="text-sm text-muted">{product.brand}</p>}
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {product.reviewCount > 0 && (
              <p className="mt-1 text-sm text-muted">
                ★ {Number(product.averageRating).toFixed(1)} · {product.reviewCount} reviews
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3 rounded-card bg-base p-4">
            <span className="price-tag text-3xl font-bold text-chili">
              {formatPriceCents(discountedPriceCents)}
            </span>
            {product.discountPct > 0 && (
              <>
                <span className="price-tag text-lg text-muted line-through">
                  {formatPriceCents(product.basePriceCents)}
                </span>
                <span className="rounded-full bg-chili px-2 py-0.5 text-xs font-bold text-white">
                  -{product.discountPct}%
                </span>
              </>
            )}
          </div>

          {defaultVariant && <AddToCartButton variant={defaultVariant} />}

          <div className="rounded-card border border-line p-4 text-sm text-muted">
            <p>✓ Cash on Delivery available</p>
            <p>✓ Sold by {product.vendor.store?.name ?? 'Shopina Marketplace'}</p>
            <p>✓ 7-day return policy</p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted">{product.description}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Reviews ({product.reviewCount})</h2>

            {product.reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet — be the first.</p>
            ) : (
              <ul className="space-y-3">
                {product.reviews.map((review) => (
                  <li key={review.id} className="rounded-card border border-line p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-marigold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="font-medium">{review.user.firstName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="rounded-full bg-marigold-50 px-2 py-0.5 text-xs font-medium text-marigold-600">
                          Verified purchase
                        </span>
                      )}
                    </div>
                    {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                    {review.body && <p className="mt-1 text-sm text-muted">{review.body}</p>}
                  </li>
                ))}
              </ul>
            )}

            <ReviewForm productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
