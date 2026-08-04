'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ShipmentEvent {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  occurredAt: string;
}

interface Shipment {
  id: string;
  courierProvider: string;
  trackingNumber: string | null;
  status: string;
  originCity: string | null;
  destinationCity: string | null;
  estimatedDeliveryAt: string | null;
  events: ShipmentEvent[];
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, authFetch, loading: authLoading } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    authFetch(`/orders/${id}/shipment`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setShipment(data);
      })
      .finally(() => setLoading(false));
  }, [user, id]);

  if (authLoading || loading) return null;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Track Shipment</h1>

      {notFound || !shipment ? (
        <p className="py-16 text-center text-muted">
          No shipment information available yet for this order.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-card bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink">
                {shipment.status}
              </span>
              <span className="text-xs text-muted">via {shipment.courierProvider}</span>
            </div>
            {shipment.trackingNumber && (
              <p className="text-sm">
                Tracking number: <span className="font-semibold">{shipment.trackingNumber}</span>
              </p>
            )}
            {(shipment.originCity || shipment.destinationCity) && (
              <p className="text-sm text-muted">
                {shipment.originCity ?? '—'} → {shipment.destinationCity ?? '—'}
              </p>
            )}
            {shipment.estimatedDeliveryAt && (
              <p className="text-sm text-muted">
                Estimated delivery: {new Date(shipment.estimatedDeliveryAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">History</h2>
            {shipment.events.length === 0 ? (
              <p className="text-sm text-muted">No tracking events yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...shipment.events].reverse().map((event) => (
                  <li key={event.id} className="rounded-card bg-surface p-4 shadow-card">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold">{event.status}</span>
                      <span className="text-xs text-muted">
                        {new Date(event.occurredAt).toLocaleString()}
                      </span>
                    </div>
                    {event.location && <p className="text-xs text-muted">{event.location}</p>}
                    {event.description && <p className="text-sm">{event.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
