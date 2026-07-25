# Architecture

## System overview

```
┌─────────────┐      REST (JSON)      ┌──────────────┐      SQL       ┌────────────┐
│  Next.js    │ ────────────────────▶ │   NestJS     │ ─────────────▶ │ PostgreSQL │
│  (web)      │ ◀──────────────────── │   (api)      │ ◀───────────── │  (Prisma)  │
└─────────────┘   access token (JWT)  └──────────────┘                └────────────┘
      │            + httpOnly refresh        │
      │            cookie                    │  (future) Redis cache, Elasticsearch
      ▼                                      ▼
  Browser                              S3-compatible storage (images)
```

- **apps/web** — Next.js App Router. Server components fetch from the API
  directly (no client-side waterfall) for SSR/SEO; two React contexts
  (`AuthProvider`, `CartProvider`) hold the minimum client state needed for
  interactivity.
- **apps/api** — NestJS, modular by domain (`modules/auth`, `modules/products`,
  etc.), each module owning its controller/service/DTOs. `PrismaService` is
  the single global DB client.
- **Database** — PostgreSQL via Prisma, normalized to 3NF. See schema
  rationale below.

## Why these choices

- **NestJS over raw Express**: gives you DI, guards, and module boundaries
  for free — at marketplace scale (vendors, admin, multiple auth levels)
  that structure pays for itself fast, versus hand-rolling the equivalent in
  Express middleware.
- **Prisma over raw SQL/knex**: type-safe queries that match the schema
  exactly, plus first-class migrations. The tradeoff (less control over
  exotic queries) doesn't bite until you need Elasticsearch-grade search,
  which is why search is planned as a separate service, not a Prisma query.
