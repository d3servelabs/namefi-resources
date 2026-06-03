import type { AppRouterOutput } from '@/lib/trpc';
import { describe, expect, it } from 'vitest';

import {
  getGenerationUsageViewState,
  shouldFetchGenerationUsage,
} from './generation-usage-state';

type UserGenerationUsage = AppRouterOutput['ai']['getUserGenerationUsage'];

const usage = {
  awardedCredits: 0,
  baseMaxCredits: 10,
  currentCredits: 2,
  maxCredits: 10,
  remainingCredits: 8,
  creditsRefreshAt: new Date('2026-05-21T00:00:00Z'),
  currentCount: 2,
  maxGenerations: 10,
  remainingGenerations: 8,
  hasReachedLimit: false,
  creditCosts: {} as UserGenerationUsage['creditCosts'],
} satisfies UserGenerationUsage;

describe('shouldFetchGenerationUsage', () => {
  it('only enables the protected usage query for authenticated users', () => {
    expect(shouldFetchGenerationUsage(false)).toBe(false);
    expect(shouldFetchGenerationUsage(true)).toBe(true);
  });
});

describe('getGenerationUsageViewState', () => {
  it('hides stale cached usage while unauthenticated', () => {
    expect(
      getGenerationUsageViewState({
        isAuthenticated: false,
        isLoading: false,
        usage,
      }),
    ).toEqual({ kind: 'hidden' });
  });

  it('shows the authenticated loading state before usage is available', () => {
    expect(
      getGenerationUsageViewState({
        isAuthenticated: true,
        isLoading: true,
      }),
    ).toEqual({ kind: 'loading' });
  });

  it('shows authenticated usage when it has loaded', () => {
    expect(
      getGenerationUsageViewState({
        isAuthenticated: true,
        isLoading: false,
        usage,
      }),
    ).toEqual({ kind: 'ready', usage });
  });

  it('hides stale usage after an auth-state transition to signed out', () => {
    const authenticated = getGenerationUsageViewState({
      isAuthenticated: true,
      isLoading: false,
      usage,
    });
    const signedOut = getGenerationUsageViewState({
      isAuthenticated: false,
      isLoading: false,
      usage,
    });

    expect(authenticated.kind).toBe('ready');
    expect(signedOut).toEqual({ kind: 'hidden' });
  });
});
