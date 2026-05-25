import {
  FEATURE_KEYS,
  FEATURE_PAGES,
  FeatureLandingPage,
  getFeatureMetadata,
  isFeatureKey,
} from '@/components/feature-landing/feature-landing-page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params?: Promise<{ feature?: string } | undefined>;
};

export function generateStaticParams() {
  return FEATURE_KEYS.map((feature) => ({ feature }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const routeParams = (await params) ?? {};
  const { feature } = routeParams;

  if (!isFeatureKey(feature)) {
    return {};
  }

  return getFeatureMetadata(FEATURE_PAGES[feature]);
}

export default async function FeaturePage({ params }: Props) {
  const routeParams = (await params) ?? {};
  const { feature } = routeParams;

  if (!isFeatureKey(feature)) {
    notFound();
  }

  return <FeatureLandingPage feature={FEATURE_PAGES[feature]} />;
}
