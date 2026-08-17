'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface VendorSummary {
  totalRevenueCents: number;
  totalOrders: number;
  totalProducts: number;
  pendingApprovalProducts: number;
  unitsSold: number;
  uniqueCustomers: number;
  averageOrderValueCents: number;
  orderPipeline: Record<string, number>;
  inventory: { lowStock: number; outOfStock: number; draft: number };
  reviews: { averageRating: number; totalReviews: number };
}

interface Vendor {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  businessName: string;
  rejectedReason?: string | null;
  store: { name: string; slug: string } | null;
}

interface VendorOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  placedAt: string;
  items: { titleSnapshot: string; quantity: number }[];
  user: { firstName: string; lastName: string };
}

interface VendorProductRow {
  id: string;
  title: string;
  status: string;
  totalSold: number;
  averageRating: string;
  reviewCount: number;
  variants: { stockQuantity: number }[];
}

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

const PIPELINE_STAGES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
      <p className="mb-2">{message}</p>
      <button onClick={onRetry} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
        Try Again
      </button>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function VendorDashboardPage() {
  const { authFetch, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [notVendor, setNotVendor] = useState(false);
  const [vendorError, setVendorError] = useState(false);

  const [period, setPeriod] = useState('30d');
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [recentOrders, setRecentOrders] = useState<VendorOrderRow[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);

  const [products, setProducts] = useState<VendorProductRow[] | null>(null);
  const [productsError, setProductsError] = useState(false);

  const [reviews, setReviews] = useState<any[] | null>(null);
  const [reviewsError, setReviewsError] = useState(false);

  const loadVendor = useCallback(() => {
    setVendorError(false);
    authFetch('/vendors/me')
      .then(async (res) => {
        if (res.status === 403) {
          setNotVendor(true);
          return;
        }
        if (!res.ok) throw new Error();
        setVendor(await res.json());
      })
      .catch(() => setVendorError(true));
  }, [authFetch]);

  const loadSummary = useCallback(
    (vendorApproved: boolean) => {
      if (!vendorApproved) return;
      setSummaryLoading(true);
      setSummaryError(false);
      authFetch(`/vendors/me/dashboard?period=${period}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(setSummary)
        .catch(() => setSummaryError(true))
        .finally(() => setSummaryLoading(false));
    },
    [authFetch, period],
  );

  const loadOrders = useCallback(() => {
    setOrdersError(false);
    authFetch('/vendors/me/orders')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((all: VendorOrderRow[]) => setRecentOrders(all.slice(0, 5)))
      .catch(() => setOrdersError(true));
  }, [authFetch]);

  const loadProducts = useCallback(() => {
    setProductsError(false);
    authFetch('/vendors/me/products')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setProducts)
      .catch(() => setProductsError(true));
  }, [authFetch]);

  const loadReviews = useCallback(() => {
    setReviewsError(false);
    authFetch('/vendors/me/reviews')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setReviews(data.reviews))
      .catch(() => setReviewsError(true));
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) loadVendor();
  }, [authLoading, loadVendor]);

  useEffect(() => {
    if (vendor?.status === 'APPROVED') {
      loadSummary(true);
      loadOrders();
      loadProducts();
      loadReviews();
    }
  }, [vendor, loadSummary, loadOrders, loadProducts, loadReviews]);

  if (authLoading) return null;

  if (vendorError) {
    return <ErrorRetry message="Unable to load your vendor account." onRetry={loadVendor} />;
  }

  if (notVendor) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">You're not registered as a vendor yet</h1>
        <Link href="/vendor/register" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700">
          Apply to sell on Shopina
        </Link>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const totalStock = (p: VendorProductRow) => p.variants.reduce((s, v) => s + v.stockQuantity, 0);
  const inStockCount = products?.filter((p) => p.status === 'PUBLISHED' && totalStock(p) > 0).length ?? 0;
  const topProducts = products
    ? [...products].filter((p) => p.totalSold > 0).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-700">{vendor.businessName}</h1>
        <p className="text-sm text-muted">{vendor.store?.name}</p>
      </div>

      {vendor.status === 'PENDING' && (
        <p className="rounded-card bg-marigold-50 px-4 py-3 text-sm font-medium text-marigold-600">
          Your application is under review. You'll be able to list products once an admin approves your store.
        </p>
      )}
      {vendor.status === 'REJECTED' && (
        <p className="rounded-card bg-chili-50 px-4 py-3 text-sm text-chili-600">
          Your application was not approved{vendor.rejectedReason ? `: ${vendor.rejectedReason}` : '.'}
        </p>
      )}
      {vendor.status === 'SUSPENDED' && (
        <p className="rounded-card bg-chili-50 px-4 py-3 text-sm text-chili-600">
          Your store is currently suspended. Contact support for details.
        </p>
      )}

      {vendor.status === 'APPROVED' && (
        <>
          {/* Prominent quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/vendor/dashboard/products/new" className="rounded-card bg-marigold p-4 text-center text-sm font-semibold text-ink-700 hover:bg-marigold-600">
              + Add Product
            </Link>
            <Link href="/vendor/dashboard/products" className="rounded-card bg-surface p-4 text-center text-sm font-semibold text-ink-700 shadow-card hover:shadow-cardHover">
              📦 Manage Products
            </Link>
            <Link href="/vendor/dashboard/products" className="rounded-card bg-surface p-4 text-center text-sm font-semibold text-ink-700 shadow-card hover:shadow-cardHover">
              📊 Manage Inventory
            </Link>
            <Link href="/vendor/dashboard/orders" className="rounded-card bg-surface p-4 text-center text-sm font-semibold text-ink-700 shadow-card hover:shadow-cardHover">
              🚚 View All Orders
            </Link>
          </div>

          {/* Period filter */}
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  period === p.value ? 'bg-ink-700 text-white' : 'bg-base text-ink-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* KPIs */}
          {summaryError ? (
            <ErrorRetry message="Unable to load sales data." onRetry={() => loadSummary(true)} />
          ) : summaryLoading || !summary ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: 'Revenue', value: formatPriceCents(summary.totalRevenueCents) },
                { label: 'Orders', value: summary.totalOrders },
                { label: 'Units Sold', value: summary.unitsSold },
                { label: 'Customers', value: summary.uniqueCustomers },
                { label: 'Avg Order Value', value: formatPriceCents(summary.averageOrderValueCents) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-card bg-surface p-4 shadow-card">
                  <p className="text-xs text-muted">{kpi.label}</p>
                  <p className="price-tag mt-1 text-xl font-bold text-ink-700">{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Requires attention */}
          {summary && !summaryError && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-ink-700">Requires Your Attention</h2>
              <div className="space-y-2">
                {(summary.orderPipeline['CONFIRMED'] ?? 0) > 0 && (
                  <Link href="/vendor/dashboard/orders" className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card hover:shadow-cardHover">
                    <span>🔴 {summary.orderPipeline['CONFIRMED']} new order{summary.orderPipeline['CONFIRMED'] !== 1 ? 's' : ''} awaiting processing</span>
                    <span className="text-sm font-semibold text-marigold-600">Process Orders →</span>
                  </Link>
                )}
                {summary.inventory.lowStock > 0 && (
                  <Link href="/vendor/dashboard/products" className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card hover:shadow-cardHover">
                    <span>🟠 {summary.inventory.lowStock} product{summary.inventory.lowStock !== 1 ? 's are' : ' is'} low in stock</span>
                    <span className="text-sm font-semibold text-marigold-600">Manage Inventory →</span>
                  </Link>
                )}
                {summary.inventory.outOfStock > 0 && (
                  <Link href="/vendor/dashboard/products" className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card hover:shadow-cardHover">
                    <span>🔴 {summary.inventory.outOfStock} product{summary.inventory.outOfStock !== 1 ? 's are' : ' is'} out of stock</span>
                    <span className="text-sm font-semibold text-marigold-600">Manage Inventory →</span>
                  </Link>
                )}
                {summary.pendingApprovalProducts > 0 && (
                  <Link href="/vendor/dashboard/products" className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card hover:shadow-cardHover">
                    <span>🟡 {summary.pendingApprovalProducts} product{summary.pendingApprovalProducts !== 1 ? 's' : ''} pending admin approval</span>
                    <span className="text-sm font-semibold text-marigold-600">View →</span>
                  </Link>
                )}
                {(summary.orderPipeline['CONFIRMED'] ?? 0) === 0 &&
                  summary.inventory.lowStock === 0 &&
                  summary.inventory.outOfStock === 0 &&
                  summary.pendingApprovalProducts === 0 && (
                    <p className="rounded-card bg-marigold-50 p-4 text-sm text-marigold-600">
                      🟢 All caught up — nothing needs your attention right now.
                    </p>
                  )}
              </div>
            </section>
          )}

          {/* Order pipeline */}
          {summary && !summaryError && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-ink-700">Order Pipeline</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PIPELINE_STAGES.map((stage) => (
                  <Link
                    key={stage}
                    href="/vendor/dashboard/orders"
                    className="rounded-card bg-surface p-4 text-center shadow-card hover:shadow-cardHover"
                  >
                    <p className="text-2xl font-bold text-ink-700">{summary.orderPipeline[stage] ?? 0}</p>
                    <p className="text-xs text-muted">{stage.charAt(0) + stage.slice(1).toLowerCase()}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Inventory health */}
          {summary && !summaryError && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-ink-700">Inventory Health</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'In Stock', value: inStockCount },
                  { label: 'Low Stock', value: summary.inventory.lowStock },
                  { label: 'Out of Stock', value: summary.inventory.outOfStock },
                  { label: 'Draft', value: summary.inventory.draft },
                ].map((item) => (
                  <div key={item.label} className="rounded-card bg-surface p-4 text-center shadow-card">
                    <p className="text-2xl font-bold text-ink-700">{item.value}</p>
                    <p className="text-xs text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent orders */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-700">Recent Orders</h2>
              <Link href="/vendor/dashboard/orders" className="text-sm font-semibold text-marigold-600">View All →</Link>
            </div>
            {ordersError ? (
              <ErrorRetry message="Unable to load orders." onRetry={loadOrders} />
            ) : recentOrders === null ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : recentOrders.length === 0 ? (
              <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">No orders yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-surface p-4 shadow-card">
                    <div>
                      <p className="text-sm font-semibold text-ink-700">{order.orderNumber}</p>
                      <p className="text-xs text-muted">
                        {order.user.firstName} {order.user.lastName} · {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {new Date(order.placedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="price-tag text-sm font-semibold">{formatPriceCents(order.totalCents)}</span>
                      <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700">{order.status}</span>
                      <Link href="/vendor/dashboard/orders" className="text-xs font-semibold text-marigold-600">View →</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Top selling products */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-ink-700">Top Selling Products</h2>
            {productsError ? (
              <ErrorRetry message="Unable to load products." onRetry={loadProducts} />
            ) : products === null ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
            ) : topProducts.length === 0 ? (
              <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">No sales yet — once you make sales, your top products will show here.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {topProducts.map((p) => (
                  <Link key={p.id} href={`/vendor/dashboard/products/${p.id}/edit`} className="rounded-card bg-surface p-3 shadow-card hover:shadow-cardHover">
                    <p className="line-clamp-2 text-sm font-medium text-ink-700">{p.title}</p>
                    <p className="mt-1 text-xs text-muted">{p.totalSold} sold</p>
                    {p.reviewCount > 0 && (
                      <p className="text-xs text-muted">★ {Number(p.averageRating).toFixed(1)} ({p.reviewCount})</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-700">Customer Reviews</h2>
              {summary && summary.reviews.totalReviews > 0 && (
                <span className="text-sm text-muted">★ {summary.reviews.averageRating.toFixed(1)} · {summary.reviews.totalReviews} reviews</span>
              )}
            </div>
            {reviewsError ? (
              <ErrorRetry message="Unable to load reviews." onRetry={loadReviews} />
            ) : reviews === null ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : reviews.length === 0 ? (
              <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">Your customer reviews will appear here.</p>
            ) : (
              <ul className="space-y-2">
                {reviews.slice(0, 5).map((r: any) => (
                  <li key={r.id} className="rounded-card bg-surface p-4 shadow-card">
                    <div className="mb-1 flex items-center gap-2 text-sm">
                      <span className="text-marigold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="font-medium text-ink-700">{r.user.firstName}</span>
                      <span className="text-xs text-muted">on {r.product.title}</span>
                    </div>
                    {r.body && <p className="text-sm text-muted">{r.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
