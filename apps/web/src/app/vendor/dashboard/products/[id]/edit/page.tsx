'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { VendorProductForm, VendorProductFormValues } from '@/components/VendorProductForm';

export default function EditVendorProductPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const [initialValues, setInitialValues] = useState<Partial<VendorProductFormValues> | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch(`/vendors/me/products/${id}`)
      .then((res) => res.json())
      .then((p) => {
        const variant = p.variants[0] ?? {};
        setInitialValues({
          title: p.title,
          categoryId: p.categoryId,
          description: p.description,
          brand: p.brand ?? '',
          basePriceCents: p.basePriceCents,
          discountPct: p.discountPct,
          imageUrl: p.images[0]?.url ?? '',
          sku: variant.sku ?? '',
          priceCents: variant.priceCents ?? p.basePriceCents,
          stockQuantity: variant.stockQuantity ?? 0,
        });
      });
  }, [id, user, authFetch]);

  if (!initialValues) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Product</h1>
      <VendorProductForm mode="edit" productId={id} initialValues={initialValues} />
    </div>
  );
}
