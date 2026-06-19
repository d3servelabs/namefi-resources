import { z } from 'zod';
import { announcementConditionSchema } from '../../announcements-condition';
import { isAllowedLinkUrl, linkTargetSchema } from '../announcements-contract';
import { createContract } from '../create-contract';

/** Optional CSS color override (e.g. "#6d28d9"); null clears it. */
const colorSchema = z.string().max(64).nullable().optional();

/**
 * CTA link: an http(s) URL, a `mailto:` link, or a same-origin `/path`.
 * Dangerous schemes like `javascript:` are rejected (the renderer re-checks).
 */
const linkUrlSchema = z
  .string()
  .max(2000)
  .refine(isAllowedLinkUrl, {
    message: 'Enter an http(s) URL, a mailto: link, or a /path',
  })
  .nullable()
  .optional();

/**
 * Admin-only CRUD for announcements.
 *
 * `list` returns full rows (including `condition`, `isActive`, scheduling
 * window, and timestamps) so the admin table can show everything. Mutations
 * are audited and gated on `ANNOUNCEMENTS;;WRITE`; `list` needs
 * `ANNOUNCEMENTS;;READ`. Middleware lives in the router file.
 */

/** Shared editable fields across create/update. */
const composeFields = {
  title: z.string().max(200).nullable().optional(),
  body: z.string().min(1).max(5000),
  backgroundColor: colorSchema,
  textColor: colorSchema,
  // Background opacity as a percent (0–100); null means fully opaque.
  backgroundOpacity: z.number().int().min(0).max(100).nullable().optional(),
  linkUrl: linkUrlSchema,
  linkLabel: z.string().max(120).nullable().optional(),
  linkTarget: linkTargetSchema.nullable().optional(),
  dismissible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  // Sites to show on: 'namefi' (main) and/or PBN `normalizedDomainName`s.
  targetSites: z.array(z.string().max(255)).min(1),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
  priority: z.number().int().default(0),
  condition: announcementConditionSchema.nullable().optional(),
};

/** Reject a window where the end is not strictly after the start. */
const validScheduleWindow = (v: {
  startsAt?: Date | null;
  endsAt?: Date | null;
}) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt;
const scheduleWindowError = {
  message: 'endsAt must be after startsAt',
  path: ['endsAt'],
};

const createInputSchema = z
  .object(composeFields)
  .refine(validScheduleWindow, scheduleWindowError);

const updateInputSchema = z
  .object({
    id: z.string().uuid(),
    title: composeFields.title,
    body: composeFields.body.optional(),
    backgroundColor: composeFields.backgroundColor,
    textColor: composeFields.textColor,
    backgroundOpacity: composeFields.backgroundOpacity,
    linkUrl: composeFields.linkUrl,
    linkLabel: composeFields.linkLabel,
    linkTarget: composeFields.linkTarget,
    dismissible: z.boolean().optional(),
    isActive: z.boolean().optional(),
    targetSites: composeFields.targetSites.optional(),
    startsAt: composeFields.startsAt,
    endsAt: composeFields.endsAt,
    priority: z.number().int().optional(),
    condition: composeFields.condition,
  })
  .strict()
  .refine(validScheduleWindow, scheduleWindowError);

/** Full row returned by `list` (mirrors the DB row). */
export const adminAnnouncementRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  body: z.string(),
  backgroundColor: z.string().nullable(),
  textColor: z.string().nullable(),
  backgroundOpacity: z.number().nullable(),
  linkUrl: z.string().nullable(),
  linkLabel: z.string().nullable(),
  linkTarget: linkTargetSchema.nullable(),
  dismissible: z.boolean(),
  isActive: z.boolean(),
  targetSites: z.array(z.string()).nullable(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  priority: z.number().int(),
  condition: announcementConditionSchema.nullable(),
  // Server-computed: whether `condition` currently holds (null = no condition),
  // plus a human-readable explanation for the admin table / debugging.
  conditionMet: z.boolean().nullable(),
  conditionDetail: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdminAnnouncementRow = z.infer<typeof adminAnnouncementRowSchema>;

export const adminAnnouncementsContract = createContract(
  { softOutput: true },
  {
    list: {
      type: 'query',
      input: z.void(),
      output: z.object({
        items: z.array(adminAnnouncementRowSchema),
      }),
    },
    // Powered-by-namefi domains available as announcement targets (the admin
    // form prepends a "namefi" main-site option, which maps to a null target).
    listSiteTargets: {
      type: 'query',
      input: z.void(),
      output: z.object({
        pbnDomains: z.array(z.string()),
      }),
    },
    create: {
      type: 'mutation',
      input: createInputSchema,
      output: z.object({ id: z.string().uuid() }),
    },
    update: {
      type: 'mutation',
      input: updateInputSchema,
      output: z.object({ id: z.string().uuid() }),
    },
    remove: {
      type: 'mutation',
      input: z.object({ id: z.string().uuid() }),
      output: z.object({ success: z.boolean() }),
    },
  },
);

export type AdminAnnouncementsContract = typeof adminAnnouncementsContract;
