'use client';

import type { LandingComponent } from '@/components/search';
import { useSearchParams } from 'next/navigation';
import { TokenComVariantALanding } from './variants/variant-a';
import { TokenComVariantBLanding } from './variants/variant-b';

type VariantKey = 'a' | 'b';

const DEFAULT_VARIANT: VariantKey = 'a';

function resolveVariant(rawVariant: string | null): VariantKey {
  if (rawVariant === 'a' || rawVariant === 'b') {
    return rawVariant;
  }

  return DEFAULT_VARIANT;
}

export const Landing: LandingComponent = ({ origin }) => {
  const searchParams = useSearchParams();
  const variant = resolveVariant(searchParams.get('variant'));

  if (variant === 'b') {
    return <TokenComVariantBLanding origin={origin} />;
  }

  return <TokenComVariantALanding origin={origin} />;
};

Landing.displayName = 'TokenComLanding';
