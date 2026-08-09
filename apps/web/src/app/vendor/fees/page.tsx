export default function VendorFeesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Commission & Fees</h1>
      <div className="space-y-4 text-gray-700">
        <p>
          Shopina charges a flat commission of <span className="font-semibold">3%</span> on
          each completed sale. There are no listing fees, no monthly subscription, and no
          hidden charges.
        </p>
        <p>
          The commission is automatically deducted before payout, so the amount you see in
          your vendor dashboard is the amount you'll receive.
        </p>
        <p className="text-sm text-gray-500">
          Commission rates are subject to change with advance notice to vendors.
        </p>
      </div>
    </div>
  );
}
