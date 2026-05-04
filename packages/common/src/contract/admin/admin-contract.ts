import { z } from 'zod';

import { adminAutoRenewalContract } from './admin-auto-renewal-contract';
import { adminBigQueryAuditContract } from './admin-big-query-audit-contract';
import { adminBulkBurnContract } from './admin-bulk-burn-contract';
import { adminDnsvizContract } from './admin-dnsviz-contract';
import { adminDomainPreferencesContract } from './admin-domain-preferences-contract';
import { adminEmailCampaignsContract } from './admin-email-campaigns-contract';
import { adminEppTestingContract } from './admin-epp-testing-contract';
import { adminExportTrackingContract } from './admin-export-tracking-contract';
import { adminFinancialAnalyticsContract } from './admin-financial-analytics-contract';
import { adminFreeClaimsContract } from './admin-free-claims-contract';
import { adminLoginHistoryContract } from './admin-login-history-contract';
import { adminNfscContract } from './admin-nfsc-contract';
import { adminNftContract } from './admin-nft-contract';
import { adminOrdersContract } from './admin-orders-contract';
import { adminPermissionsContract } from './admin-permissions-contract';
import { adminPoweredByNamefiContract } from './admin-powered-by-namefi-contract';
import { adminSchedulesContract } from './admin-schedules-contract';
import { adminUsersContract } from './admin-users-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Top-level contract for the admin router.
 *
 * The router (`apps/backend/src/trpc/routers/adminRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminContract>`. It contains a single
 * top-level `isUserAdmin` query and nested sub-contracts — each one
 * corresponds to a sub-router under
 * `apps/backend/src/trpc/routers/admin/*`.
 *
 * The nested sub-contracts are defined in their own files so they can be
 * updated independently; this file just composes them into the shape the
 * adminRouter exposes on the wire.
 */

const isUserAdminOutputSchema = z.boolean();

export const adminContract = {
  isUserAdmin: {
    type: 'query',
    input: z.void(),
    output: isUserAdminOutputSchema,
  },
  schedules: adminSchedulesContract,
  poweredByNamefi: adminPoweredByNamefiContract,
  permissions: adminPermissionsContract,
  nfsc: adminNfscContract,
  eppTesting: adminEppTestingContract,
  emailCampaigns: adminEmailCampaignsContract,
  autoRenewal: adminAutoRenewalContract,
  bulkBurn: adminBulkBurnContract,
  nft: adminNftContract,
  freeClaims: adminFreeClaimsContract,
  users: adminUsersContract,
  domainPreferences: adminDomainPreferencesContract,
  orders: adminOrdersContract,
  financials: adminFinancialAnalyticsContract,
  exportTracking: adminExportTrackingContract,
  bigQueryAudit: adminBigQueryAuditContract,
  loginHistory: adminLoginHistoryContract,
  dnsviz: adminDnsvizContract,
} as const satisfies RouterContract;

export type AdminContract = typeof adminContract;
