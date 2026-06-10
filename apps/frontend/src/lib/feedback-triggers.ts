import { z } from 'zod';

/**
 * Product milestones that can solicit feedback.
 *
 * All triggers share a monthly cooldown so users are not prompted repeatedly
 * after completing several meaningful actions in a short window.
 */
export const feedbackTriggers = [
  'MILESTONE_CHECKOUT_SUCCESS',
  'MILESTONE_LOGO_GENERATED',
  'MILESTONE_DNS_UPDATED',
] as const;
export const feedbackTriggerSchema = z.enum(feedbackTriggers);
export type FeedbackTrigger = z.infer<typeof feedbackTriggerSchema>;
