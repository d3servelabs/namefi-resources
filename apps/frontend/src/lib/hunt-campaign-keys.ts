/**
 * Campaign keys for different hunt campaigns
 * These are used to track and filter domains by campaign
 */

export const HUNT_CAMPAIGN_KEYS = {
  /** Campaign key for .cv domains */
  CV: 'cv-2025-07-16',

  /** Campaign key for CTA/Bespoke domains (.today, .now, etc.) */
  CTA: 'cta-2025-07-16',
} as const;

export type HuntCampaignKey =
  (typeof HUNT_CAMPAIGN_KEYS)[keyof typeof HUNT_CAMPAIGN_KEYS];
