import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

const title = 'Namefi Outbound | Find Domain Buyers';
const description =
  'Research likely domain buyers, discover public contacts, and draft outreach for domain sales with Namefi Outbound.';
const canonicalPath = '/outbound';
const openGraphImagePath = '/assets/outbound/opengraph-image.png';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalPath,
  },
  openGraph: {
    title,
    description,
    url: canonicalPath,
    type: 'website',
    images: [
      {
        url: openGraphImagePath,
        width: 1200,
        height: 630,
        alt: 'Namefi Outbound buyer discovery and outreach workflow',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    site: '@namefi_io',
    creator: '@namefi_io',
    images: [
      {
        url: openGraphImagePath,
        width: 1200,
        height: 630,
        alt: 'Namefi Outbound buyer discovery and outreach workflow',
      },
    ],
  },
};

export default function OutboundLayout({ children }: PropsWithChildren) {
  return children;
}
