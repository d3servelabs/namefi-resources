import { TavilySearch } from '@langchain/tavily';
import { secrets } from '../lib/env';

// TODO: (sid) fix this type mismatch after fixing zod issue
const tavilyTool: any = new TavilySearch({
  maxResults: 3,
  tavilyApiKey: secrets.TAVILY_API_KEY,
});

export async function researchDomain(
  domain: string,
  description?: string,
): Promise<string> {
  console.log(`Researching domain: ${domain}`);

  const queries = [
    `${domain} domain value investment potential business uses`,
    `buy domain name ${domain} worth price market value`,
    description
      ? `${description} ${domain} domain sale`
      : `${domain} domain name industry trends investment`,
  ];

  let results = '';

  for (const query of queries) {
    try {
      const searchResults = await tavilyTool.invoke({
        query,
      });
      results += `\n--- Search: ${query} ---\n${searchResults}\n`;
    } catch (error) {
      console.error(`Search error for query "${query}":`, error);
    }
  }

  return results || 'No search results available';
}
