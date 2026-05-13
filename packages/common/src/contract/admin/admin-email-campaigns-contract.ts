import { EMAIL_CAMPAIGN_KEY_LIST } from '../../email-campaigns';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin email-campaigns sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/emailCampaignsRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminEmailCampaignsContract>`. Procedures
 * use `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

const emailCampaignKeySchema = z.enum(EMAIL_CAMPAIGN_KEY_LIST);

const campaignKeyInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
});

const getEligibleUsersInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  searchTerm: z.string().optional(),
});

const getDomainTrafficSurgeFunnelDebugInputSchema = z.object({
  searchTerm: z.string().optional(),
  limit: z.number().min(1).max(1000).default(250),
});

const sendNowInputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  userId: z.string().uuid(),
});

/**
 * `ScheduleStatus` mirror from
 * `apps/backend/src/temporal/schedules/types.ts`. Inlined here to avoid
 * a cross-contract import.
 */
const scheduleStatusSchema = z.object({
  scheduleId: z.string(),
  name: z.string(),
  description: z.string(),
  paused: z.boolean(),
  cronExpressions: z.array(z.string()),
  nextActionTimes: z.array(z.date()),
  recentActions: z.array(z.any()),
  category: z.string(),
  owner: z.string(),
});

const getScheduleStatusOutputSchema = z.union([
  z.object({
    campaignKey: emailCampaignKeySchema,
    scheduleId: z.string(),
    isConfigured: z.boolean(),
    status: scheduleStatusSchema,
    message: z.null(),
  }),
  z.object({
    campaignKey: emailCampaignKeySchema,
    scheduleId: z.string(),
    isConfigured: z.boolean(),
    status: z.null(),
    message: z.string(),
  }),
]);

const scheduleActionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaignKey: emailCampaignKeySchema,
  scheduleId: z.string(),
});

/**
 * `getEligibleUsers` returns an opaque list of eligible-user rows. The
 * top-level shape is concrete so tRPC inference works; `users[]` is
 * typed as `z.any()` rows because `EligibleUserRow` has many
 * conditionally-set fields. Using `z.array(z.any())` (rather than bare
 * `z.any()`) keeps `.users.map(...)` callbacks correctly typed as `any`.
 */
const getEligibleUsersOutputSchema = z.object({
  campaignKey: emailCampaignKeySchema,
  periodStart: z.date(),
  dreamOrderLookbackDays: z.number().nullable(),
  trafficWeeklyThreshold: z.number().nullable(),
  trafficWindowStartUtc: z.string().nullable(),
  trafficWindowEndUtc: z.string().nullable(),
  users: z.array(z.any()),
});

const getDomainTrafficSurgeFunnelDebugOutputSchema = z.object({
  periodStart: z.date(),
  trafficWeeklyThreshold: z.number(),
  trafficWindowStartUtc: z.string(),
  trafficWindowEndUtc: z.string(),
  summary: z.object({
    totalUsers: z.number(),
    droppedAtOwnership: z.number(),
    droppedAtNameservers: z.number(),
    droppedAtThreshold: z.number(),
    droppedAtAlreadySent: z.number(),
    fullyEligible: z.number(),
  }),
  users: z.array(z.any()),
});

const sendNowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaignKey: emailCampaignKeySchema,
  workflowId: z.string(),
  periodStart: z.date(),
});

/**
 * Bulk one-off email composer: ad-hoc admin send to a curated batch of
 * recipients. The template is Handlebars rendered against `{ user, privyUser }`
 * per recipient. Distinct from scheduled `email_campaign_sends` — no period
 * tracking; engagement is observed via `email_campaign_opens` /
 * `email_campaign_clicks` only when `campaignKey` is provided.
 */
const bulkOneOffRecipientSchema = z.object({
  email: z.string().email(),
  userId: z.string().uuid().optional(),
  privyUserId: z.string().min(1).optional(),
});

const campaignKeyFreeFormSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, {
    message:
      'Use letters, digits, hyphens, or underscores; must not start with a separator.',
  })
  .optional();

/**
 * From-address restriction for bulk one-off sends. Accepts either a bare
 * email or RFC-5321 `Name <email@domain>` form, as long as the email
 * domain is one of the namefi-owned domains. Exported so the frontend
 * can run the same regex for inline validation.
 */
export const bulkOneOffFromAddressSchema = z
  .string()
  .min(3)
  .max(160)
  .regex(/^\s*(?:[^<>]+<\s*)?[^@<>\s]+@(?:d3serve\.xyz|namefi\.io)\s*>?\s*$/i, {
    message:
      'From must end in @d3serve.xyz or @namefi.io (e.g. "Namefi <support@namefi.io>")',
  });

/**
 * Per-send template-style toggles. All optional; defaults give the full
 * branded layout (`useContainer + useHeader + useFooter` all on). Set
 * `useContainer: false` for a plain, unbranded email — header/footer are
 * implicitly ignored in that mode by `BaseEmailTemplate`.
 */
const bulkOneOffTemplateStyleSchema = z.object({
  useContainer: z.boolean().optional(),
  useHeader: z.boolean().optional(),
  useFooter: z.boolean().optional(),
});

