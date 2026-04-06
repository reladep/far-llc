import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Mono, Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Visor Index — See Your Advisor Clearly',
    template: '%s | Visor Index',
  },
  description:
    'Search, compare, and connect with SEC-registered investment advisors. Transparent data on fees, AUM, services, and client reviews.',
  metadataBase: new URL('https://far.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${dmMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-bg-primary text-text-primary font-sans antialiased">
        <Header />
        <ToastProvider>
          <main className="flex-1">{children}</main>
        </ToastProvider>
        <Footer />
      </body>
    </html>
  );
}
