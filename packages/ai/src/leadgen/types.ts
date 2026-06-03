import { z } from 'zod';

export const leadgenReasoningEffortSchema = z.enum(['low', 'medium', 'high']);

export type LeadgenReasoningEffort = z.infer<
  typeof leadgenReasoningEffortSchema
>;

export const leadgenDiscoveryRecipeValues = [
  'exact_near_name_search',
  'category_operator_search',
  'local_business_search',
  'paid_demand_check',
  'growth_trigger_search',
  'domain_weakness_check',
  'broad_sanity_search',
] as const;

export const leadgenDiscoveryRecipeSchema = z.enum(
  leadgenDiscoveryRecipeValues,
);

export type LeadgenDiscoveryRecipe = z.infer<
  typeof leadgenDiscoveryRecipeSchema
>;

export const leadgenOpportunityStatusSchema = z.enum([
  'checking',
  'contact_now',
  'low_priority',
  'suppressed',
]);

export type LeadgenOpportunityStatus = z.infer<
  typeof leadgenOpportunityStatusSchema
>;

export const leadgenContactReadinessSchema = z.enum([
  'not_searched',
  'contact_found',
  'generic_fallback',
  'not_found',
]);

export type LeadgenContactReadiness = z.infer<
  typeof leadgenContactReadinessSchema
>;

export const leadgenRecommendedActionSchema = z.enum([
  'ready_to_contact',
  'finding_contact',
  'defer_contact',
  'filtered',
]);

export type LeadgenRecommendedAction = z.infer<
  typeof leadgenRecommendedActionSchema
>;

export const leadgenDomainTraitSchema = z
  .object({
    key: z.string().trim().min(1).max(80),
    confidence: z.number().min(0).max(1),
    evidence: z.string().trim().min(1).max(220),
  })
  .strict();

export const leadgenDomainThesisSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    confidence: z.number().min(0).max(1),
    discoveryRecipes: z.array(leadgenDiscoveryRecipeSchema).min(1).max(5),
    requiredEvidence: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
    seedQueries: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  })
  .strict();

export const leadgenSearchDirectionSchema = z
  .object({
    recipe: leadgenDiscoveryRecipeSchema,
    intent: z.string().trim().min(1).max(140),
  })
  .strict();

export const leadgenDomainProfileSchema = z
  .object({
    evidenceStandards: z.array(z.string().trim().min(1).max(140)).min(1).max(6),
    searchDirections: z.array(leadgenSearchDirectionSchema).min(1).max(6),
    traits: z.array(leadgenDomainTraitSchema).max(8),
    theses: z.array(leadgenDomainThesisSchema).min(1).max(5),
    cautions: z.array(z.string().trim().min(1).max(220)).max(5),
    seedQueries: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  })
  .strict();

export type LeadgenDomainProfile = z.infer<typeof leadgenDomainProfileSchema>;

export const leadgenCandidateSignalSchema = z
  .object({
    domain: z
      .string()
      .min(1)
      .describe('Bare registrable business domain, without protocol or path.'),
    companyName: z.string().trim().min(1).max(200).nullable(),
    signalType: z.string().trim().min(1).max(80),
    query: z.string().trim().min(1).max(400),
    evidenceUrl: z.string().trim().min(1).max(700).nullable(),
    evidenceSnippet: z.string().trim().min(1).max(700),
    candidateReason: z.string().trim().min(1).max(500),
  })
  .strict();

export type LeadgenCandidateSignalInput = z.infer<
  typeof leadgenCandidateSignalSchema
>;

export type LeadgenCandidateSignal = LeadgenCandidateSignalInput & {
  recipe: LeadgenDiscoveryRecipe;
};

export const leadgenOpportunityTriageModelSchema = z
  .object({
    domain: z.string().trim().min(1).max(255),
    score: z.number().int().min(0).max(100),
    recommendedAction: leadgenRecommendedActionSchema,
  })
  .strict();

export const leadgenOpportunityTriageSchema =
  leadgenOpportunityTriageModelSchema.extend({
    status: leadgenOpportunityStatusSchema,
  });

export type LeadgenOpportunityTriageModel = z.infer<
  typeof leadgenOpportunityTriageModelSchema
>;

export type LeadgenOpportunityTriage = z.infer<
  typeof leadgenOpportunityTriageSchema
>;

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
  sender?: {
    signature: string | null;
  };
  prospect: {
    domain: string;
    content: string;
    rationale: string;
    signals?: Array<{
      signalType: string;
      evidenceSnippet: string;
      evidenceUrl?: string | null;
    }>;
  };
  contact: LeadgenContact;
}