const previewBulkOneOffEmailInputSchema = z.object({
  subject: z.string().min(1).max(200),
  markdown: z.string().min(1).max(50_000),
  campaignKey: campaignKeyFreeFormSchema,
  sampleRecipient: bulkOneOffRecipientSchema,
  templateStyle: bulkOneOffTemplateStyleSchema.optional(),
});

const previewBulkOneOffEmailOutputSchema = z.object({
  html: z.string(),
  // `null` when the sample recipient has no resolvable identifier.
  sampleContext: z
    .object({
      user: z.any().nullable(),
      privyUser: z.any().nullable(),
      recipientEmail: z.string().email(),
    })
    .nullable(),
  error: z.string().nullable(),
});

const sendBulkOneOffEmailInputSchema = z.object({
  subject: z.string().min(1).max(200),
  markdown: z.string().min(1).max(50_000),
  campaignKey: campaignKeyFreeFormSchema,
  recipients: z.array(bulkOneOffRecipientSchema).min(1).max(200),
  templateStyle: bulkOneOffTemplateStyleSchema.optional(),
  from: bulkOneOffFromAddressSchema.optional(),
  cc: z.array(z.string().email()).max(50).optional(),
  bcc: z.array(z.string().email()).max(50).optional(),
});

/**
 * Powers the per-recipient "is this email known?" amber indicator in the
 * bulk one-off composer. Returns a map keyed by the input email; a `null`
 * value means no user matched in either `users.primary_email` or the
 * Privy email cache.
 */
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

const sendBulkOneOffEmailOutputSchema = z.object({
  results: z.array(
    z.object({
      email: z.string().email(),
      status: z.enum(['sent', 'failed']),
      error: z.string().nullable(),
    }),
  ),
  summary: z.object({
    total: z.number(),
    sent: z.number(),
    failed: z.number(),
    campaignKey: z.string().nullable(),
  }),
});

/**
 * Powers the campaign-key autocomplete in the bulk one-off composer.
 * Returns the union of predefined scheduled-campaign keys and every
 * distinct ad-hoc key observed in `email_campaign_opens` /
 * `email_campaign_clicks`.
 */
const listKnownCampaignKeysOutputSchema = z.object({
  keys: z.array(z.string()),
});

/**
 * Engagement dashboard payload — raw rows from `email_campaign_opens` and
 * `email_campaign_clicks`. The frontend joins them by `campaignKey` to
 * produce the aggregate view.
 *
 * Intentionally unbounded for now: both tables are pre-aggregated counter
 * tables (UNIQUE on `campaign_key` for opens, UNIQUE on
 * `(campaign_key, group_identifier)` for clicks), so row count grows
 * linearly with `campaigns × distinct-links-per-campaign`, not with
 * traffic volume. Total rows stays in the low hundreds at expected scale.
 * If that assumption breaks, the contract input should switch to a
 * bounded shape (cursor + limit, or date window) and the procedure
 * should aggregate server-side by `campaignKey` / `groupIdentifier`.
 */
const listCampaignEngagementOutputSchema = z.object({
  opens: z.array(
    z.object({
      campaignKey: z.string(),
      openCount: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  clicks: z.array(
    z.object({
      campaignKey: z.string(),
      groupIdentifier: z.string(),
      clickCount: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
});

export const adminEmailCampaignsContract = createContract(
  { softOutput: true },
  {
    getScheduleStatus: {
      type: 'query',
      input: campaignKeyInputSchema,
      output: getScheduleStatusOutputSchema,
    },
    pauseSchedule: {
      type: 'mutation',
      input: campaignKeyInputSchema,
      output: scheduleActionOutputSchema,
    },
    resumeSchedule: {
      type: 'mutation',
      input: campaignKeyInputSchema,
      output: scheduleActionOutputSchema,
    },
    getEligibleUsers: {
      type: 'query',
      input: getEligibleUsersInputSchema,
      output: getEligibleUsersOutputSchema,
    },
    getDomainTrafficSurgeFunnelDebug: {
      type: 'query',
      input: getDomainTrafficSurgeFunnelDebugInputSchema,
      output: getDomainTrafficSurgeFunnelDebugOutputSchema,
    },
    sendNow: {
      type: 'mutation',
      input: sendNowInputSchema,
      output: sendNowOutputSchema,
    },
    previewBulkOneOffEmail: {
      type: 'query',
      input: previewBulkOneOffEmailInputSchema,
      output: previewBulkOneOffEmailOutputSchema,
    },
    sendBulkOneOffEmail: {
      type: 'mutation',
      input: sendBulkOneOffEmailInputSchema,
      output: sendBulkOneOffEmailOutputSchema,
    },
    listKnownCampaignKeys: {
      type: 'query',
      input: z.void(),
      output: listKnownCampaignKeysOutputSchema,
    },
    lookupUsersByEmail: {
      type: 'query',
      input: lookupUsersByEmailInputSchema,
      output: lookupUsersByEmailOutputSchema,
    },
    listCampaignEngagement: {
      type: 'query',
      input: z.void(),
      output: listCampaignEngagementOutputSchema,
    },
  },
);

export type AdminEmailCampaignsContract = typeof adminEmailCampaignsContract;
