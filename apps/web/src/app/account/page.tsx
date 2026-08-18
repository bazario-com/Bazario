'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, formatPriceCents } from '@/lib/api';
import type { Category, ProductSummary } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';

interface OrderItem {
  id: string;
  titleSnapshot: string;
  quantity: number;
  lineTotalCents: number;
  product?: { images: { url: string }[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  placedAt: string;
  items: OrderItem[];
  vendor: { store: { name: string } | null };
}

interface FollowedStore {
  id: string;
  store: { id: string; name: string; slug: string; logoUrl: string | null };
}

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
const NEXT_MILESTONE = 2000;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-marigold-50 text-marigold-600',
  CONFIRMED: 'bg-ink-50 text-ink-700',
  PROCESSING: 'bg-ink-50 text-ink-700',
  SHIPPED: 'bg-ink-50 text-ink-700',
};

export default function AccountDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);
  const [couponsCount, setCouponsCount] = useState<number | null>(null);
  const [rewards, setRewards] = useState<{ pointsBalance: number } | null>(null);
  const [referral, setReferral] = useState<{ code: string; referredCount: number } | null>(null);
  const [followedStores, setFollowedStores] = useState<FollowedStore[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommended, setRecommended] = useState<ProductSummary[]>([]);
  const [deals, setDeals] = useState<ProductSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    authFetch('/orders').then((res) => (res.ok ? res.json() : [])).then(setOrders).catch(() => setOrders([]));
    authFetch('/wishlist')
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => setWishlistCount(items.length))
      .catch(() => setWishlistCount(0));
    authFetch('/coupons/me')
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => setCouponsCount(items.length))
      .catch(() => setCouponsCount(0));
    authFetch('/rewards/me')
      .then((res) => (res.ok ? res.json() : { pointsBalance: 0 }))
      .then(setRewards)
      .catch(() => setRewards({ pointsBalance: 0 }));
    authFetch('/referrals/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setReferral)
      .catch(() => setReferral(null));
    authFetch('/store-follows')
      .then((res) => (res.ok ? res.json() : []))
      .then(setFollowedStores)
      .catch(() => setFollowedStores([]));
  }, [user, authFetch]);

  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => setCategories([]));
    api.products.featured().then(setRecommended).catch(() => setRecommended([]));
    api.products.flashSale().then(setDeals).catch(() => setDeals([]));
  }, []);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your dashboard</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700">
          Log in
        </Link>
      </div>
    );
  }

  const activeOrders = orders?.filter((o) => ACTIVE_STATUSES.includes(o.status)) ?? [];

  const shareReferral = async () => {
    if (!referral) return;
    const text = `Join me on Shopina! Use my code ${referral.code} — https://www.shopina.pk/register?ref=${referral.code}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-card bg-gradient-to-br from-ink-50 via-white to-marigold-50 p-6 md:p-10">
        <p className="text-sm font-medium text-ink-400">Hello, {user.firstName} 👋</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-700 md:text-3xl">
          Shop More, Live More.
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-400">
          Discover new arrivals, trusted stores and exclusive deals — all in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/search" className="rounded-card bg-marigold px-6 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-marigold-600">
            Explore Now
          </Link>
          <Link href="/deals" className="rounded-card border border-ink-100 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50">
            View Deals
          </Link>
        </div>
      </section>

      {(user.role === 'VENDOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-700 p-5 text-white">
          <div>
            <p className="font-display text-lg font-bold">
              {user.role === 'VENDOR' ? 'Your Seller Dashboard' : 'Admin Control Panel'}
            </p>
            <p className="text-sm text-white/70">
              {user.role === 'VENDOR'
                ? 'Manage your orders, products, and store from your business dashboard.'
                : 'Manage vendors, products, users, and platform settings.'}
            </p>
          </div>
          <Link
            href={user.role === 'VENDOR' ? '/vendor/dashboard' : '/admin'}
            className="rounded-card bg-marigold px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-marigold-600"
          >
            {user.role === 'VENDOR' ? 'Go to Seller Dashboard →' : 'Go to Admin Panel →'}
          </Link>
        </section>
      )}

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-5">
          {[
            { href: '/orders', icon: '📦', label: 'Track Your Order', value: orders === null ? '…' : `${activeOrders.length} active` },
            { href: '/wishlist', icon: '🤍', label: 'Wishlist', value: wishlistCount === null ? '…' : `${wishlistCount} saved` },
            { href: '/account/coupons', icon: '🎟️', label: 'Coupons', value: couponsCount === null ? '…' : `${couponsCount} available` },
            { href: '/account/rewards', icon: '🎁', label: 'Rewards', value: rewards === null ? '…' : `${rewards.pointsBalance} points` },
            { href: '/account/following', icon: '🏪', label: 'Following', value: followedStores === null ? '…' : `${followedStores.length} stores` },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-40 shrink-0 flex-col gap-1 rounded-card bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover sm:w-auto"
            >
              <span className="text-xl" aria-hidden>{item.icon}</span>
              <span className="text-sm font-semibold text-ink-700">{item.label}</span>
              <span className="text-xs text-muted">{item.value}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Active orders */}
      <section aria-labelledby="active-orders">
        <h2 id="active-orders" className="mb-4 text-lg font-bold text-ink-700">Your Active Orders</h2>
        {orders === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : activeOrders.length === 0 ? (
          <div className="rounded-card bg-surface p-8 text-center shadow-card">
            <p className="mb-1 font-semibold text-ink-700">No active orders</p>
            <p className="mb-4 text-sm text-muted">Ready for your next shopping adventure?</p>
            <Link href="/search" className="inline-block rounded-card bg-marigold px-5 py-2.5 text-sm font-semibold text-ink-700">
              Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeOrders.slice(0, 5).map((order) => {
              const thumb = order.items[0]?.product?.images?.[0]?.url;
              return (
                <li key={order.id} className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card bg-base">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg" aria-hidden>📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-700">{order.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatPriceCents(order.totalCents)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-line text-muted'}`}>
                    {order.status}
                  </span>
                  <Link href={`/orders/${order.id}/tracking`} className="shrink-0 text-xs font-semibold text-marigold-600 hover:text-marigold">
                    Track →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Rewards + Referral row */}
      <section className="grid gap-4 md:grid-cols-2">
        {rewards && (
          <div className="rounded-card bg-ink-700 p-6 text-white">
            <p className="text-sm text-white/70">Your Shopina Rewards</p>
            <p className="mt-1 font-display text-lg font-bold">
              {rewards.pointsBalance >= NEXT_MILESTONE
                ? "You've reached your next milestone! 🎉"
                : `You're ${NEXT_MILESTONE - rewards.pointsBalance} points from your next milestone.`}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-marigold"
                style={{ width: `${Math.min(100, (rewards.pointsBalance / NEXT_MILESTONE) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/60">{rewards.pointsBalance} / {NEXT_MILESTONE} points</p>
            <Link href="/account/rewards" className="mt-4 inline-block text-sm font-semibold text-marigold hover:text-marigold-400">
              View Rewards →
            </Link>
          </div>
        )}

        {referral && (
          <div className="rounded-card bg-marigold-50 p-6">
            <p className="font-display text-lg font-bold text-ink-700">Refer &amp; Earn</p>
            <p className="mt-1 text-sm text-ink-400">Invite friends and earn Shopina rewards.</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="rounded-card bg-white px-3 py-2 text-sm font-semibold text-ink-700">{referral.code}</code>
              <span className="text-xs text-muted">{referral.referredCount} friend{referral.referredCount !== 1 ? 's' : ''} joined</span>
            </div>
            <button
              onClick={shareReferral}
              className="mt-4 rounded-card bg-ink-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900"
            >
              Invite Now
            </button>
          </div>
        )}
      </section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section aria-labelledby="recommended">
          <h2 id="recommended" className="text-lg font-bold text-ink-700">Popular on Shopina</h2>
          <p className="mb-4 text-sm text-muted">Trending picks across the marketplace.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section aria-labelledby="explore-categories">
          <h2 id="explore-categories" className="mb-4 text-lg font-bold text-ink-700">Explore Categories</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="flex flex-col items-center gap-2 rounded-card bg-surface p-3 text-center shadow-card transition hover:-translate-y-1 hover:shadow-cardHover"
              >
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-base" aria-hidden />
                )}
                <span className="text-xs font-medium text-ink-700">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <section aria-labelledby="deals-you-might-love">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="deals-you-might-love" className="text-lg font-bold text-ink-700">Deals You Might Love 🔥</h2>
            <Link href="/deals" className="text-sm font-semibold text-marigold-600 hover:text-marigold">View All Deals →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {deals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Recently viewed — existing component, already handles its own empty state */}
      <RecentlyViewedSection />

      {/* Followed stores */}
      <section aria-labelledby="followed-stores">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="followed-stores" className="text-lg font-bold text-ink-700">Stores You Follow</h2>
          <Link href="/account/following" className="text-sm font-semibold text-marigold-600 hover:text-marigold">View All →</Link>
        </div>
        {followedStores === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : followedStores.length === 0 ? (
          <p className="rounded-card bg-surface p-6 text-center text-sm text-muted shadow-card">
            Follow your favorite stores to see their latest products.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {followedStores.slice(0, 8).map(({ store }) => (
              <Link key={store.id} href={`/search?q=${encodeURIComponent(store.name)}`} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt="" className="h-16 w-16 rounded-full object-cover shadow-card" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-50 font-display text-lg font-bold text-ink-700 shadow-card">
                    {store.name.charAt(0)}
                  </div>
                )}
                <span className="line-clamp-2 text-xs font-medium text-ink-700">{store.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
