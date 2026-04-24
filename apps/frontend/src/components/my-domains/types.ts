import type { AppRouterOutput } from '@/lib/trpc';

export type DomainRow =
  AppRouterOutput['users']['getCurrentUserDomains'][number];

/**
 * Bulk toggle state of the "auto-renew" control in the floating action panel:
 * - `off`:   every selected domain has auto-renew disabled
 * - `on`:    every selected domain has auto-renew enabled
 * - `mixed`: selection spans both states
 */
export type BulkAutoRenewState = 'off' | 'mixed' | 'on';
