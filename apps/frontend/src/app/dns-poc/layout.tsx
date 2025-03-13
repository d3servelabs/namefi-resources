import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title: 'DNS Management',
  description: 'Manage your DNS records',
};

export default function DnsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
