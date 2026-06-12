import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { adminContract } from '@namefi-astra/common/contract/admin/admin-contract';
import { aiCreditsRouter } from './admin/aiCreditsRouter';
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
import { adminAnnouncementsRouter } from './admin/adminAnnouncementsRouter';
import { namefiFeedRouter } from './admin/namefiFeedRouter';
import { workflowDecisionRouter } from './admin/workflowDecisionRouter';
import { workflowSignalRouter } from './admin/workflowSignalRouter';

export const adminRouter = createContractTRPCRouter<typeof adminContract>({
  isUserAdmin: protectedProcedure
    .input(adminContract.isUserAdmin.input)
    .output(adminContract.isUserAdmin.output)
    .query(async ({ ctx }) => {
      return await canUserAccessAdminPanel(ctx.user);
    }),

  // Crash-testing endpoint: mirrors the Hono `/test-failure` route but on the
  // tRPC surface, so the tRPC errorFormatter → HTTP alert path can be verified.
  testFailure: adminProcedure
    .input(adminContract.testFailure.input)
    .output(adminContract.testFailure.output)
    .mutation(async ({ input }) => {
      throw new TRPCError({
        code: input.code,
        message: `Admin crash test: intentional ${input.code} from tRPC for HTTP alert verification.`,
      });
    }),

  // Subrouters
  aiCredits: aiCreditsRouter,
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
  namefiFeed: namefiFeedRouter,
  dnsviz: adminDnsvizRouter,
  nsAndDnssec: nsAndDnssecRouter,
  emails: emailsRouter,
  notifications: adminNotificationsRouter,
  announcements: adminAnnouncementsRouter,
  workflowDecision: workflowDecisionRouter,
  workflowSignal: workflowSignalRouter,
});
