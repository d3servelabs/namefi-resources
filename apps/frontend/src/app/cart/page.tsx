'use client';

import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import AlternateCartPage from './alternate';
import OriginalCartPage from './original';

const CART_FLAG_DEFINITION: FeatureFlagDefinition = {
  key: 'old_cart',
  label: 'Old Cart',
  description: 'Use the old cart page that does not combine payment methods',
  scope: 'page',
  pageKey: 'cart',
  defaultValue: false,
};

export default function CartPage() {
  useRegisterAdminFlags([CART_FLAG_DEFINITION]);

  const [oldCart] = useAdminFeatureFlag(CART_FLAG_DEFINITION);

  return oldCart ? <OriginalCartPage /> : <AlternateCartPage />;
}
