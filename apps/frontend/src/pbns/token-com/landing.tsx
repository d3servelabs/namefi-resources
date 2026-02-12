'use client';

import type { LandingComponent } from '@/components/search';
import { useSearchParams } from 'next/navigation';
import { TokenComVariantALanding } from './variants/variant-a';
import { TokenComVariantBLanding } from './variants/variant-b';
import { TokenComVariantCLanding } from './variants/variant-c';

type VariantKey = 'a' | 'b' | 'c';

const DEFAULT_VARIANT: VariantKey = 'a';

function resolveVariant(rawVariant: string | null): VariantKey {
  if (rawVariant === 'a' || rawVariant === 'b' || rawVariant === 'c') {
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

  if (variant === 'c') {
    return <TokenComVariantCLanding origin={origin} />;
  }

  return <TokenComVariantALanding origin={origin} />;
};

Landing.displayName = 'TokenComLanding';
