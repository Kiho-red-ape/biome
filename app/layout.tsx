import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import StagingBanner from '@/components/StagingBanner';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StagingBanner />
        <Providers>
          <div id="app-root">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
