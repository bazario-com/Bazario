export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Terms of Service</h1>
      <div className="space-y-4 text-gray-700 text-sm">
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          By accessing or using Shopina, you agree to be bound by these Terms of Service.
          Please read them carefully.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Using Shopina</h2>
        <p>
          Shopina is a marketplace connecting buyers with independent vendors. We facilitate
          transactions but individual vendors are responsible for the accuracy of their
          product listings and fulfillment of orders.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Orders & Payment</h2>
        <p>
          Orders are confirmed once payment is received or, for Cash on Delivery, once
          placed. Prices and availability are subject to change without notice.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Vendor Accounts</h2>
        <p>
          Vendors selling on Shopina agree to our commission structure, listed on our
          Commission & Fees page, and to provide accurate product and shipping information.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Limitation of Liability</h2>
        <p>
          Shopina is not liable for indirect or consequential damages arising from use of the
          platform, to the extent permitted by law.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of Shopina after changes
          constitutes acceptance of the revised terms.
        </p>
        <h2 className="pt-2 text-base font-semibold text-ink">Contact</h2>
        <p>
          Questions about these terms? Reach us at shopina.neotek@gmail.com.
        </p>
      </div>
    </div>
  );
}
