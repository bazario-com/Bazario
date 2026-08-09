export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Privacy Policy</h1>
      <div className="space-y-4 text-gray-700 text-sm">
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          Shopina respects your privacy. This policy explains what information we collect,
          how we use it, and the choices you have.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Information We Collect</h2>
        <p>
          We collect information you provide directly, such as your name, email, phone
          number, and shipping address when you create an account or place an order. We also
          collect order and payment information necessary to process transactions.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">How We Use Your Information</h2>
        <p>
          We use your information to process orders, communicate with you about your
          purchases, improve our platform, and comply with legal obligations. We do not sell
          your personal information to third parties.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Data Sharing</h2>
        <p>
          We share order details with vendors fulfilling your order and courier partners
          delivering your package, only as needed to complete your transaction.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by
          contacting us at shopina.neotek@gmail.com.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Contact</h2>
        <p>
          If you have questions about this policy, reach us at shopina.neotek@gmail.com or
          +92 311 5377997.
        </p>
      </div>
    </div>
  );
}
