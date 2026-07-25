import type { Metadata } from 'next';
import { Sora, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'Bazaario — Shop everything, from every corner of Pakistan',
    template: '%s | Bazaario',
  },
  description:
    'A multi-vendor marketplace for electronics, fashion, home goods and more — with flash sales, verified vendors and nationwide delivery.',
  openGraph: {
    title: 'Bazaario',
    description: 'Shop everything, from every corner of Pakistan.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched server-side so the mega menu is present in the initial HTML
  // (no flash of empty nav) and cached per the `revalidate` set in lib/api.
  const categories = await api.categories.list().catch(() => []);

  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <AuthProvider>
          <CartProvider>
            <Header categories={categories} />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
