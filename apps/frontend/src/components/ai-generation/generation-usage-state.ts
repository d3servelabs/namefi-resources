import type { AppRouterOutput } from '@/lib/trpc';

export type UserGenerationUsage =
  AppRouterOutput['ai']['getUserGenerationUsage'];

export type GenerationUsageViewState =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'ready'; usage: UserGenerationUsage };

export function shouldFetchGenerationUsage(isAuthenticated: boolean) {
  return isAuthenticated;
}

export function getGenerationUsageViewState({
  isAuthenticated,
  isLoading,
  usage,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
  usage?: UserGenerationUsage;
}): GenerationUsageViewState {
  if (!isAuthenticated) return { kind: 'hidden' };
  if (isLoading) return { kind: 'loading' };
  if (!usage) return { kind: 'hidden' };
  return { kind: 'ready', usage };
}
