import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { BRAND } from '@/lib/constants';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://eventura-ai.vercel.app'),
  title: { default: `${BRAND.name} — Beautifully planned.`, template: "%s | Eventura AI" },
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/eventura-mark.svg', type: 'image/svg+xml' }], apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }] },
  description: BRAND.description,
  openGraph: { title: `${BRAND.name} — Beautifully planned.`, description: BRAND.description, images: [{ url: BRAND.logo, width: 1024, height: 765, alt: 'Eventura AI Logo' }] },
  keywords: ['event planning', 'AI', 'wedding planner', 'birthday planner', 'event management'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
