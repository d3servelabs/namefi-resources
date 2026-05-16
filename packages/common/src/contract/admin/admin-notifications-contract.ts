import { z } from 'zod';

import {
  notificationBodyTypeSchema,
  notificationRelatedResourceSchema,
} from '../../shared-schemas';
import { createContract } from '../create-contract';

/**
 * Admin-only procedures for in-app notifications.
 *
 * `adminCreate` pushes a notification to one user; `adminCreateBulk` to a
 * chosen set (synchronous, capped); `adminBroadcast` to every user (via a
 * Temporal workflow). Every mutation is audited — notifications that
 * surface in a user's UI are a sensitive surface area (phishing vector if
 * misused). `lookupUsersByEmail` / `getBroadcastAudienceSize` back the
 * admin compose page.
 */

/** Shared compose fields across the single / bulk / broadcast inputs. */
const composeFields = {
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).optional(),
  body: z.string().min(1),
  bodyType: notificationBodyTypeSchema.optional(),
};

const adminCreateInputSchema = z.object({
  ...composeFields,
  userId: z.string().uuid(),
  relatedResources: z.array(notificationRelatedResourceSchema).optional(),
  metadata: z
    .object({
      source: z.string().optional(),
    })
    .loose()
    .optional(),
});

const adminCreateOutputSchema = z.object({
  id: z.string().uuid(),
});

const adminCreateBulkInputSchema = z.object({
  ...composeFields,
  userIds: z.array(z.string().uuid()).min(1).max(500),
});

const adminCreateBulkOutputSchema = z.object({
  results: z.array(
    z.object({
      userId: z.string().uuid(),
      status: z.enum(['created', 'failed']),
      error: z.string().nullable(),
    }),
  ),
  summary: z.object({
    total: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});

const adminBroadcastInputSchema = z.object({
  ...composeFields,
});

const adminBroadcastOutputSchema = z.object({
  workflowId: z.string(),
  audienceSize: z.number().int().nonnegative(),
});

const lookupUsersByEmailInputSchema = z.object({
  emails: z.array(z.string().email()).max(200),
});

const lookupUsersByEmailOutputSchema = z.object({
  results: z.record(
    z.string(),
    z
      .object({
        userId: z.string().uuid().nullable(),
        privyUserId: z.string().nullable(),
        displayName: z.string().nullable(),
      })
      .nullable(),
  ),
});

const getBroadcastAudienceSizeOutputSchema = z.object({
  count: z.number().int().nonnegative(),
});

export const adminNotificationsContract = createContract(
  { softOutput: true },
  {
    adminCreate: {
      type: 'mutation',
      input: adminCreateInputSchema,
      output: adminCreateOutputSchema,
    },
    adminCreateBulk: {
      type: 'mutation',
      input: adminCreateBulkInputSchema,
      output: adminCreateBulkOutputSchema,
    },
    adminBroadcast: {
      type: 'mutation',
      input: adminBroadcastInputSchema,
      output: adminBroadcastOutputSchema,
    },
    lookupUsersByEmail: {
      type: 'query',
      input: lookupUsersByEmailInputSchema,
      output: lookupUsersByEmailOutputSchema,
    },
    getBroadcastAudienceSize: {
      type: 'query',
      input: z.void(),
      output: getBroadcastAudienceSizeOutputSchema,
    },
  },
);

export type AdminNotificationsContract = typeof adminNotificationsContract;
