import { LeadgenApp } from '@/components/leadgen/leadgen-app';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Namefi Outbound',
  description:
    'Explore possible buyers, outreach angles, public contacts when available, and editable drafts for domain sales.',
  alternates: {
    canonical: '/outbound',
  },
  openGraph: {
    title: 'Namefi Outbound',
    description:
      'Explore possible buyers, outreach angles, public contacts when available, and editable drafts for domain sales.',
    url: '/outbound',
  },
};

export default function OutboundPage() {
  return (
    <Suspense fallback={null}>
      <LeadgenApp />
    </Suspense>
  );
}
