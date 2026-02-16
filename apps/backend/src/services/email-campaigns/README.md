# Email Campaigns

System for scheduled marketing emails.

## Flow

1. A Temporal schedule triggers a workflow on a cron (UTC).
2. The workflow computes `periodStart` and loads eligible users.
3. The send activity re-checks eligibility, enforces idempotency, sends, and records status.

## Idempotency

- Unique constraint: `(user_id, campaign_key, period_start)`.
- `periodStart` is the de-duplication window.
- Statuses: `PENDING`, `SENT`, `FAILED`.

## Current Campaigns

| Key | Cadence | Schedule (UTC) | Eligibility Summary | Template |
| --- | --- | --- | --- | --- |
| `cart-domains-popular` | Weekly | Monday 16:00 (`0 16 * * 1`) | Subscribed, has email, cart items older than 1 day, not sent this period | `apps/backend/src/mail/templates/cart-domains-popular.tsx` |
| `dream-domain-awaits` | Monthly | 1st day 16:00 (`0 16 1 * *`) | Subscribed, has email, no cart items, no qualifying purchases in 3 months, not sent this period | `apps/backend/src/mail/templates/dream-domain-awaits.tsx` |

## Eligibility Criteria (Details)

**Cart Domains Popular**

- `users.subscribe_to_emails = true`
- Privy email present (non-empty)
- At least one cart item older than 1 day
- No `email_campaign_sends` for same `periodStart` with `SENT` or `PENDING`

**Dream Domain Awaits**

- `users.subscribe_to_emails = true`
- Privy email present (non-empty)
- No cart items
- No orders in last 3 months with status `SUCCEEDED` or `PARTIALLY_COMPLETED`
- No `email_campaign_sends` for same `periodStart` with `SENT` or `PENDING`

## Temporal Schedules

| Schedule ID | File | Cron (UTC) |
| --- | --- | --- |
| `cart-domains-popular-schedule` | `apps/backend/src/temporal/schedules/cart-domains-popular.ts` | `0 16 * * 1` |
| `dream-domain-awaits-schedule` | `apps/backend/src/temporal/schedules/dream-domain-awaits.ts` | `0 16 1 * *` |

## Adding a New Campaign

1. Update `apps/backend/src/services/email-campaigns/constants.ts` with keys, schedule IDs, cadence.
2. Add eligibility query to `apps/backend/src/services/email-campaigns/eligibility.ts` with `periodStart` and `userIdFilter`.
3. Add variants in `apps/backend/src/mail/campaigns/<campaign>-variants.ts` and export `*_VARIANT_COUNT`.
4. Add template component in `apps/backend/src/mail/template-components/<campaign>.tsx` and wrapper in `apps/backend/src/mail/templates/<campaign>.tsx`.
5. Add `get<Campaign>EligibleUserIds` and `send<Campaign>Email` in `apps/backend/src/temporal/activities/default/email-campaigns.activities.ts` using `ensureCampaignSendRecord`.
6. Add workflow in `apps/backend/src/temporal/workflows/<campaign>.workflow.ts` using the correct period helper.
7. Add schedule in `apps/backend/src/temporal/schedules/<campaign>.ts` and register it in `apps/backend/src/temporal/schedules/index.ts`.
8. Wire admin API in `apps/backend/src/trpc/routers/admin/emailCampaignsRouter.ts` and UI in `apps/frontend/src/components/admin/email-campaigns.tsx`.
9. Preview with `bun run dev:email` from `apps/backend` and validate via `/admin/email-campaigns`.

## Operational Notes

- `periodStart` is UTC and is the de-duplication boundary.
- Variant rotation is stored in `email_campaign_sends.metadata.variantIndex`.
- Manual sends use `userIdFilter` and `periodStartOverride`.
