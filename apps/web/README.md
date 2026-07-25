# Marketplace Web (Storefront)

Next.js 14 (App Router) + TypeScript + Tailwind storefront: homepage, category
browsing with filters/sort/pagination, product detail with structured data,
cart, login/register.

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Runs on `http://localhost:3000`. Requires the API (`apps/api`) running on
`http://localhost:4000` — see its README to seed sample data.

## Architecture notes

- **Server components by default.** Homepage, category, and product pages
  fetch data server-side (`src/lib/api.ts`) for fast first paint and real SEO
  (meta tags + JSON-LD on product pages, dynamic `sitemap.ts`/`robots.ts`).
- **Client state is isolated to two contexts:** `AuthProvider` (access token
  kept in memory only — never localStorage, to limit XSS blast radius; the
  refresh token lives in an httpOnly cookie the browser manages) and
  `CartProvider` (thin wrapper over the `/cart` endpoints).
- **Design tokens** live in `tailwind.config.js` — ink/marigold/chili palette,
  Sora/Inter/IBM Plex Mono type system. Change the look of the whole app from
  that one file.

## What's next

Checkout flow, payment method selection, order tracking, wishlist, reviews
write-path, live search-as-you-type, vendor storefront pages, and the
account/order-history screens are the next build passes — the API contracts
for most of these already exist as stubs or are one additive module away.
