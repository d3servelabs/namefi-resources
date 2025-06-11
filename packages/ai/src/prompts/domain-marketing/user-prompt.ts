export interface DomainAnalysisParams {
  domain: string;
  description?: string;
  searchResults: string;
}

export const domainAnalysisUserPrompt = ({
  domain,
  description,
  searchResults,
}: DomainAnalysisParams) => `Domain FOR SALE: ${domain}
${description ? `Seller's Description: ${description}` : ''}

Search Results:
${searchResults || 'No search results available'}

This domain is currently available for purchase. Analyze it as a domain broker would and create:
1. List of potential business uses that would justify purchasing this domain
2. Target audience of potential domain buyers (investors, companies, entrepreneurs)
3. Clear value proposition for why someone should buy this domain now
4. Investment highlights showing ROI potential and domain value
5. Generate ONE unique marketing image concept based on:
   - The domain name itself (its sound, meaning, associations)
   - Industry/market opportunities discovered in the research
   - Specific buyer personas that would be interested in THIS domain
   - Unique selling points of this particular domain
   - Any context from the seller's description

Remember: This is a marketing image to SELL this specific domain based on its unique characteristics. Generate only one concept per request.`;
