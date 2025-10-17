import { z } from 'zod';

import { config } from './env';
import { secrets } from './env/secrets';

const aiGenerationSchema = z
  .object({
    id: z.string(),
    domain: z.string(),
    type: z.string(),
    createdAt: z.string(),
    url: z.string().url(),
  })
  .passthrough();

const aiGenerationsSchema = z.array(aiGenerationSchema);

const aiEnvelopeSchema = z
  .object({
    result: z
      .object({
        data: z
          .object({
            json: aiGenerationsSchema.optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type AiGeneration = z.infer<typeof aiGenerationSchema>;

export async function getInternalGenerationsByDomain(
  domain: string,
): Promise<AiGeneration[]> {
  if (!config.ASTRA_BACKEND_URL) {
    return [];
  }

  try {
    const url = new URL(
      '/trpc/ai.getInternalGenerationsByDomain',
      config.ASTRA_BACKEND_URL,
    );
    url.searchParams.set('input', JSON.stringify({ json: { domain } }));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(secrets.API_AUTH_KEY ? { 'x-api-key': secrets.API_AUTH_KEY } : {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.text();
      } catch {
        body = '<unreadable>';
      }
      console.error(
        `[park] AI generations request returned ${response.status} ${response.statusText} for "${domain}". Body: ${body}`,
      );
      return [];
    }

    const payload = await response.json();

    const direct = aiGenerationsSchema.safeParse(payload);
    if (direct.success) {
      return direct.data;
    }

    const envelope = aiEnvelopeSchema.safeParse(payload);
    if (envelope.success) {
      const nested = aiGenerationsSchema.safeParse(
        envelope.data.result?.data?.json ?? [],
      );
      if (nested.success) {
        return nested.data;
      }
    }
  } catch (error) {
    console.error(
      `[park] Failed to load AI generations for "${domain}":`,
      error instanceof Error ? error : error,
      error instanceof Error && 'cause' in error ? error.cause : undefined,
    );
  }

  return [];
}
