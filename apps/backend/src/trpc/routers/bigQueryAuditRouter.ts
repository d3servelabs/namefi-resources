import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../base';
import { getBigQueryAuditClient } from '../../lib/bigquery_audit_client';
import { logger } from '#lib/logger';
import { config } from '../../lib/env';

const listInput = z.object({
  pageSize: z.number().min(1).max(1000).default(50),
  pageToken: z.string().optional(),
  orderBy: z
    .enum(['timestamp_desc', 'timestamp_asc'])
    .default('timestamp_desc'),
  filters: z
    .object({
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      actorType: z.string().optional(),
      actorId: z.string().optional(),
      action: z.string().optional(),
      timestampGte: z.number().optional(),
      timestampLte: z.number().optional(),
    })
    .optional(),
});

export const bigQueryAuditRouter = createTRPCRouter({
  list: adminProcedure.input(listInput).query(async ({ input }) => {
    logger.info('Listing audit logs');
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
