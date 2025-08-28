import { getDomainLevels } from '../../get-domain-levels';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { DomainDurationConstraints } from './types';
import { db } from '@namefi-astra/db';

export async function getDomainDurationConstraints(
  domainName: NamefiNormalizedDomain,
): Promise<DomainDurationConstraints> {
  const { levels, parentDomain } = getDomainLevels(domainName);

  if (levels.length === 2) {
    switch (parentDomain) {
      case 'co':
      case 'com.co':
      case 'net.co':
      case 'nom.co':
        return { minYears: 1, maxYears: 5 };
      case 'be':
        return { minYears: 1, maxYears: 1 };
      case 'de':
        return { minYears: 1, maxYears: 2 };
      case 'at':
      case 'co.at':
      case 'or.at':
        return { minYears: 1, maxYears: 1 };
      case 'lt':
        return { minYears: 1, maxYears: 1 };
      case 'nl':
        return { minYears: 1, maxYears: 1 };
      case 'cx':
        return { minYears: 1, maxYears: 5 };
      case 'ai':
        return { minYears: 2, maxYears: 10 };
      case 'lv':
      case 'com.lv':
      case 'org.lv':
      case 'net.lv':
      case 'asn.lv':
      case 'conf.lv':
        return { minYears: 1, maxYears: 1 };
      case 'dk':
        return { minYears: 1, maxYears: 3 };
      case 'it':
        return { minYears: 1, maxYears: 1 };
      case 'co.za': // TODO: check if this is correct
        return { minYears: 1, maxYears: 1 };
      case 'ch':
      case 'li':
        return { minYears: 1, maxYears: 1 };
    }

    return { minYears: 1, maxYears: 10 };
  }
  if (levels.length === 3) {
    if (!parentDomain) {
      throw new Error(
        `Domain ${domainName} is not a valid powered by namefi 3P domain`,
      );
    }
    const record = await db.query.poweredbyNamefiDomainsTable.findFirst({
      where: (table, { eq }) =>
        eq(table.normalizedDomainName, parentDomain as NamefiNormalizedDomain),
    });
    if (!record || record.enabled === false) {
      throw new Error(
        `Domain ${domainName} is not a valid powered by namefi 3P domain`,
      );
    }
    const { durationConstraints } = record;
    return {
      minYears: durationConstraints.minDurationInYears,
      maxYears: durationConstraints.maxDurationInYears,
    } satisfies DomainDurationConstraints;
  }

  throw new Error(`Domain ${domainName} is not a valid domain`);
}
