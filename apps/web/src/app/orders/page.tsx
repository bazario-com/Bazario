'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface OrderItem {
  id: string;
  titleSnapshot: string;
  quantity: number;
  lineTotalCents: number;
}

interface Order {
  id: string;
  orderNumber: string;
  orderGroupId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalCents: number;
  placedAt: string;
  items: OrderItem[];
  vendor: { store: { name: string } | null };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-marigold-50 text-marigold-600',
  CONFIRMED: 'bg-ink-50 text-ink',
  PROCESSING: 'bg-ink-50 text-ink',
  SHIPPED: 'bg-ink-50 text-ink',
  DELIVERED: 'bg-marigold-50 text-marigold-600',
  CANCELLED: 'bg-chili-50 text-chili-600',
  RETURNED: 'bg-chili-50 text-chili-600',
  REFUNDED: 'bg-chili-50 text-chili-600',
};

function OrdersContent() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const params = useSearchParams();
  const justPlaced = params.get('placed') === '1';

  useEffect(() => {
    if (!user) return;
    authFetch('/orders')
      .then((res) => res.json())
      .then(setOrders);
  }, [user, authFetch]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your orders</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Your Orders</h1>

      {justPlaced && (
        <p className="mb-6 rounded-card bg-marigold-50 px-4 py-3 text-sm font-medium text-marigold-600">
          🎉 Order placed! You'll pay on delivery for COD orders.
        </p>
      )}

      {orders === null ? (
        <p className="text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-muted">You haven't placed any orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card bg-surface p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    Sold by {order.vendor.store?.name ?? 'Marketplace vendor'} ·{' '}
                    {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-line text-muted'}`}
                >
                  {order.status}
                </span>
              </div>

              <ul className="mb-3 space-y-1 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.titleSnapshot} × {item.quantity}
                    </span>
                    <span className="price-tag">{formatPriceCents(item.lineTotalCents)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm text-muted">
                  {order.paymentMethod} · {order.paymentStatus}
                </span>
                <span className="price-tag font-semibold">{formatPriceCents(order.totalCents)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersContent />
    </Suspense>
  );
}
