import { createLogger } from '#lib/logger';
import type OpenAi from 'openai';
import {
  aiAppraisalDataSchema,
  type AiAppraisalData,
} from '@namefi-astra/db/schema';

// Lazy load OpenAI to avoid import issues
let openaiClient: OpenAi | null = null;

async function getOpenAiClient(): Promise<OpenAi> {
  if (!openaiClient) {
    // Dynamic import to avoid issues with OpenAI module
    const { default: OpenAiConstructor } = await import('openai');
    openaiClient = new OpenAiConstructor();
  }
  return openaiClient;
}

const logger = createLogger({ module: 'ai-domain-analysis' });
export const NAMEFI_GPT_VERSION = '3.0.0'; // This is the version of the namefi_gpt from 3.0.0 (when we migrated from mongo) and above. !change this when modifying the model.
export const GPT_MODEL = 'gpt-4-turbo';

export async function getImageGenerationPrompt(
  unicodeDomainName: string,
): Promise<string> {
  const openai = await getOpenAiClient();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
      You are the best prompt engineer for stable diffusion of FLUX, and you will be given a single domain name. You will help draft a prompt to be used to generate an advertising image for that domain. The images will feature the domain name, decorated not as simple text, but as part of a piece of art, a product, or styled in such a way that the text is created by small items relevant to that image. You will begin by generating 5 candidate prompts that match the requirements above. Each prompt will include a brief interpretation of the possible meaning of the input domain name and will direct the image generator to display the exact spelling of the domain name and in prominent location and size, integrated with other elements in the image. You will rate each of the prompt candidates from 0-10 based on their attractiveness and how likely they are to make the audience want to buy the domain. Finally, you will select and state the best prompt candidate. Input: ${unicodeDomainName}`,
      },
    ],
    model: GPT_MODEL,
  });

  return completion?.choices[0]?.message?.content || '';
}

export async function fetchExplanation(
  unicodeDomainName: string,
): Promise<string> {
  const segments = unicodeDomainName.split('.');
  const childDomain = segments[0];
  const parentDomains = segments.slice(1).join('.');

  const openai = await getOpenAiClient();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
Let's think step by step:

Input: You are receiving a domain name: ${unicodeDomainName}

Now think in steps below
- Please think about what could this ${childDomain} possibly mean across different cultures and industries that makes it a valuable domain? 
- Please think about the TLD or parent domain aren't the .com, .org, .net, .xyz, .io, .uk, .de, .tk, .ru, .cn, .co, please also mention if '${childDomain}' and ${parentDomains} together makes an interesting meaning and make it a valuable domain. 
- Please think about potential use case of this domain. 

Now prepare the output as followed format:
- Output in plain text without any format and style.
- Start with "${unicodeDomainName} is valuable because"
- Please limit output to 75 words.
- Output in markdown text format.

Now output only the answer about why this domain is worth buying, don't show intermediate steps at all, please.`,
      },
    ],
    model: GPT_MODEL,
  });

  return completion?.choices[0]?.message?.content || '';
}

export async function fetchAppraisalReport(
  unicodeDomainName: string,
): Promise<AiAppraisalData | null> {
  const openai = await getOpenAiClient();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
Let's think step by step:

Input: You are receiving a domain name: ${unicodeDomainName}

Please consider the following sections in your appraisal report:

------
## Table of Contents

1. Key Factors Considered
   - Domain Length
   - Keyword Relevance
   - TLD (Top-Level Domain)
   - Brandability
   - Market Demand
   - SEO Potential

2. Estimated Value

3. Recommendations
   - Market Positioning
   - Potential Buyers
   - Sales Strategy

4. Conclusion
------

Please output an detailed appraisal report in a JSON string, and here are the required fields

{
  "valueUpperRange": "<estimated numeric upper range trade value of the domain in USD>", //FLOAT
  "valueLowerRange": "<estimated numeric lower range trade value of the domain in USD>", //FLOAT
  "report": "<a detailed report about the domain in various aspects and examples, format in markdown>" //STRING
}

please output in json without any format and style.

`,
      },
    ],
    model: GPT_MODEL,
  });

  const rawResponse = completion?.choices[0]?.message?.content;
  if (!rawResponse) {
    logger.error(
      { unicodeDomainName },
      'No response from OpenAI for appraisal request',
    );
    return null;
  }

  try {
    // Parse the JSON response from OpenAI
    const parsedResponse = JSON.parse(rawResponse);

    // Validate using Zod schema
    const validatedResponse = aiAppraisalDataSchema.parse(parsedResponse);

    logger.info(
      { unicodeDomainName },
      'Successfully parsed and validated appraisal response',
    );
    return validatedResponse;
  } catch (error) {
    logger.error(
      {
        unicodeDomainName,
        rawResponse: rawResponse.substring(0, 500),
        error,
      },
      'Failed to parse or validate appraisal response',
    );
    return null;
  }
}
