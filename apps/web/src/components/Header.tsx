'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import type { Category } from '@/lib/api';

export function Header({ categories }: { categories: Category[] }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-card">
      {/* Top utility bar */}
      <div className="hidden border-b border-line bg-ink text-xs text-white/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span>🚚 Free Delivery on Orders Above PKR 2,500</span>
          <div className="flex items-center gap-4">
            <Link href="/vendor/register" className="hover:text-marigold">
              Sell on Shopina
            </Link>
            <Link href="/track-order" className="hover:text-marigold">
              Track Order
            </Link>
            <Link href="/help" className="hover:text-marigold">
              Help &amp; Support
            </Link>
            <span className="border-l border-white/20 pl-4">🌐 EN</span>
            <span>PKR</span>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Shopina" width={36} height={36} priority className="h-9 w-9 object-contain" />
          <span className="font-display text-xl font-extrabold text-ink-700">
            Shop<span className="text-marigold-600">i</span>na<span className="text-marigold-600">.pk</span>
          </span>
        </Link>

        <button
          className="rounded-card px-3 py-2 text-sm font-semibold text-ink-700 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle category menu"
        >
          ☰
        </button>

        <form onSubmit={handleSearch} className="hidden flex-1 md:flex" role="search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands and more..."
            className="w-full rounded-l-card border border-line px-4 py-2.5 text-sm text-ink900text outline-none focus-visible:outline-2 focus-visible:outline-marigold"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="rounded-r-card bg-marigold px-5 text-sm font-bold text-ink-700 transition hover:bg-marigold-600"
          >
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-5 text-sm text-ink-700 shrink-0">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/account" className="hover:text-marigold-600">
                Hi, {user.firstName}
              </Link>
              <button onClick={() => logout()} className="text-muted hover:text-ink-700">
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="hover:text-marigold-600">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-card border border-line px-3 py-1.5 hover:border-marigold hover:text-marigold-600"
              >
                Sign up
              </Link>
            </div>
          )}

          {user ? (
            <Link
              href="/account"
              aria-label="My account"
              className="hover:text-marigold-600 md:hidden"
            >
              👤
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-card bg-ink-700 px-3 py-1.5 text-xs font-semibold text-white md:hidden"
            >
              Log in
            </Link>
          )}

          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-marigold-600">
            ♡
          </Link>

          <Link href="/cart" aria-label="Cart" className="relative hover:text-marigold-600">
            🛒
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-[10px] font-bold text-white">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Secondary nav row — desktop only */}
      <div className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium text-ink-700">
          <Link href="/#categories" className="hover:text-marigold-600">
            Categories
          </Link>
          <Link href="/#mega-deals" className="hover:text-marigold-600">
            Deals
          </Link>
          <Link href="/#new-arrivals" className="hover:text-marigold-600">
            New Arrivals
          </Link>
          <Link href="/#top-stores" className="hover:text-marigold-600">
            Top Stores
          </Link>
          <Link href="/deals" className="hover:text-marigold-600">
            Flash Deals
          </Link>
          <Link href="/search" className="hover:text-marigold-600">
            Brands
          </Link>
          <Link href="/#shopina-picks" className="hover:text-marigold-600">
            Shopina Picks
          </Link>
        </div>
      </div>

      {/* Mega menu — desktop: hover strip. Mobile: toggled panel. */}
      <nav
        className={`border-t border-line bg-base ${menuOpen ? 'block' : 'hidden'} md:hidden`}
      >
        <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 text-sm text-ink-700">
          {categories.map((category) => (
            <li key={category.id} className="py-1">
              <Link href={`/category/${category.slug}`} className="hover:text-marigold-600">
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
