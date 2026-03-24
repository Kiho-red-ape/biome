import type { Metadata } from 'next';
import { Familjen_Grotesk, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const familjenGrotesk = Familjen_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BIOME — Experiment Aggregator',
  description: 'The CoinGecko of scientific experiments. Discover bounty-based experiments, earn rewards, advance science.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${familjenGrotesk.variable} ${dmMono.variable}`}>
      <body>
        <Providers>
          <div id="app-root">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
