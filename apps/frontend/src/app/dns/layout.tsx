import type { Metadata } from 'next';

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
