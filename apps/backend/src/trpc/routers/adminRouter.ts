import { Permission } from '@namefi-astra/utils';
import {
  adminProcedureWithPermissions,
  createTRPCRouter,
  protectedProcedure,
} from '../base';
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

export const adminRouter = createTRPCRouter({
  isUserAdmin: protectedProcedure.query(async ({ ctx }) => {
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
});
