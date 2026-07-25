import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { SortSelect } from '@/components/SortSelect';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string; page?: string };
}) {
  const category = await api.categories.bySlug(params.slug).catch(() => null);
  if (!category) notFound();

  const page = Number(searchParams.page ?? 1);
  const sort = searchParams.sort ?? 'newest';
  const { items, pagination } = await api.products.list({
    categorySlug: params.slug,
    sort,
    page,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{' '}
        / <span className="text-ink900text">{category.name}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <SortSelect categorySlug={params.slug} currentSort={sort} />
      </div>

      {category.children && category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child: any) => (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink hover:text-ink"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted">
          No products in this category yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/category/${params.slug}?sort=${sort}&page=${p}`}
              className={`rounded-card px-3 py-1.5 text-sm ${
                p === page ? 'bg-ink text-white' : 'border border-line hover:border-ink'
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
