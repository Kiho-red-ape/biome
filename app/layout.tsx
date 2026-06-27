import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import StagingBanner from '@/components/StagingBanner';
import { ReferralCapture } from '@/components/agent/referral-capture';

export const metadata: Metadata = {
  title: 'BIOME — Clinical Operations Platform',
  description: 'The operations layer for decentralized human studies. Recruitment, logistics, compliance, and payouts — protocol to data without a CRO.',
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StagingBanner />
        <ReferralCapture />
        <Providers>
          <div id="app-root">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
