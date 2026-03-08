import { z } from 'zod';

import { config } from './env';

const domainAppraisalSchema = z
  .object({
    value_upper_range: z.string().optional(),
    value_lower_range: z.string().optional(),
    report: z.string().optional(),
  })
  .passthrough();

const domainDocumentSchema = z
  .object({
    _id: z.string().optional(),
    ldh: z.string().optional(),
    chainName: z
      .enum([
        'base',
        'ethereum',
        'sepolia',
        'goerli',
        'robinhood-testnet',
        'chain-46630',
      ])
      .optional()
      .nullable(),
    namefi_gpt_version: z.string().optional().nullable(),
    tokenId: z.string().optional().nullable(),
    unicode: z.string().optional().nullable(),
    explain: z.string().optional().nullable(),
    currentOwner: z.string().optional().nullable(),
    expiration: z.string().optional().nullable(),
    appraisal: z
      .object({
        ldh: z.string().optional().nullable(),
        unicode: z.string().optional().nullable(),
        appraisal: domainAppraisalSchema.optional().nullable(),
      })
      .optional()
      .nullable(),
    likes: z.number().optional().nullable(),
    collectors: z.number().optional().nullable(),
    highlights: z.array(z.string()).optional().nullable(),
    locked: z.boolean().optional().nullable(),
  })
  .passthrough();

const domainsResponseSchema = z
  .object({
    domains: z.array(domainDocumentSchema).optional(),
  })
  .passthrough();

const domainAttributeSchema = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const domainProfileSchema = z
  .object({
    is_normalized: z.boolean().optional().nullable(),
    name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    attributes: z.array(domainAttributeSchema).default([]),
    url: z.string().optional().nullable(),
    version: z.number().optional().nullable(),
    background_image: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    external_url: z.string().optional().nullable(),
  })
  .passthrough();

export type DomainDocument = z.infer<typeof domainDocumentSchema>;

export type DomainProfile = z.infer<typeof domainProfileSchema>;

async function fetchFromNamefimd<T>(
  path: string,
  parser: z.ZodSchema<T>,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path, config.NAMEFI_MD_API_ENDPOINT);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Namefimd request failed (${response.status}): ${await response.text()}`,
    );
  }

  const json = await response.json();
  const parsed = parser.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Failed to parse Namefimd response for "${path}": ${parsed.error}`,
    );
  }

  return parsed.data;
}

export async function getDomainDocument(
  ldh: string,
): Promise<DomainDocument | null> {
  const result = await fetchFromNamefimd(
    `/ldh/${encodeURIComponent(ldh)}`,
    domainsResponseSchema,
  );
  const [domain] = result.domains ?? [];
  return domain ?? null;
}

export async function countDomainsByOwner(owner: string): Promise<number> {
  const result = await fetchFromNamefimd(
    `/owner/${encodeURIComponent(owner)}`,
    domainsResponseSchema,
  );
  return result.domains?.length ?? 0;
}

export async function getTagsByDomain(ldh: string): Promise<string[]> {
  const profile = await fetchFromNamefimd(
    `/${encodeURIComponent(ldh)}`,
    domainProfileSchema,
  );

  const tags = new Set<string>();
  for (const attribute of profile.attributes ?? []) {
    switch (attribute.trait_type) {
      case 'TLD Length': {
        tags.add(`${attribute.value} letters`);
        break;
      }
      case 'Top Level Domain (TLD)': {
        tags.add(`${attribute.value} TLD`);
        break;
      }
      case 'Is Pure Number': {
        if (attribute.value === true) tags.add('Pure Number');
        break;
      }
      case 'Number Club': {
        tags.add(String(attribute.value));
        break;
      }
      case 'is IDN': {
        if (attribute.value === true) tags.add('Internationalized domain name');
        break;
      }
      case 'SLD Length': {
        tags.add(`${attribute.value} SLD`);
        break;
      }
      default:
        break;
    }
  }

  return Array.from(tags);
}
