'use client';

import Link from 'next/link';
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
    <header className="sticky top-0 z-50 bg-ink shadow-card">
      {/* Utility bar */}
      <div className="hidden border-b border-white/10 bg-ink-700 text-xs text-white/70 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span>Deliver to Pakistan — Cash on Delivery available nationwide</span>
          <div className="flex gap-4">
            <Link href="/vendor/register" className="hover:text-white">
              Sell on Bazaario
            </Link>
            <Link href="/help" className="hover:text-white">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-display text-2xl font-extrabold text-white shrink-0">
          Bazaario
        </Link>

        <button
          className="rounded-card px-3 py-2 text-sm font-semibold text-white md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle category menu"
        >
          ☰ Categories
        </button>

        <form onSubmit={handleSearch} className="hidden flex-1 md:flex" role="search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and categories"
            className="w-full rounded-l-card border-none px-4 py-2.5 text-sm text-ink900text outline-none focus-visible:outline-2 focus-visible:outline-marigold"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="rounded-r-card bg-marigold px-5 text-sm font-bold text-ink transition hover:bg-marigold-600"
          >
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-5 text-sm text-white shrink-0">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/account" className="hover:text-marigold">
                Hi, {user.firstName}
              </Link>
              <button onClick={() => logout()} className="text-white/70 hover:text-white">
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="hover:text-marigold">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-card border border-white/30 px-3 py-1.5 hover:border-marigold hover:text-marigold"
              >
                Sign up
              </Link>
            </div>
          )}

          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-marigold">
            ♡
          </Link>

          <Link href="/cart" aria-label="Cart" className="relative hover:text-marigold">
            🛒
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-[10px] font-bold">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Mega menu — desktop: hover strip. Mobile: toggled panel. */}
      <nav
        className={`border-t border-white/10 bg-ink-700 ${menuOpen ? 'block' : 'hidden'} md:block`}
      >
        <ul className="mx-auto flex max-w-7xl flex-wrap gap-x-6 px-4 py-2 text-sm text-white/85 md:flex-nowrap md:overflow-x-auto">
          {categories.map((category) => (
            <li key={category.id} className="group relative shrink-0 py-1">
              <Link href={`/category/${category.slug}`} className="hover:text-marigold">
                {category.name}
              </Link>
              {category.children && category.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-40 min-w-[220px] rounded-card bg-white p-3 text-ink900text opacity-0 shadow-cardHover transition group-hover:visible group-hover:opacity-100">
                  <ul className="space-y-1.5">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/category/${child.slug}`}
                          className="block rounded px-2 py-1 text-sm hover:bg-base hover:text-ink"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
