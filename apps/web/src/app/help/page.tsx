import Link from 'next/link';

const topics = [
  { title: 'Returns & Refunds', href: '/help/returns', description: 'How to return an item and get your refund.' },
  { title: 'Payment Methods', href: '/help/payments', description: 'Cash on Delivery, JazzCash, Easypaisa, and cards.' },
  { title: 'Track My Order', href: '/orders/track', description: 'Check the status of your recent orders.' },
  { title: 'Contact Us', href: '/help/contact', description: 'Reach our support team directly.' },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-3 text-3xl font-display font-extrabold text-ink">Help Center</h1>
      <p className="mb-8 text-gray-600">
        Find answers to common questions, or reach out to our team directly.
      </p>
      <div className="space-y-3">
        {topics.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            className="block rounded-card bg-surface p-5 shadow-card transition hover:shadow-cardHover"
          >
            <p className="font-semibold text-ink">{topic.title}</p>
            <p className="text-sm text-gray-500">{topic.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
