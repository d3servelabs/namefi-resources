import {
  FEATURE_PAGES,
  FeatureLandingPage,
  getFeatureMetadata,
} from '@/components/feature-landing/feature-landing-page';
import type { Metadata } from 'next';

const feature = FEATURE_PAGES['brand-studio'];

export const metadata: Metadata = getFeatureMetadata(feature);

export default function BrandStudioFeaturePage() {
  return <FeatureLandingPage feature={feature} />;
}
