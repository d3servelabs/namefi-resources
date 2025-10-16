'use client';

import { parseAsBoolean, useQueryState } from 'nuqs';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { getQueryParamKeyForFlag } from '@/types/feature-flags';

export function useAdminFeatureFlag(
  def: FeatureFlagDefinition,
): [boolean, (next: boolean) => void] {
  const key = getQueryParamKeyForFlag(def);
  const [value, setValue] = useQueryState(
    key,
    parseAsBoolean
      .withDefault(def.defaultValue ?? false)
      .withOptions({ clearOnDefault: true }),
  );
  return [Boolean(value), (next: boolean) => setValue(next)];
}
