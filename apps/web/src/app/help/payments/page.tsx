export default function PaymentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Payment Methods</h1>
      <div className="space-y-6 text-gray-700">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Cash on Delivery</h2>
          <p>Pay in cash when your order arrives at your doorstep — available nationwide.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">JazzCash & Easypaisa</h2>
          <p>Pay instantly using your JazzCash or Easypaisa mobile wallet at checkout.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-ink">Cards & Wallets</h2>
          <p>We accept major debit and credit cards for secure online payment.</p>
        </div>
      </div>
    </div>
  );
}
