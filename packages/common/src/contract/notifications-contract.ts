import { z } from 'zod';

import {
  notificationBodyTypeSchema,
  notificationRelatedResourceSchema,
  notificationResourceTypeSchema,
} from '../shared-schemas';
import { createContract } from './create-contract';

/**
 * Contract for the user-facing notifications router.
 *
 * The runtime router lives at
 * `apps/backend/src/trpc/routers/notificationsRouter.ts` and is type-checked
 * against this contract via `createContractTRPCRouter<typeof notificationsContract>`.
 * All procedures are user-scoped: queries return only the caller's rows and
 * mutations only act on rows whose `userId` matches the caller.
 *
 * `isSeen` / `isArchived` are derived from `seenAt` / `archivedAt` and
 * returned alongside the raw timestamps for UI convenience.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const idsInputSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

const resourceFilterSchema = z.object({
  relatedResourceType: notificationResourceTypeSchema.optional(),
  relatedResourceIdentifier: z.string().min(1).optional(),
});

const notificationMetadataSchema = z
  .object({
    autoMarkedAsSeen: z.boolean().optional(),
    source: z.string().optional(),
  })
  .loose();

export const notificationDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  body: z.string(),
  bodyType: notificationBodyTypeSchema,
  relatedResources: z.array(notificationRelatedResourceSchema),
  metadata: notificationMetadataSchema,
  seenAt: z.date().nullable(),
  archivedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isSeen: z.boolean(),
  isArchived: z.boolean(),
});
export type NotificationDto = z.infer<typeof notificationDtoSchema>;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const listInputSchema = z
  .object({
    cursor: z.string().nullish(),
    limit: z.number().int().positive().max(100).optional(),
    includeArchived: z.boolean().optional(),
    includeSeen: z.boolean().optional(),
  })
  .merge(resourceFilterSchema);

const unreadCountInputSchema = resourceFilterSchema;

const markAllAsSeenInputSchema = resourceFilterSchema;

const markAsSeenInputSchema = idsInputSchema.extend({
  autoMarked: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const listOutputSchema = z.object({
  items: z.array(notificationDtoSchema),
  nextCursor: z.string().nullable(),
});

const unreadCountOutputSchema = z.object({
  count: z.number().int().nonnegative(),
});

const mutationOutputSchema = z.object({
  updated: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const notificationsContract = createContract(
  { softOutput: true },
  {
    list: {
      type: 'query',
      input: listInputSchema,
      output: listOutputSchema,
    },
    getUnreadCount: {
      type: 'query',
      input: unreadCountInputSchema,
      output: unreadCountOutputSchema,
    },
    markAsSeen: {
      type: 'mutation',
      input: markAsSeenInputSchema,
      output: mutationOutputSchema,
    },
    markAsUnseen: {
      type: 'mutation',
      input: idsInputSchema,
      output: mutationOutputSchema,
    },
    archive: {
      type: 'mutation',
      input: idsInputSchema,
      output: mutationOutputSchema,
    },
    unarchive: {
      type: 'mutation',
      input: idsInputSchema,
      output: mutationOutputSchema,
    },
    markAllAsSeen: {
      type: 'mutation',
      input: markAllAsSeenInputSchema,
      output: mutationOutputSchema,
    },
  },
);

export type NotificationsContract = typeof notificationsContract;
