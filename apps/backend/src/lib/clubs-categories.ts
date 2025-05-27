import { domainTagsTable, namefiNftTable } from '@namefi-astra/db';
import { db } from '@namefi-astra/db';
import { getTags } from '@namefi/cat';
import { eq, isNull } from 'drizzle-orm';
import { pluck } from 'ramda';

/**
 * Check domains with no categories
 */
export const checkDomainsWithNoCategories = async () => {
  const domains = await db
    .select({
      normalizedDomainName: namefiNftTable.normalizedDomainName,
    })
    .from(namefiNftTable)
    .leftJoin(
      domainTagsTable,
      eq(
        namefiNftTable.normalizedDomainName,
        domainTagsTable.normalizedDomainName,
      ),
    )
    .where(isNull(domainTagsTable.tag));
  return pluck('normalizedDomainName', domains);
};

/**
 * Add categories to domains with no categories
 */
export const addCategoriesToDomainsWithNoCategories = async () => {
  const domains = await checkDomainsWithNoCategories();
  const newValues = domains.flatMap((domain) => {
    const tags = getTags(domain);

    return tags.map((tag) => ({
      normalizedDomainName: domain,
      tag: tag.id,
    }));
  });
  if (newValues.length > 0) {
    await db.insert(domainTagsTable).values(newValues);
  }
};
