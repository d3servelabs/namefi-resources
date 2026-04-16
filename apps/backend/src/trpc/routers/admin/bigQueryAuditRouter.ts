import { adminProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminBigQueryAuditContract } from '@namefi-astra/common/contract/admin/admin-big-query-audit-contract';
import { getBigQueryAuditClient } from '../../../lib/bigquery_audit_client';
import { logger } from '#lib/logger';
import { config } from '../../../lib/env';

export const bigQueryAuditRouter = createContractTRPCRouter<
  typeof adminBigQueryAuditContract
>({
  list: adminProcedure
    .input(adminBigQueryAuditContract.list.input)
    .output(adminBigQueryAuditContract.list.output)
    .query(async ({ input }) => {
      logger.debug('Listing audit logs');
      const c = getBigQueryAuditClient();
      const serviceNames = config.BIGQUERY_AUDIT_SERVICE_NAMES;

      try {
        const result = await c.listAuditLogs({
          pageSize: input.pageSize,
          pageToken: input.pageToken,
          orderBy: input.orderBy,
          filters: input.filters,
          serviceNames,
        });

        return result;
      } catch (error) {
        logger.error({ error }, 'Error listing audit logs');
        throw error;
      }
    }),
});
