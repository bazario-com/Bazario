'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export interface VendorProductFormValues {
  title: string;
  categoryId: string;
  description: string;
  brand: string;
  basePriceCents: number;
  discountPct: number;
  imageUrl: string;
  sku: string;
  priceCents: number;
  stockQuantity: number;
}

const EMPTY: VendorProductFormValues = {
  title: '',
  categoryId: '',
  description: '',
  brand: '',
  basePriceCents: 0,
  discountPct: 0,
  imageUrl: '',
  sku: '',
  priceCents: 0,
  stockQuantity: 0,
};

export function VendorProductForm({
  mode,
  productId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  productId?: string;
  initialValues?: Partial<VendorProductFormValues>;
}) {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<VendorProductFormValues>({ ...EMPTY, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const set = <K extends keyof VendorProductFormValues>(key: K, value: VendorProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      title: values.title,
      categoryId: values.categoryId,
      description: values.description,
      brand: values.brand || undefined,
      basePriceCents: values.basePriceCents,
      discountPct: values.discountPct,
      imageUrls: [values.imageUrl],
      variants: [
        {
          sku: values.sku,
          priceCents: values.priceCents || values.basePriceCents,
          stockQuantity: values.stockQuantity,
        },
      ],
    };

    try {
      const url = mode === 'create' ? '/vendors/me/products' : `/vendors/me/products/${productId}`;
      const res = await authFetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not save product');
      router.push('/vendor/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Product title</label>
        <input
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          required
          value={values.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              <option value={cat.id}>{cat.name} (general)</option>
              {cat.children?.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          required
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Brand (optional)</label>
          <input
            value={values.brand}
            onChange={(e) => set('brand', e.target.value)}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount % (optional)</label>
          <input
            type="number"
            min={0}
            max={90}
            value={values.discountPct}
            onChange={(e) => set('discountPct', Number(e.target.value))}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Product image URL</label>
        <input
          required
          type="url"
          placeholder="https://…"
          value={values.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          className="w-full rounded-card border border-line px-4 py-2.5"
        />
        <p className="mt-1 text-xs text-muted">
          Paste a hosted image URL — direct image upload arrives with S3 storage integration.
        </p>
      </div>

      <div className="rounded-card border border-line p-4">
        <p className="mb-3 text-sm font-medium">Pricing &amp; stock</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">SKU</label>
            <input
              required
              value={values.sku}
              onChange={(e) => set('sku', e.target.value)}
              className="w-full rounded-card border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Price (PKR, in rupees)</label>
            <input
              required
              type="number"
              min={1}
              value={values.basePriceCents / 100 || ''}
              onChange={(e) => set('basePriceCents', Math.round(Number(e.target.value) * 100))}
              className="w-full rounded-card border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Stock quantity</label>
            <input
              required
              type="number"
              min={0}
              value={values.stockQuantity}
              onChange={(e) => set('stockQuantity', Number(e.target.value))}
              className="w-full rounded-card border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          This phase supports one SKU per product — multiple variants (size/color) arrive in a
          later pass.
        </p>
      </div>

      {error && <p className="text-sm text-chili">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink hover:bg-marigold-600 disabled:opacity-60"
      >
        {submitting ? 'Saving…' : mode === 'create' ? 'Submit for Approval' : 'Save Changes'}
      </button>
    </form>
  );
}