- **JWT access token in memory + refresh token in httpOnly cookie**: the
  access token never touches storage the browser persists (XSS can't read
  it after the tab closes), and the refresh token is inaccessible to JS at
  all (XSS can't steal it either). This is the standard "double defense"
  pattern for SPA auth.
- **Vendor-scoped Order rows, grouped by `orderGroupId`**: one checkout
  across multiple vendors produces one Order per vendor. Each vendor manages
  only their own Order (status, shipping) without needing access to the
  whole checkout — this is what makes vendor-dashboard order management
  possible later without a redesign.
- **Money stored as integer cents (`*Cents` columns)**: avoids the classic
  floating-point rounding bugs in financial calculations.

## Database schema rationale

Full schema: `apps/api/prisma/schema.prisma`.

- **Users vs. Vendors**: a `Vendor` is a 1:1 extension of `User` (via
  `userId` unique FK), not a separate identity system — a vendor logs in
  exactly like a customer, just with `role = VENDOR` and a linked `Vendor`
  row. Keeps auth logic single-path.
- **Product vs. ProductVariant**: every product has ≥1 variant, even with no
  real options (color/size). Cart/order lines always reference a
  `variantId`, never a bare `productId` — this means checkout, stock
  decrementing, and pricing logic never need an "if it has variants" branch.
- **OrderItem denormalizes `titleSnapshot`/`optionsSnapshot`/`unitPriceCents`**:
  a customer's order history must show what they actually bought and paid,
  even if the vendor later renames or re-prices the product.
- **Soft deletes** (`deletedAt`) on `User` and `Product`: legal/audit
  retention requirements in e-commerce (tax records, dispute history) mean
  hard-deleting these rows is rarely correct.
- **Indexes**: every foreign key, every column used in a `WHERE`/`ORDER BY`
  on a storefront-facing query (`status`, `slug`, `isFeatured`, `createdAt`,
  `categoryId`) has an explicit index — checked against the actual queries
  in `products.service.ts`, not guessed.

### Deferred tables (documented so they're a plan, not a gap)

| Concern | Deferred to | Why deferring is safe |
|---|---|---|
| Payments/transactions ledger | Payment integration phase | `Order.paymentStatus`/`paymentMethod` already model the order-level state; a `Payment` table with gateway refs is a pure addition |
| Coupon redemption ledger | Coupons phase | `Order.couponCode` captures what was used; a `CouponRedemption` table for analytics is additive |
| Shipment/courier tracking | Shipping phase | `Order.status` already has `SHIPPED`/`DELIVERED`; a `Shipment` table with courier/tracking-number is additive |
| Admin audit log | Admin dashboard phase | No admin-mutation endpoints exist yet to log |
| Support tickets, CMS pages, notifications | Later phases | Independent of the commerce core; zero FK coupling required |

## Security model (implemented now)

- Argon2id password hashing (OWASP-recommended).
- Refresh tokens stored as SHA-256 hashes only, rotated on every use, with
  reuse-of-revoked-token detectable (a future fraud-detection signal).
- Every user-scoped resource (addresses, cart) is queried
  `WHERE ... AND userId = ?` at the database level — not fetched then
  checked — closing the standard IDOR hole.
- Generic, timing-resistant error messages on login/register (no account
  enumeration).
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` —
  unknown fields in any request body are rejected, not silently dropped or
  accepted.
- Helmet security headers, CORS allowlist, tiered rate limiting (stricter on
  `/auth/*` than the global default).
- Docker images run as a non-root user in the production target.

## Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Architecture, schema, API design | ✅ done |
| 2 | Auth, user management | ✅ done |
| 3 | Marketplace features (catalog, cart, checkout, orders, coupons, reviews, wishlist, recently viewed, addresses, search) | ✅ done |
| 4 | Vendor dashboard (registration, products, orders, store, revenue) | ✅ done |
| 5 | Admin dashboard (approvals, users, categories, platform stats) | ✅ done |
| 6 | Real payment gateways (Stripe, JazzCash, Easypaisa, bank transfer) — COD works today | Not started |
| 7 | Shipping/courier integration, live tracking | Not started |
| 8 | Full test coverage, CI/CD, K8s, prod hardening | Partial — CI (lint/typecheck/test/build, real Postgres migration check) and CD (Docker image publishing to GHCR) both done; Kubernetes manifests and a full production hardening pass still pending |

Each remaining phase adds new Prisma models and new NestJS modules without
altering what's already here — the FK relationships were designed with
those additions in mind (see table above).

## Phase 4–5 additions in detail

- **Vendor onboarding**: registering as a vendor flips `User.role` to
  `VENDOR` immediately but sets `Vendor.status = PENDING` — the role change
  and the approval gate are deliberately separate checks. A pending vendor
  can see their dashboard but every mutating endpoint
  (`VendorProductsController`, `CouponsController`) independently checks
  `vendor.status === 'APPROVED'`, so there's no single choke point whose
  removal would accidentally open things up.
- **Product approval loop**: every new vendor product starts
  `PENDING_APPROVAL`. Editing a *published* product's customer-facing
  fields (title, description, price, images) — not backend-only fields like
  `discountPct` — resets it to `PENDING_APPROVAL` automatically. This
  closes the obvious gap where a vendor could get a legitimate product
  approved, then edit it into something else entirely.
- **Order status transitions are an explicit allow-list**
  (`VendorOrdersService.ALLOWED_TRANSITIONS`), not just "any status change
  goes." A vendor can't jump `CONFIRMED → DELIVERED`, and a `DELIVERED`
  order is terminal from the vendor's side. The frontend mirrors this map
  for UX (only rendering buttons that will actually succeed), but the
  backend is the real enforcement point.
- **Deactivating a user revokes their refresh tokens immediately**, closing
  their ability to get a new session. Their current access token (≤15 min)
  still works until natural expiry — an instant-revoke path would need a
  token blocklist, which isn't justified yet at this scale.
- **Admin category deletion is guarded**: a category with products or
  subcategories can't be deleted outright, avoiding silent orphaning of
  catalog data.

## Phase 3 additions in detail

- **Checkout** (`modules/orders`): splits a cart into one `Order` per
  vendor sharing an `orderGroupId`. Stock is decremented inside a single
  Prisma interactive transaction using `updateMany({ where: { stockQuantity: { gte: qty } } })`
  — this is what makes two simultaneous checkouts against the last unit of
  stock resolve safely (one succeeds, one gets a clear "insufficient stock"
  error) without needing an explicit row lock.
- **Coupons** (`modules/coupons`): a coupon is either platform-wide
  (`vendorId = null`) or scoped to one vendor. Validation checks active
  window, min order, and redemption cap; the discount is then split
  pro-rata across whichever vendors in the cart the coupon actually applies
  to, so each per-vendor Order carries an accurate `discountCents`.
- **Reviews** (`modules/reviews`): `isVerifiedPurchase` is computed by
  checking for a `DELIVERED` order containing the product — never
  self-reported — and `Product.averageRating`/`reviewCount` are recomputed
  from the `Review` table on every write rather than incremented in place,
  so they can never drift from source data.
- **Wishlist / Recently Viewed**: both are idempotent (`upsert`) so the
  frontend can call them freely; recently-viewed is capped at 30 entries
  per user with automatic pruning, avoiding unbounded growth without a
  cron job.
