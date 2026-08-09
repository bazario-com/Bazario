export default function ContactUsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-display font-extrabold text-ink">Contact Us</h1>
      <p className="mb-6 text-gray-700">
        Have a question, issue with an order, or feedback for us? We're happy to help.
      </p>
      <div className="space-y-4 rounded-card bg-surface p-6 shadow-card">
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <a href="mailto:shopina.neotek@gmail.com" className="font-semibold text-ink hover:text-marigold">
            shopina.neotek@gmail.com
          </a>
        </div>
        <div>
          <p className="text-sm text-gray-500">Phone / WhatsApp</p>
          <a href="tel:+923115377997" className="font-semibold text-ink hover:text-marigold">
            +92 311 5377997
          </a>
        </div>
      </div>
    </div>
  );
}
