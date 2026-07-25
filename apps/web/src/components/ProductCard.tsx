import Link from 'next/link';
import type { ProductSummary } from '@/lib/api';
import { formatPriceCents } from '@/lib/api';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product }: { product: ProductSummary }) {
  const discountedPriceCents = Math.round(
    product.basePriceCents * (1 - product.discountPct / 100),
  );
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative block overflow-hidden rounded-card bg-surface shadow-card transition hover:shadow-cardHover"
    >
      {product.discountPct > 0 && (
        <div className="corner-ribbon">
          <span>-{product.discountPct}%</span>
        </div>
      )}

      <WishlistButton productId={product.id} />

      <div className="aspect-square bg-base">
        {image ? (
          // Seed data uses placeholder filenames rather than real hosted
          // images for this pass — a plain <img> with graceful fallback
          // avoids next/image failing on unresolvable seed URLs.
          <img
            src={`https://placehold.co/400x400/F6F7FB/5B6272?text=${encodeURIComponent(product.title.slice(0, 20))}`}
            alt={image.altText ?? product.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">No image</div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm text-ink900text">{product.title}</p>
        <div className="flex items-baseline gap-2">
          <span className="price-tag text-base font-semibold text-chili">
            {formatPriceCents(discountedPriceCents)}
          </span>
          {product.discountPct > 0 && (
            <span className="price-tag text-xs text-muted line-through">
              {formatPriceCents(product.basePriceCents)}
            </span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <p className="text-xs text-muted">
            ★ {Number(product.averageRating).toFixed(1)} · {product.reviewCount} sold
          </p>
        )}
      </div>
    </Link>
  );
}
