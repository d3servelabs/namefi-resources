import { getKeyv } from './keyv';
import { logger } from './logger';
import type {
  KnownIssueExplanation,
  NftIssueCategory,
} from '../mail/templates/nft-management-report.types';

/**
 * Persistent store for "known issue" explanations attached to specific
 * domains in the NFT management report. Entries are keyed by normalized
 * domain name and persist indefinitely (no TTL).
 *
 * To list all known issues we maintain a separate `__index` key holding
 * the array of all domain names that currently have an explanation.
 * This avoids depending on `@keyv/postgres` iterator behavior across
 * versions.
 */
const getNftKnownIssuesKeyv = () =>
  getKeyv('nft-known-issues', {
    onError: (error) => logger.warn({ error }, 'nftKnownIssuesKeyv error'),
  });

const INDEX_KEY = '__index';

async function loadIndex(): Promise<string[]> {
  const index = await getNftKnownIssuesKeyv().get<string[]>(INDEX_KEY);
  return Array.isArray(index) ? index : [];
}

async function saveIndex(index: string[]): Promise<void> {
  await getNftKnownIssuesKeyv().set(INDEX_KEY, index);
}

export async function getKnownIssue(
  normalizedDomainName: string,
): Promise<KnownIssueExplanation | undefined> {
  return getNftKnownIssuesKeyv().get<KnownIssueExplanation>(
    normalizedDomainName,
  );
}

export async function listKnownIssues(): Promise<KnownIssueExplanation[]> {
  const index = await loadIndex();
  if (index.length === 0) return [];

  const results = await Promise.all(
    index.map(async (domain) => {
      const entry =
        await getNftKnownIssuesKeyv().get<KnownIssueExplanation>(domain);
      return entry;
    }),
  );

  return results.filter((entry): entry is KnownIssueExplanation =>
    Boolean(entry),
  );
}

/**
 * Loads all known issues into a Map for fast per-domain lookup during
 * report generation. Tolerates store outages by returning an empty Map
 * and logging a warning so the daily workflow can still produce a report.
 */
export async function loadKnownIssuesMap(): Promise<
  Map<string, KnownIssueExplanation>
> {
  try {
    const all = await listKnownIssues();
    return new Map(all.map((entry) => [entry.normalizedDomainName, entry]));
  } catch (error) {
    logger.warn(
      { error },
      'Failed to load NFT known-issue explanations; report will render without acknowledgements',
    );
    return new Map();
  }
}

export interface UpsertKnownIssueInput {
  normalizedDomainName: string;
  explanation: string;
  /**
   * `undefined` (field omitted) → keep the existing category on edit.
   * `null` → explicitly clear the category.
   * A category string → set the category to that value.
   */
  category?: NftIssueCategory | null;
  actingUserId: string;
}

export async function upsertKnownIssue(
  input: UpsertKnownIssueInput,
): Promise<KnownIssueExplanation> {
  const nowIso = new Date().toISOString();
  const existing = await getKnownIssue(input.normalizedDomainName);

  const resolvedCategory: NftIssueCategory | undefined =
    input.category === undefined
      ? existing?.category
      : input.category === null
        ? undefined
        : input.category;

  const next: KnownIssueExplanation = {
    normalizedDomainName: input.normalizedDomainName,
    explanation: input.explanation,
    category: resolvedCategory,
    acknowledgedBy: existing?.acknowledgedBy ?? input.actingUserId,
    acknowledgedAt: existing?.acknowledgedAt ?? nowIso,
    updatedAt: nowIso,
  };

  await getNftKnownIssuesKeyv().set(input.normalizedDomainName, next);

  if (!existing) {
    const index = await loadIndex();
    if (!index.includes(input.normalizedDomainName)) {
      index.push(input.normalizedDomainName);
      await saveIndex(index);
    }
  }

  return next;
}

export async function deleteKnownIssue(
  normalizedDomainName: string,
): Promise<boolean> {
  const deleted = await getNftKnownIssuesKeyv().delete(normalizedDomainName);
  const index = await loadIndex();
  const filtered = index.filter((name) => name !== normalizedDomainName);
  if (filtered.length !== index.length) {
    await saveIndex(filtered);
  }
  return deleted;
}
