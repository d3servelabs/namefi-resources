import { protectedProcedure } from '../base';
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
import { domainPreferencesRouter } from './admin/domainPreferencesRouter';
import { adminOrdersRouter } from './admin/adminOrdersRouter';
import { exportTrackingRouter } from './admin/exportTrackingRouter';
import { bigQueryAuditRouter } from './admin/bigQueryAuditRouter';
import { adminLoginHistoryRouter } from './admin/adminLoginHistoryRouter';
import { adminDnsvizRouter } from './admin/adminDnsvizRouter';

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
  orders: adminOrdersRouter,
  exportTracking: exportTrackingRouter,
  bigQueryAudit: bigQueryAuditRouter,
  loginHistory: adminLoginHistoryRouter,
  dnsviz: adminDnsvizRouter,
});
