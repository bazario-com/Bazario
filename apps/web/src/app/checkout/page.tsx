'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPriceCents } from '@/lib/api';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  isDefault: boolean;
}

const PAYMENT_METHODS: { value: string; label: string; available: boolean }[] = [
  { value: 'COD', label: 'Cash on Delivery', available: true },
  { value: 'CARD', label: 'Credit / Debit Card', available: false },
  { value: 'JAZZCASH', label: 'JazzCash', available: false },
  { value: 'EASYPAISA', label: 'Easypaisa', available: false },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', available: false },
];

export default function CheckoutPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh: refreshCart } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    city: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/addresses')
      .then((res) => res.json())
      .then((data: Address[]) => {
        setAddresses(data);
        const defaultAddr = data.find((a) => a.isDefault) ?? data[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      });
  }, [user, authFetch]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/addresses', { method: 'POST', body: JSON.stringify(newAddress) });
    const created = await res.json();
    if (res.ok) {
      setAddresses((prev) => [...(prev ?? []), created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
    } else {
      setError(created.message ?? 'Could not save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address');
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const res = await authFetch('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: couponCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not place order');
      await refreshCart();
      router.push('/orders?placed=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading || cartLoading) return null;

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Your cart is empty</h1>
        <Link href="/" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Address selection */}
          <section className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-3 font-semibold">Shipping Address</h2>

            {addresses === null ? (
              <p className="text-sm text-muted">Loading addresses…</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block cursor-pointer rounded-card border p-3 text-sm ${
                      selectedAddressId === addr.id ? 'border-ink' : 'border-line'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mr-2"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <span className="font-medium">{addr.label}</span> — {addr.recipientName},{' '}
                    {addr.line1}, {addr.city} ({addr.phone})
                  </label>
                ))}
              </div>
            )}

            {!showNewAddress ? (
              <button
                onClick={() => setShowNewAddress(true)}
                className="mt-3 text-sm font-medium text-ink hover:text-marigold-600"
              >
                + Add a new address
              </button>
            ) : (
              <form onSubmit={handleAddAddress} className="mt-3 space-y-2 rounded-card border border-line p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    placeholder="Label (e.g. Home)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))}
                    className="rounded-card border border-line px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Recipient name"
                    value={newAddress.recipientName}
                    onChange={(e) => setNewAddress((a) => ({ ...a, recipientName: e.target.value }))}
                    className="rounded-card border border-line px-3 py-2 text-sm"
                  />
                </div>
                <input
                  required
                  placeholder="Phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))}
                  className="w-full rounded-card border border-line px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Address line"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress((a) => ({ ...a, line1: e.target.value }))}
                  className="w-full rounded-card border border-line px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                  className="w-full rounded-card border border-line px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white">
                    Save address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(false)}
                    className="rounded-card border border-line px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Payment method */}
          <section className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-3 font-semibold">Payment Method</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center justify-between rounded-card border p-3 text-sm ${
                    method.available ? '' : 'opacity-50'
                  } ${paymentMethod === method.value ? 'border-ink' : 'border-line'}`}
                >
                  <span>
                    <input
                      type="radio"
                      name="payment"
                      className="mr-2"
                      disabled={!method.available}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    {method.label}
                  </span>
                  {!method.available && <span className="text-xs text-muted">Coming soon</span>}
                </label>
              ))}
            </div>
          </section>

          {/* Coupon */}
          <section className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-3 font-semibold">Coupon Code</h2>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code (optional)"
              className="w-full rounded-card border border-line px-4 py-2.5"
            />
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit space-y-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Order Summary</h2>
          <ul className="space-y-1 text-sm text-muted">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span className="line-clamp-1">
                  {item.product.title} × {item.quantity}
                </span>
                <span className="price-tag">
                  {formatPriceCents(item.variant.priceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line pt-3 font-semibold">
            <span>Subtotal</span>
            <span className="price-tag">{formatPriceCents(cart.subtotalCents)}</span>
          </div>
          <p className="text-xs text-muted">
            Final total (including any coupon discount) is confirmed after you place the order.
          </p>

          {error && <p className="text-sm text-chili">{error}</p>}

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600 disabled:opacity-60"
          >
            {placing ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </div>
    </div>
  );
}
