'use client';

import React, { useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import type { FeatureFlagDefinition } from '../../../types/feature-flags';
import { useAdminFeatureFlags, useAdminFeatureFlagsSheet } from './context';

export function useRegisterAdminFlags(flags: FeatureFlagDefinition[]) {
  const { register } = useAdminFeatureFlags();
  const { setPageKey } = useAdminFeatureFlagsSheet();
  const memoizedFlags = useMemo(() => flags, [flags]);
  useEffect(() => {
    if (!Array.isArray(memoizedFlags) || memoizedFlags.length === 0) return;
    register(memoizedFlags);
    const pageScoped = memoizedFlags.find(
      (f) => f.scope === 'page' && f.pageKey,
    );
    if (pageScoped?.pageKey) {
      setPageKey(pageScoped.pageKey);
    }
  }, [memoizedFlags, register, setPageKey]);
}

export function withAdminFlags<P extends object>(
  Component: ComponentType<P>,
  flags: FeatureFlagDefinition[],
) {
  function Wrapped(props: P) {
    useRegisterAdminFlags(flags);
    return React.createElement(Component, { ...(props as unknown as P) });
  }
  Wrapped.displayName = `withAdminFlags(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
