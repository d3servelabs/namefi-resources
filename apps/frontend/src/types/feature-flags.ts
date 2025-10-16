'use client';

export type FeatureFlagScope = 'global' | 'page';

export interface FeatureFlagDefinition {
  /** Unique key for the flag within its scope */
  key: string;
  /** Human-friendly label shown in the sheet */
  label: string;
  /** Optional description shown in the sheet */
  description?: string;
  /** Default value when query param not present */
  defaultValue?: boolean;
  /** Scope of the flag */
  scope: FeatureFlagScope;
  /** Required when scope == 'page'; a stable identifier for the page */
  pageKey?: string;
}

/**
 * Build a stable query parameter key for a feature flag.
 * Global flags use the `ff_` prefix; page flags use `ffp_<pageKey>_`.
 */
export function getQueryParamKeyForFlag(def: FeatureFlagDefinition): string {
  if (def.scope === 'global') {
    return `ff_${def.key}`;
  }
  const pageKey = def.pageKey ?? 'page';
  return `ffp_${pageKey}_${def.key}`;
}
