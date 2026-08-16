'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface VendorOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  paymentMethod: string;
  placedAt: string;
  items: { titleSnapshot: string; quantity: number }[];
  user: { firstName: string; lastName: string };
  shippingAddress: { line1: string; city: string; phone: string };
}

// Mirrors the backend's ALLOWED_TRANSITIONS map, purely for UX (only
// showing buttons that will actually succeed) — the backend is the real
// enforcement point regardless of what's rendered here.
const NEXT_ACTIONS: Record<string, { label: string; status: string }[]> = {
  CONFIRMED: [
    { label: 'Start Processing', status: 'PROCESSING' },
    { label: 'Cancel', status: 'CANCELLED' },
  ],
  PROCESSING: [
    { label: 'Mark Shipped', status: 'SHIPPED' },
    { label: 'Cancel', status: 'CANCELLED' },
  ],
  SHIPPED: [{ label: 'Mark Delivered', status: 'DELIVERED' }],
};

export default function VendorOrdersPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => authFetch('/vendors/me/orders').then((res) => res.json()).then(setOrders);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await authFetch(`/vendors/me/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await authFetch(`/admin/shipments/order/${orderId}`, { method: 'POST' });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading) return null;
  if (!user) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Orders</h1>

      {orders === null ? (
        <p className="text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-muted">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card bg-surface p-5 shadow-card">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {order.user.firstName} {order.user.lastName} · {order.shippingAddress.city} ·{' '}
                    {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink">
                  {order.status}
                </span>
              </div>

              <ul className="mb-3 text-sm text-muted">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.titleSnapshot} × {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="price-tag font-semibold">{formatPriceCents(order.totalCents)}</span>
                <div className="flex gap-2">
                  {(NEXT_ACTIONS[order.status] ?? []).map((action) => (
                    <button
                      key={action.status}
                      disabled={updating === order.id}
                      onClick={() => handleStatusChange(order.id, action.status)}
                      className={`rounded-card px-3 py-1.5 text-sm font-medium ${
                        action.status === 'CANCELLED'
                          ? 'border border-chili text-chili hover:bg-chili-50'
                          : 'bg-ink text-white hover:bg-ink-700'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                  {order.status === 'PROCESSING' && (
                    <button
                      disabled={updating === order.id}
                      onClick={() => handleCreateShipment(order.id)}
                      className="rounded-card px-3 py-1.5 text-sm font-medium bg-ink-700 text-white hover:bg-ink-900"
                    >
                      Create Shipment
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
