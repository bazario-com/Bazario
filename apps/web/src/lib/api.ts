const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface TopStore {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  productCount: number;
  reviewCount: number;
  rating: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  optionsJson: Record<string, string>;
  priceCents: number;
  stockQuantity: number;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  basePriceCents: number;
  discountPct: number;
  averageRating: string;
  reviewCount: number;
  images: ProductImage[];
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl?: string | null };
}

export interface ProductDetail extends ProductSummary {
  description: string;
  variants: ProductVariant[];
  vendor: { store: { name: string; slug: string } | null };
  category: { name: string; slug: string };
  reviews: Review[];
}

export interface PaginatedProducts {
  items: ProductSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  children?: Category[];
}

// Thin fetch wrapper: consistent error surfacing, and `cache`/`next` options
// passed straight through so callers can opt into SSG/ISR per request.
async function apiFetch<T>(path: string, init?: RequestInit & { next?: { revalidate?: number } }): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request to ${path} failed with ${res.status}`);
  }

  return res.json();
}

export const api = {
  categories: {
    list: () => apiFetch<Category[]>('/categories', { next: { revalidate: 300 } }),
    bySlug: (slug: string) => apiFetch<Category>(`/categories/${slug}`, { next: { revalidate: 300 } }),
  },
  products: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) search.set(key, String(value));
      });
      return apiFetch<PaginatedProducts>(`/products?${search.toString()}`, {
        next: { revalidate: 60 },
      });
    },
    featured: () => apiFetch<ProductSummary[]>('/products/featured', { next: { revalidate: 120 } }),
    flashSale: () => apiFetch<ProductSummary[]>('/products/flash-sale', { next: { revalidate: 60 } }),
    bySlug: (slug: string) => apiFetch<ProductDetail>(`/products/${slug}`, { next: { revalidate: 60 } }),
  },
  newsletter: {
    subscribe: (email: string) =>
      apiFetch<{ id: string; email: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
  vendors: {
    topStores: (limit = 6) =>
      apiFetch<TopStore[]>(`/vendors/top?limit=${limit}`, { next: { revalidate: 300 } }),
  },
};

export function formatPriceCents(cents: number, currency = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
