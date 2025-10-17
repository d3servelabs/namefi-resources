import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getDomainQueryParam } from '@/lib/request';
import { resolveParkTheme } from '@/lib/theme';
import { ThemeProvider } from '@/components/providers/theme';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Namefi Park',
  description:
    'Namefi Park provides a simple landing page for parked domains with marketplace links, AI previews, and newsletter signup.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const host =
    headerList.get('x-original-host') ?? headerList.get('host') ?? null;
  const domainOverride = getDomainQueryParam(headerList);
  const theme = resolveParkTheme({ host, domain: domainOverride });

  return (
    <html lang="en" className="dark" data-theme={theme}>
      <body
        data-theme={theme}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme={theme}
          forcedTheme={theme}
          enableSystem={false}
          disableTransitionOnChange={true}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
