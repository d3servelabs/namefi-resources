import { z } from 'zod';

export const leadgenReasoningEffortSchema = z.enum(['low', 'medium', 'high']);

export type LeadgenReasoningEffort = z.infer<
  typeof leadgenReasoningEffortSchema
>;

export const leadgenBusinessResultSchema = z.object({
  domain: z
    .string()
    .min(1)
    .describe('Bare registrable business domain, without protocol or path.'),
  justification: z
    .string()
    .min(1)
    .describe('Why this company is a credible buyer for the source domain.'),
  content: z
    .string()
    .min(1)
    .describe(
      'A concise evidence snippet from the company website/search hit.',
    ),
});

export type LeadgenBusinessResult = z.infer<typeof leadgenBusinessResultSchema>;

export const leadgenContactSchema = z.object({
  email: z.string().trim().min(5).max(320),
  name: z.string().trim().max(200).nullable(),
  title: z.string().trim().max(200).nullable(),
  sourceUrl: z.string().trim().max(500).nullable(),
  context: z.string().trim().max(600).nullable(),
});

export type LeadgenContact = z.infer<typeof leadgenContactSchema>;

export const leadgenContactResultSchema = z.object({
  domain: z.string().min(1),
  contacts: z.array(leadgenContactSchema),
  notes: z.string().trim().max(400).nullable(),
});

export type LeadgenContactResult = z.infer<typeof leadgenContactResultSchema>;

export const leadgenEmailDraftSchema = z
  .object({
    subject: z.string().min(5).max(90),
    fullEmail: z.string().min(80),
  })
  .strict();

export type LeadgenEmailDraft = z.infer<typeof leadgenEmailDraftSchema>;

export interface LeadgenEmailBrief {
  sourceDomain: string;
  prospect: {
    domain: string;
    content: string;
    rationale: string;
  };
  contact: LeadgenContact;
}
