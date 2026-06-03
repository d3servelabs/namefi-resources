import { z } from 'zod';
import { createContract } from './create-contract';

/**
 * Sentinel `targetSites` entry for the main Namefi site (a request with no
 * resolved powered-by-namefi origin). PBN sites use their `normalizedDomainName`.
 */
export const MAIN_SITE_TARGET = 'namefi';

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
  // CTA link. Validated to a safe scheme (http(s)/mailto) at the admin write
  // boundary; the renderer re-checks via `isSafeHref` before using it as href.
  linkUrl: z.string().nullable(),
  linkLabel: z.string().nullable(),
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
