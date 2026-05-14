import { z } from 'zod';

import {
  notificationBodyTypeSchema,
  notificationRelatedResourceSchema,
} from '../../shared-schemas';
import { createContract } from '../create-contract';

/**
 * Admin contract for manually creating an in-app notification for a user.
 * Runtime lives at `apps/backend/src/trpc/routers/admin/adminNotificationsRouter.ts`.
 */

const adminCreateInputSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).optional(),
  body: z.string().min(1),
  bodyType: notificationBodyTypeSchema.optional(),
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

export const adminNotificationsContract = createContract(
  { softOutput: true },
  {
    adminCreate: {
      type: 'mutation',
      input: adminCreateInputSchema,
      output: adminCreateOutputSchema,
    },
  },
);

export type AdminNotificationsContract = typeof adminNotificationsContract;
