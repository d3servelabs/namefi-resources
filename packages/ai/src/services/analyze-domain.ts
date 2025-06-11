import { z } from 'zod';
import { MODEL_CONFIGS } from '../lib/config/models';
import {
  createAnalysisModel,
  performStructuredAnalysis,
} from '../lib/utils/analysis';
import {
  domainAnalysisUserPrompt,
  domainMarketingSystemPrompt,
} from '../prompts/domain-marketing';

// Schema for domain research
const researchSchema = z.object({
  potentialUses: z
    .array(z.string())
    .describe('List of potential business uses for this domain'),
  targetAudience: z
    .string()
    .describe(
      'Primary target audience of domain buyers (investors, startups, enterprises)',
    ),
  valueProposition: z
    .string()
    .describe('Main value proposition for purchasing this domain'),
  investmentHighlights: z
    .array(z.string())
    .describe('Key investment benefits and ROI potential'),
  marketingConcept: z
    .object({
      style: z
        .string()
        .describe(
          "Visual style (e.g., 'Luxury Investment', 'Tech Innovation', 'Corporate Asset', 'Startup Opportunity', 'Digital Real Estate')",
        ),
      buyerAppeal: z
        .string()
        .describe('What type of buyer this concept targets'),
      concept: z
        .string()
        .describe('Marketing concept emphasizing the domain is for sale'),
      prompt: z
        .string()
        .describe(
          'Detailed image generation prompt for creating domain sale marketing image',
        ),
    })
    .describe('Single marketing image concept to sell this domain'),
});

export type DomainResearch = z.infer<typeof researchSchema>;

export function analyzeDomain(
  domain: string,
  description: string | undefined,
  searchResults: string,
): Promise<DomainResearch> {
  const chatModel = createAnalysisModel(MODEL_CONFIGS.DOMAIN_ANALYSIS);

  const userPrompt = domainAnalysisUserPrompt({
    domain,
    description,
    searchResults,
  });

  return performStructuredAnalysis(
    chatModel,
    researchSchema,
    'domain_research',
    domainMarketingSystemPrompt,
    userPrompt,
  );
}
