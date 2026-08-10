export default function VendorHelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Vendor Help Center</h1>
      <div className="space-y-6 text-gray-700">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Getting Started</h2>
          <p>
            Register as a vendor, list your products, and start selling — approval typically
            happens within 1-2 business days after registration.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Managing Orders</h2>
          <p>
            View and update order status from your vendor dashboard. Once an order is marked
            "Processing," you can create a shipment and hand it off to our courier partner.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Commission & Payouts</h2>
          <p>
            Shopina charges a flat 3% commission per sale — see our{' '}
            <a href="/vendor/fees" className="font-semibold text-ink hover:text-marigold">
              Commission & Fees
            </a>{' '}
            page for details.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Need More Help?</h2>
          <p>
            Reach out to us directly at{' '}
            <a href="mailto:shopina.neotek@gmail.com" className="font-semibold text-ink hover:text-marigold">
              shopina.neotek@gmail.com
            </a>{' '}
            or +92 311 5377997.
          </p>
        </div>
      </div>
    </div>
  );
}
