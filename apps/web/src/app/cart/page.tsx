'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPriceCents } from '@/lib/api';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading, error, updateItem, removeItem } = useCart();
  const router = useRouter();

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your cart</h1>
        <p className="mb-6 text-muted">Your cart is saved to your account so it's there when you come back.</p>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Your cart is empty</h1>
        <p className="mb-6 text-muted">Add something you like — it'll show up here.</p>
        <Link href="/" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Cart ({cart.itemCount})</h1>

      {error && (
        <p className="mb-4 rounded-card bg-chili-50 px-4 py-2 text-sm text-chili-600">{error}</p>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-card bg-surface p-4 shadow-card"
            >
              <div className="h-20 w-20 shrink-0 rounded-card bg-base" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/product/${item.product.slug}`} className="font-medium hover:text-ink">
                    {item.product.title}
                  </Link>
                  {Object.entries(item.variant.optionsJson ?? {}).length > 0 && (
                    <p className="text-xs text-muted">
                      {Object.entries(item.variant.optionsJson)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`qty-${item.id}`} className="sr-only">
                      Quantity
                    </label>
                    <select
                      id={`qty-${item.id}`}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, Number(e.target.value))}
                      disabled={loading}
                      className="rounded-card border border-line px-2 py-1 text-sm"
                    >
                      {Array.from({ length: Math.min(10, item.variant.stockQuantity) }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                      className="text-sm text-muted hover:text-chili"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="price-tag font-semibold">
                    {formatPriceCents(item.variant.priceCents * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span className="price-tag">{formatPriceCents(cart.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-semibold">
            <span>Total</span>
            <span className="price-tag">{formatPriceCents(cart.subtotalCents)}</span>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
