import { adminProcedure, protectedProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { adminContract } from '@namefi-astra/common/contract/admin/admin-contract';
import { canUserAccessAdminPanel } from '../utils';
import { schedulesRouter } from './admin/schedulesRouter';
import { poweredByNamefiRouter } from './admin/poweredByNamefiRouter';
import { permissionsRouter } from './admin/permissionsRouter';
import { nfscRouter } from './admin/nfscRouter';
import { eppTestingRouter } from './admin/eppTestingRouter';
import { emailCampaignsRouter } from './admin/emailCampaignsRouter';
import { autoRenewalRouter } from './admin/autoRenewalRouter';
import { bulkBurnRouter } from './admin/bulkBurnRouter';
import { nftRouter } from './admin/nftRouter';
import { freeClaimsRouter } from './admin/freeClaimsRouter';
import { adminUsersRouter } from './admin/adminUsersRouter';
import { domainDetailsRouter } from './admin/domainDetailsRouter';
import { domainPreferencesRouter } from './admin/domainPreferencesRouter';
import { adminOrdersRouter } from './admin/adminOrdersRouter';
import { adminFinancialAnalyticsRouter } from './admin/adminFinancialAnalyticsRouter';
import { exportTrackingRouter } from './admin/exportTrackingRouter';
import { bigQueryAuditRouter } from './admin/bigQueryAuditRouter';
import { adminLoginHistoryRouter } from './admin/adminLoginHistoryRouter';
import { adminDnsvizRouter } from './admin/adminDnsvizRouter';
import { nsAndDnssecRouter } from './admin/nsAndDnssecRouter';
import { emailsRouter } from './admin/adminEmailsRouter';
import { adminNotificationsRouter } from './admin/adminNotificationsRouter';
import { config, secrets } from '#lib/env';
import { render } from '@react-email/components';
import React from 'react';
import { BaseEmailTemplate } from '../../mail/templates/base-email-template';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import { adminEmailsContract } from '@namefi-astra/common/contract/admin/admin-emails-contract';

export const adminRouter = createContractTRPCRouter<typeof adminContract>({
  isUserAdmin: protectedProcedure
    .input(adminContract.isUserAdmin.input)
    .output(adminContract.isUserAdmin.output)
    .query(async ({ ctx }) => {
      return await canUserAccessAdminPanel(ctx.user);
    }),

  // Subrouters
  schedules: schedulesRouter,
  poweredByNamefi: poweredByNamefiRouter,
  permissions: permissionsRouter,
  nfsc: nfscRouter,
  eppTesting: eppTestingRouter,
  emailCampaigns: emailCampaignsRouter,
  autoRenewal: autoRenewalRouter,
  bulkBurn: bulkBurnRouter,
  nft: nftRouter,
  freeClaims: freeClaimsRouter,
  users: adminUsersRouter,
  domainPreferences: domainPreferencesRouter,
  domainDetails: domainDetailsRouter,
  orders: adminOrdersRouter,
  financials: adminFinancialAnalyticsRouter,
  exportTracking: exportTrackingRouter,
  bigQueryAudit: bigQueryAuditRouter,
  loginHistory: adminLoginHistoryRouter,
  dnsviz: adminDnsvizRouter,
  nsAndDnssec: nsAndDnssecRouter,
  emails: emailsRouter,
  notifications: adminNotificationsRouter,
});
