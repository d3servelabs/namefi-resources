import {
  FEATURE_PAGES,
  FeatureLandingPage,
  getFeatureMetadata,
} from '@/components/feature-landing/feature-landing-page';
import type { Metadata } from 'next';

const feature = FEATURE_PAGES.feed;

export const metadata: Metadata = getFeatureMetadata(feature);

export default function FeedFeaturePage() {
  return <FeatureLandingPage feature={feature} />;
}
