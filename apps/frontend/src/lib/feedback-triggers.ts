import { z } from 'zod';

export const feedbackTriggers = [
  'USAGE_TIME',
  'CHECKOUT_SUCCESS',
  'MILESTONE_DOMAIN_ACQUIRED',
  'MILESTONE_LOGO_GENERATED',
  'MILESTONE_DNS_UPDATED',
] as const;
export const feedbackTriggerSchema = z.enum(feedbackTriggers);
export type FeedbackTrigger = z.infer<typeof feedbackTriggerSchema>;

/**
 * Milestone triggers that show the "Enjoying Namefi?" prompt.
 * These are triggered when users complete important actions:
 * - MILESTONE_DOMAIN_ACQUIRED: User completes purchasing or importing a domain
 * - MILESTONE_LOGO_GENERATED: User generates a logo
 * - MILESTONE_DNS_UPDATED: User updates DNS records
 *
 * All milestone triggers share a monthly cooldown (30 days between any milestone trigger).
 */
export const milestoneTriggers = [
  'MILESTONE_DOMAIN_ACQUIRED',
  'MILESTONE_LOGO_GENERATED',
  'MILESTONE_DNS_UPDATED',
] as const;
export const milestoneTriggerSchema = z.enum(milestoneTriggers);
export type MilestoneTrigger = z.infer<typeof milestoneTriggerSchema>;

export function isMilestoneTrigger(
  trigger: FeedbackTrigger,
): trigger is MilestoneTrigger {
  return (milestoneTriggers as readonly string[]).includes(trigger);
}
