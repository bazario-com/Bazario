# Bazaario — Multi-Vendor Marketplace

A Daraz/Amazon-style multi-vendor marketplace, built as a monorepo:

```
marketplace/
├── apps/
│   ├── api/    NestJS + Prisma + PostgreSQL backend
│   └── web/    Next.js 14 storefront
├── docker-compose.yml
└── ARCHITECTURE.md   ← full system design, current + future phases
```

## What's built

**Phase 1–3 (this delivery): full customer-facing marketplace**

- **Identity & auth**: register/login/refresh/logout, argon2id password
  hashing, rotating refresh tokens (httpOnly cookie), RBAC roles
  (customer/vendor/admin), rate-limited auth endpoints (rate limiting is
  now actually enforced globally via `ThrottlerGuard`).
- **Catalog**: categories (mega-menu tree), products with images, variants,
  filtering, sorting, pagination, search.
- **Cart**: stock-aware add/update/remove, per-user, persisted server-side.
- **Checkout & orders**: cart → one Order per vendor, atomic stock
  decrement (safe under concurrent checkouts), Cash on Delivery today,
  other payment methods return a clear "not yet available" instead of
  silently pretending to charge. Order history page for customers.
- **Coupons**: vendor-scoped or platform-wide, percentage or fixed,
  min-order thresholds, redemption limits, pro-rata discount split across
  a multi-vendor cart.
- **Reviews**: write path with automatic verified-purchase detection
  (checked against real delivered orders, not self-reported), one review
  per user per product, product rating recalculated from source data.
- **Wishlist** and **recently viewed** (bounded history, auto-pruned).
- **Addresses**: full CRUD, ownership-enforced (IDOR-safe).
- **Vendor dashboard**: registration/approval workflow, store profile,
  product CRUD (new listings require admin approval; editing a published
  listing's public-facing fields sends it back for re-review), stock
  management, order management with validated status transitions
  (a vendor can't skip from "confirmed" straight to "delivered"), revenue
  summary.
- **Admin dashboard**: vendor approval queue, product approval queue,
  category CRUD, user management (activate/deactivate — deactivating
  revokes active sessions), platform-wide summary stats.
- **Storefront UI**: homepage (hero, category strip, flash-sale rail,
  featured grid, recently-viewed), category pages, product detail (SEO
  meta + JSON-LD + reviews + review form), cart, checkout, order history,
  wishlist, account hub, address management, search, login/register,
  vendor dashboard pages, admin dashboard pages.
- **Security baseline**: Helmet, CORS allowlist, global input validation,
  *actually-enforced* rate limiting, hashed refresh tokens, generic auth
  error messages, non-root Docker users.
- **Tests**: unit tests on auth, cart stock validation, address IDOR
  prevention, checkout (multi-vendor split, stock race, coupon math),
  coupon validation, and review verified-purchase logic.
- **Docker Compose** for local dev: Postgres, Redis, API, web.

## Quickstart

```bash
cp apps/api/.env.example apps/api/.env       # then fill in real secrets
cp apps/web/.env.local.example apps/web/.env.local

docker compose up --build
# first run only:
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

Visit `http://localhost:3000`. Seeded accounts are listed in
`apps/api/README.md`.

### Running without Docker

```bash
# terminal 1
cd apps/api && npm install && npx prisma migrate dev && npm run prisma:seed && npm run start:dev

# terminal 2
cd apps/web && npm install && npm run dev
```

> **Note on this build environment:** these files were authored without
> network/package-registry access, so `npm install` and the test suite have
> not been executed here. Run `npm install && npm test` in `apps/api` and
> `npm install && npm run build` in `apps/web` as your first step to catch
> any dependency-version drift before deploying.

## CI/CD automation

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push and PR to `main`/`develop`:
  - **API job**: installs deps, `prisma validate`, `prisma generate`,
    `prisma migrate deploy` against a **real ephemeral Postgres service
    container** (not just a schema syntax check), type-check, lint, unit
    tests with coverage (uploaded as a build artifact), build.
  - **Web job**: installs deps, type-check, `next lint`, build.
  - **`ci-success`** job: a single required status check that fails if
    either of the above fails — set this one as your branch protection
    rule instead of listing every job individually.
- **`docker-publish.yml`** — after `ci.yml` succeeds on `main` (or via
  manual `workflow_dispatch`), builds both production Docker images and
  pushes them to GitHub Container Registry (`ghcr.io/<owner>/<repo>/marketplace-api`
  and `-web`), tagged by commit SHA, branch, and `latest`. No secrets to
  configure — it uses the automatically-provided `GITHUB_TOKEN`.

**Dependabot** (`.github/dependabot.yml`) opens weekly PRs for npm
dependencies (grouped sensibly — e.g. all `@nestjs/*` packages together),
Docker base images, and GitHub Actions versions.

### One thing to do before this fully works

CI currently runs `npm install` rather than `npm ci`, because no
`package-lock.json` is committed — this environment had no registry access
to generate one. **Run `npm install` once locally in each of `apps/api` and
`apps/web`, commit the resulting lockfiles, then switch both `npm install`
calls in `ci.yml` to `npm ci`** (and optionally re-add `cache: npm` /
`cache-dependency-path` to the `setup-node` steps) for fully reproducible,
faster CI runs. Everything else — the Postgres service, the test/build
steps, Docker publishing — works as-is once pushed to GitHub.

## Roadmap (see ARCHITECTURE.md for detail)

1. ✅ Architecture, DB schema, auth, catalog browsing, cart
2. ✅ Checkout, orders, coupons, reviews, wishlist, recently viewed, search
3. ✅ CI (lint/test/build automation) — CD image publishing done; K8s manifests still pending
4. ✅ Vendor dashboard (registration, store settings, products, orders, revenue summary)
5. ✅ Admin dashboard (vendor/product approval queues, user management, category CRUD, platform summary)
6. Real payment gateways (Stripe, JazzCash, Easypaisa, bank transfer) — COD works today
7. Shipping/courier integration, live order tracking
8. Elasticsearch search, notifications, live chat, image/S3 upload, multi-variant products, production hardening pass

Each phase is additive to the schema and module structure already in place.
