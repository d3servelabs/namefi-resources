'use client';

import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import AlternateCartPage from './alternate';
import OriginalCartPage from './original';

const CART_FLAG_DEFINITION: FeatureFlagDefinition = {
  key: 'hybrid_cart',
  label: 'Hybrid Cart',
  description: 'Use the new cart page that combines payment methods',
  scope: 'page',
  pageKey: 'cart',
  defaultValue: false,
};

export default function CartPage() {
  useRegisterAdminFlags([CART_FLAG_DEFINITION]);

  const [hybridCart] = useAdminFeatureFlag(CART_FLAG_DEFINITION);

  return hybridCart ? <AlternateCartPage /> : <OriginalCartPage />;
}
