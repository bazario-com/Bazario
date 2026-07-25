import Link from 'next/link';

const columns = [
  {
    title: 'Customer Service',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Track My Order', href: '/orders/track' },
      { label: 'Returns & Refunds', href: '/help/returns' },
      { label: 'Contact Us', href: '/help/contact' },
    ],
  },
  {
    title: 'Sell on Bazaario',
    links: [
      { label: 'Become a Vendor', href: '/vendor/register' },
      { label: 'Vendor Help', href: '/vendor/help' },
      { label: 'Commission & Fees', href: '/vendor/fees' },
    ],
  },
  {
    title: 'Payment',
    links: [
      { label: 'Cash on Delivery', href: '/help/payments' },
      { label: 'JazzCash & Easypaisa', href: '/help/payments' },
      { label: 'Cards & Wallets', href: '/help/payments' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Bazaario', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-ink-900 text-white/70">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold text-white">{col.title}</h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-marigold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Bazaario. All rights reserved.
      </div>
    </footer>
  );
}
