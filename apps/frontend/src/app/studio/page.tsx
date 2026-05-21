import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  NamefiBrandStudioClient,
  NamefiBrandStudioSkeleton,
} from './studio-client';

export const metadata: Metadata = {
  title: 'Namefi Brand Studio',
  description:
    'Create AI logos, posters, and animations for domain brands with Namefi Brand Studio.',
  alternates: {
    canonical: '/studio',
  },
  openGraph: {
    title: 'Namefi Brand Studio',
    description:
      'Create AI logos, posters, and animations for domain brands with Namefi Brand Studio.',
    url: '/studio',
  },
};

export default function NamefiBrandStudioPage() {
  return (
    <Suspense fallback={<NamefiBrandStudioSkeleton />}>
      <NamefiBrandStudioClient />
    </Suspense>
  );
}
