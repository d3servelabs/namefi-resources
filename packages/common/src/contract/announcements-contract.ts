import { z } from 'zod';
import { createContract } from './create-contract';

/**
 * Sentinel `targetSites` entry for the main Namefi site (a request with no
 * resolved powered-by-namefi origin). PBN sites use their `normalizedDomainName`.
 */
export const MAIN_SITE_TARGET = 'namefi';

/** How the CTA link opens. Null = auto (external → new tab, internal → same tab). */
export const linkTargetSchema = z.enum(['_self', '_blank']);
export type AnnouncementLinkTarget = z.infer<typeof linkTargetSchema>;

/**
 * Accepts a same-origin path (`/foo`), an absolute http(s) URL, or a `mailto:`
 * link — and rejects everything else (e.g. `javascript:`, or protocol-relative
 * `//host` which is really external). Shared by the admin contract and form so
 * validation matches the renderer's allowlist.
 */
export function isAllowedLinkUrl(value: string): boolean {
  // Single leading slash only — `//host` is protocol-relative (external).
  if (value.startsWith('/')) return !value.startsWith('//');
  if (/^mailto:/i.test(value)) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Public contract for the announcements banner.
 *
 * `getActive` is consumed by the top banner (`AnnouncementsBanner`). It is an
 * unauthenticated read (anonymous visitors see announcements too). The backend
 * resolves which announcements currently apply — active flag, scheduling
 * window, and conditional rules are all evaluated server-side — so the DTO
 * deliberately omits `condition`, `isActive`, `startsAt`, and `endsAt`.
 */

/** Render-only fields exposed to the client. */
export const announcementDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  // Banner copy; the client renders it with lightweight inline markdown.
  body: z.string(),
  // Optional color overrides; null means fall back to the brand-primary strip.
  backgroundColor: z.string().nullable(),
  textColor: z.string().nullable(),
  // Background opacity as a percent (0–100); null means fully opaque.
  backgroundOpacity: z.number().nullable(),
  // CTA link: an http(s) URL, mailto:, or a same-origin /path. Validated at
  // the admin write boundary; the renderer re-checks via `isSafeHref`.
  linkUrl: z.string().nullable(),
  linkLabel: z.string().nullable(),
  // How the link opens; null = auto (external → new tab, internal → same tab).
  linkTarget: linkTargetSchema.nullable(),
  dismissible: z.boolean(),
  priority: z.number().int(),
  // Used by the client to key dismissals — editing bumps this so a dismissed
  // announcement re-shows. superjson handles Date over the wire.
  updatedAt: z.date(),
});

export type AnnouncementDto = z.infer<typeof announcementDtoSchema>;

export const announcementsContract = createContract(
  { softOutput: true },
  {
    getActive: {
      type: 'query',
      input: z.void(),
      output: z.object({
        items: z.array(announcementDtoSchema),
      }),
    },
  },
);

export type AnnouncementsContract = typeof announcementsContract;
