import { z } from 'zod';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

/* ------------------------------- Zod schemas ------------------------------ */
const baseSchema = z.object({
  id: z.string(),
  ts: z.number().int().nonnegative(),
  ttlMs: z.number().int().positive().optional(),
});

const voteAttemptDataSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  campaignKey: z.string().optional(),
});

export type VoteAttemptData = z.infer<typeof voteAttemptDataSchema>;

const voteAttemptSignalSchema = baseSchema.extend({
  type: z.literal('unauthenticated_vote_attempt'),
  data: voteAttemptDataSchema,
});

export const PreAuthSignalSchema = z.discriminatedUnion('type', [
  voteAttemptSignalSchema,
]);

export type PreAuthSignal = z.infer<typeof PreAuthSignalSchema>;

export const MAX_ITEMS = 100;

export function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback
  return `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
