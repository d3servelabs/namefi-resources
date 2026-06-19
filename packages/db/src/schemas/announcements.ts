import type { AnnouncementCondition } from '@namefi-astra/common/announcements-condition';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { randomUuid, timestamps } from './common';

export const namefiAnnouncementsSchema = pgSchema('namefi_announcements');

/**
 * @deprecated Superseded by the `backgroundColor` / `textColor` overrides.
 * Kept only so the column can stay in place (avoids a destructive migration);
 * new rows fall back to its default and nothing reads it.
 */
export const announcementVariantEnum = namefiAnnouncementsSchema.enum(
  'announcement_variant',
  ['info', 'warning', 'success', 'danger'],
);

/**
 * Site-wide announcements surfaced in the top banner strip.
 *
 * The public `announcements.getActive` query returns only rows that are
 * `isActive`, fall within their optional [startsAt, endsAt] scheduling window,
 * and whose optional `condition` currently holds (conditions are evaluated
 * server-side; see `apps/backend/src/lib/announcements/evaluate-condition.ts`).
 * The frontend banner is a dumb renderer of whatever is returned.
 */
export const announcementsTable = namefiAnnouncementsSchema.table(
  'announcements',
  {
    ...randomUuid,
    // Optional headline; many strip announcements are body-only.
    title: text('title'),
    // Banner copy; rendered with lightweight inline markdown.
    body: text('body').notNull(),
    /** @deprecated unused — see backgroundColor/textColor. Kept for the column. */
    variant: announcementVariantEnum('variant').notNull().default('info'),
    // Optional color overrides (CSS color, e.g. "#6d28d9"). When null, the
    // strip falls back to the brand-primary background / its foreground.
    backgroundColor: text('background_color'),
    textColor: text('text_color'),
    // Optional background opacity as a percent (0–100). Null means fully
    // opaque. Applied to the background only (the brand color or the override).
    backgroundOpacity: integer('background_opacity'),
    // Optional call-to-action link rendered in the banner.
    linkUrl: text('link_url'),
    linkLabel: text('link_label'),
    // How the CTA link opens. Null = auto (external opens a new tab, internal
    // opens in the same tab via Next.js client navigation).
    linkTarget: text('link_target').$type<'_self' | '_blank'>(),
    dismissible: boolean('dismissible').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    // Optional scheduling window; null endpoints mean "open-ended" on that side.
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    // Carousel ordering: higher priority shows first.
    priority: integer('priority').notNull().default(0),
    /**
     * @deprecated Superseded by `targetSites` (multi-site targeting). Kept so
     * the column can stay in place; `targetSites` is the source of truth.
     */
    targetPbnDomain: text('target_pbn_domain'),
    // Sites that show this announcement. Each entry is either the sentinel
    // `'namefi'` (main site) or a powered-by-namefi `normalizedDomainName`.
    // The request's resolved site key is matched against this set.
    targetSites: text('target_sites').array(),
    // Optional conditional-display rule. Null means "always applies".
    condition: jsonb('condition').$type<AnnouncementCondition | null>(),
    ...timestamps,
  },
  (table) => [
    index('announcements_active_priority_idx').on(
      table.isActive,
      table.priority.desc(),
      table.createdAt.desc(),
    ),
    // Guard the scheduling window only when both endpoints are present.
    check(
      'announcements_dates_valid',
      sql`(${table.startsAt} IS NULL OR ${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt})`,
    ),
  ],
);
