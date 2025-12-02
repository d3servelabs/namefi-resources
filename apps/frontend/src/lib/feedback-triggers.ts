import { z } from 'zod';

export const feedbackTriggers = ['USAGE_TIME', 'CHECKOUT_SUCCESS'] as const;
export const feedbackTriggerSchema = z.enum(feedbackTriggers);
export type FeedbackTrigger = z.infer<typeof feedbackTriggerSchema>;
