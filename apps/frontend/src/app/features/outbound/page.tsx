import {
  FEATURE_PAGES,
  FeatureLandingPage,
  getFeatureMetadata,
} from '@/components/feature-landing/feature-landing-page';
import type { Metadata } from 'next';

const feature = FEATURE_PAGES.outbound;

export const metadata: Metadata = getFeatureMetadata(feature);

export default function OutboundFeaturePage() {
  return <FeatureLandingPage feature={feature} />;
}
