# Marketplace API

NestJS + Prisma + PostgreSQL backend for the marketplace. This phase covers:
identity & auth (JWT access/refresh with rotation, argon2id hashing, RBAC),
catalog browsing (categories, products, filters, pagination), cart, and
addresses.

## Stack

- NestJS 10, TypeScript
- PostgreSQL via Prisma ORM
- JWT auth (short-lived access token + rotating httpOnly-cookie refresh token)
- argon2id password hashing
- class-validator DTOs on every input
- Helmet, rate limiting (`@nestjs/throttler`), CORS allowlist

## Local setup

```bash
cp .env.example .env
# edit .env — at minimum set real JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / COOKIE_SECRET
# (openssl rand -base64 64 for each)

npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

The API listens on `http://localhost:4000/api/v1`.

Seeded accounts (see `prisma/seed/seed.ts`):
| Role     | Email                      | Password              |
|----------|-----------------------------|------------------------|
| Admin    | admin@marketplace.test      | Admin!Passw0rd123      |
| Vendor   | vendor@marketplace.test     | Vendor!Passw0rd123     |
| Customer | customer@marketplace.test   | Customer!Passw0rd123   |

## Running via Docker Compose

From the repo root:

```bash
docker compose up --build
```

This starts Postgres, Redis, the API (port 4000) and the web app (port 3000).
Run migrations/seed once the `api` container is healthy:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

## Tests

```bash
npm run test        # unit tests
npm run test:cov     # with coverage
```

Current coverage focuses on the security- and correctness-critical paths:
password hashing, login/refresh token rotation, cart stock-quantity
validation, and address ownership checks (IDOR prevention).

## API surface (this phase)

| Method | Path                          | Auth        | Description                        |
|--------|-------------------------------|-------------|-------------------------------------|
| POST   | /api/v1/auth/register         | Public      | Create account, returns tokens      |
| POST   | /api/v1/auth/login            | Public      | Returns access token + refresh cookie |
| POST   | /api/v1/auth/refresh          | Public (cookie) | Rotates refresh token, new access token |
| POST   | /api/v1/auth/logout           | Public (cookie) | Revokes the refresh token           |
| GET    | /api/v1/users/me              | JWT         | Current user profile                |
| GET    | /api/v1/categories            | Public      | Mega-menu category tree             |
| GET    | /api/v1/categories/:slug      | Public      | Single category with children       |
| GET    | /api/v1/products              | Public      | Paginated/filterable/searchable product list |
| GET    | /api/v1/products/featured     | Public      | Featured products                   |
| GET    | /api/v1/products/flash-sale   | Public      | Discounted products                 |
| GET    | /api/v1/products/:slug        | Public      | Product detail (includes reviews)   |
| POST   | /api/v1/products/:productId/reviews | JWT   | Submit a review (one per user per product) |
| DELETE | /api/v1/reviews/:id           | JWT (owner) | Delete your own review              |
| GET    | /api/v1/cart                  | JWT         | Current user's cart with totals     |
| POST   | /api/v1/cart/items            | JWT         | Add item (stock-checked)            |
| PATCH  | /api/v1/cart/items/:id        | JWT         | Update quantity                     |
| DELETE | /api/v1/cart/items/:id        | JWT         | Remove item                         |
| GET/POST/PUT/DELETE | /api/v1/addresses | JWT | Manage the user's own addresses (ownership-checked) |
| POST   | /api/v1/orders/checkout       | JWT         | Cart → one Order per vendor (COD only for now) |
| GET    | /api/v1/orders                | JWT         | Order history                       |
| GET    | /api/v1/orders/:id             | JWT (owner) | Single order detail                 |
| POST   | /api/v1/coupons/vendor        | VENDOR (approved) | Create a coupon scoped to your own store |
| POST   | /api/v1/coupons/platform      | ADMIN       | Create a platform-wide coupon       |
| GET/POST/DELETE | /api/v1/wishlist     | JWT         | Manage your wishlist                |
| GET/POST | /api/v1/recently-viewed     | JWT         | View history (bounded to 30, auto-pruned) |
| POST   | /api/v1/vendors/register      | JWT         | Apply to become a vendor (role flips to VENDOR, status PENDING) |
| GET    | /api/v1/vendors/me            | VENDOR      | Your vendor/store record            |
| GET    | /api/v1/vendors/me/dashboard  | VENDOR      | Revenue/order/product summary       |
| PATCH  | /api/v1/vendors/me/store      | VENDOR      | Update your store profile           |
| GET/POST | /api/v1/vendors/me/products | VENDOR (approved to POST) | List/create your products (new products start PENDING_APPROVAL) |
| GET/PATCH/DELETE | /api/v1/vendors/me/products/:id | VENDOR (owner) | View/edit/archive your own product |
| PATCH  | /api/v1/vendors/me/products/variants/:variantId/stock | VENDOR (owner) | Adjust stock for one SKU |
| GET    | /api/v1/vendors/me/orders     | VENDOR      | Orders placed against your store    |
| PATCH  | /api/v1/vendors/me/orders/:id/status | VENDOR (owner) | Move an order forward (validated transitions) |
| POST/PATCH/DELETE | /api/v1/categories | ADMIN | Create/edit/delete categories (GET stays public) |
| GET/POST | /api/v1/admin/vendors, /:id/approve, /:id/reject | ADMIN | Vendor approval queue |
| GET/POST | /api/v1/admin/products, /:id/approve, /:id/reject | ADMIN | Product approval queue |
| GET/PATCH | /api/v1/admin/users, /:id/active | ADMIN | List users, activate/deactivate (revokes sessions) |
| GET    | /api/v1/admin/dashboard/summary | ADMIN     | Platform-wide stats                 |

## What's deliberately not in this phase

Documented here so it isn't mistaken for an oversight — these are the next
build passes: real payment gateway integration (Stripe/JazzCash/Easypaisa/bank
transfer — checkout works today via Cash on Delivery), shipping/courier
integration and live tracking, Elasticsearch-backed search (current search
is a Postgres `ILIKE` query — functional, but won't scale to typo-tolerance
or faceted search at catalog size), notifications, live chat, real image
upload/S3 storage (vendors currently paste a hosted image URL), multi-variant
products (one SKU per product for now — size/color variants are a schema-
compatible addition), GraphQL surface, and full CI/CD/K8s manifests. The
schema and module structure here are built so each of those is an additive
module, not a rewrite.

## Security notes

- Passwords hashed with argon2id (OWASP-recommended over bcrypt/scrypt).
- Login/register responses are timing- and message-generic to prevent
  account enumeration.
- Refresh tokens are stored **hashed** (SHA-256) and rotated on every use;
  reuse of a revoked token is detectable (useful signal for future fraud
  detection).
- Every user-scoped query (addresses, cart) filters by `userId` at the
  database level, not just after fetching — prevents IDOR.
- Global `ValidationPipe` with `whitelist`/`forbidNonWhitelisted` strips and
  rejects unexpected fields on every request body.
- Helmet sets standard security headers; rate limiting is tighter on
  `/auth/register` and `/auth/login` than the global default.
