import { toBytes } from 'viem';
import { keccak256 } from 'viem';
import { db, poweredbyNamefiDomainsTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const reservedCommonPrefixes = [
  'academy',
  'account',
  'admin',
  'affiliate',
  'alpha',
  'analytics',
  'api-docs',
  'api',
  'app',
  'archive',
  'assets',
  'auth',
  'backup',
  'benefits',
  'beta',
  'billing',
  'blog',
  'careers',
  'cd',
  'cdn',
  'chat',
  'ci',
  'cloud',
  'community',
  'connect',
  'dashboard',
  'demo',
  'dev',
  'developer',
  'discover',
  'docker',
  'docs',
  'download',
  'email',
  'engineering',
  'events',
  'explore',
  'forum',
  'git',
  'help',
  'hr',
  'internal',
  'intranet',
  'investor',
  'invoice',
  'jobs',
  'kubernetes',
  'labs',
  'learn',
  'legacy',
  'legal',
  'locations',
  'login',
  'logs',
  'm',
  'mail',
  'maps',
  'marketing',
  'media',
  'metrics',
  'mobile',
  'monitor',
  'myaccount',
  'network',
  'news',
  'partners',
  'payments',
  'payroll',
  'portal',
  'preferences',
  'press',
  'profile',
  'qa',
  'repo',
  'research',
  'reseller',
  'sales',
  'sandbox',
  'search',
  'secure',
  'security',
  'settings',
  'shop',
  'ssl',
  'sso',
  'staging',
  'static',
  'status-page',
  'status',
  'storage',
  'store',
  'subscriptions',
  'support',
  'test',
  'university',
  'upload',
  'uptime',
  'vault',
  'webmail',
  'www',
  'about',
  'about',
  'abuse',
  'account',
  'admin',
  'advertise',
  'affiliate',
  'annualreport',
  'api',
  'apps',
  'ask',
  'atm',
  'banker',
  'bankers',
  'banking',
  'blockchain',
  'blog',
  'blogs',
  'broker',
  'brokers',
  'cannabis',
  'careers',
  'checking',
  'compare',
  'contact',
  'contact',
  'corporate',
  'credit',
  'crypto',
  'customer',
  'cybersecurity',
  'dashboard',
  'dashboard',
  'demo',
  'directory',
  'dns',
  'docs',
  'domain',
  'domains',
  'emergency',
  'eula',
  'events',
  'example',
  'finance',
  'financial',
  'financing',
  'find',
  'fintech',
  'foreign',
  'fraud',
  'ftld',
  'ftp',
  'help',
  'hire',
  'imap',
  'information',
  'international',
  'internet',
  'legal',
  'lend',
  'loan',
  'loans',
  'locate',
  'login',
  'logout',
  'm',
  'mail',
  'manage',
  'mortgage',
  'mx',
  'ns',
  'offer',
  'offers',
  'online',
  'pay',
  'pop',
  'pop3',
  'privacy',
  'privacy',
  'rankings',
  'ratings',
  'registrar',
  'registrars',
  'registries',
  'registry',
  'regulators',
  'retail',
  'savings',
  'search',
  'secure',
  'smtp',
  'status',
  'status',
  'support',
  'support',
  'terms',
  'terms',
  'test',
  'test',
  'test',
  'the',
  'tos',
  'virtual',
  'wallet',
  'webmail',
  'www',
  'canary',
  'staging',
  'release',
  'prod',
  //
];
const reservedForWidelyUsedBrandNames = [
  'google',
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
  'pinterest',
  'reddit',
  'tumblr',
  'wordpress',
  'wix',
  'shopify',
  'ebay',
  'amazon',
  'aliexpress',
  'walmart',
  'target',
  'bestbuy',
  'apple',
  'microsoft',
  'google',
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
];
const reservedSubdomainsForBlockchainProjects = [
  'admin',
  'blog',
  'bridge',
  'changelog',
  'coin',
  'contract',
  'dex',
  'discussions',
  'docs',
  'explorer',
  'faucet',
  'forum',
  'hire',
  'jobs',
  'manage',
  'management',
  'news',
  'releases',
  'staking',
  'support',
  'swap',
  'updates',
  'wallet',
  'yield',
  'legal',
  'tos',

  'law',
  'legal',
  'lawyer',
  'attorney',
  'esq',
  'lawfirm',
  'court',
  'judge',
  'justice',
  'tribunal',
  'notary',
  'barrister',
  'solicitor',
  'advocate',
  'protection',
  'probono',
  'legal-aid',
  'legal-advice',
  'regulation',
  'compliance',
  'trademark',
  'patent',
  'copyright',
  'litigation',
  'arbitration',
  'mediation',
  'case',
  'counsel',
  'jurisdiction',
  'law',
  'legal',
  'esq',
  'abogado',
  'business',
  'corp',
  'corporation',
  'inc',
  'company',
  'ltd',
  'llc',
  'group',
  'firm',
  'finance',
  'financial',
  'bank',
  'credit',
  'investment',
  'insurance',
  'capital',
  'fund',
  'trust',
  'holding',
  'consulting',
  'management',
  'venture',
  'partners',
  'association',
  'cooperative',
  'foundation',
  'enterprise',
  'commerce',
  'trade',
  'industry',
  'finance',
  'money',
  'credit',
  'creditcard',
  'cash',
  'bank',
  'banking',
];

/**
 * Determines if a domain name should be included in a percentage-based rollout.
 *
 * This function uses keccak256 hashing to deterministically decide whether a given
 * domain name should be included in a rollout based on the specified percentage.
 *
 * The normalization process:
 * 1. The domain name is converted to bytes
 * 2. A keccak256 hash is generated
 * 3. The last 4 bytes of the hash are converted to a number
 * 4. If this number is less than (16^4 * percentage/100), the domain is included
 *
 * This ensures that:
 * - The same domain will always get the same result for the same percentage
 * - As the percentage increases, more domains will be included
 * - The distribution of included domains is approximately equal to the percentage
 *
 * @param name - The domain name to check
 * @param percentage - The percentage of domains to include (0-100)
 * @returns boolean - True if the domain should be included in the rollout
 */
export const hashBasedPercentageRollouted = (
  name: string,
  percentage: number,
) => {
  if (percentage === 0) {
    return false;
  }
  const hash = keccak256(toBytes(name));
  const last4Bytes = hash.slice(-4);
  const last4BytesNumber = Number.parseInt(last4Bytes, 16);
  return last4BytesNumber < (16 ** 4 * percentage) / 100;
};

const _systemReservedKeywords = new Set([
  ...reservedCommonPrefixes,
  ...reservedForWidelyUsedBrandNames,
  ...reservedSubdomainsForBlockchainProjects,
]);

export const getSystemReservedKeywords = () => {
  return new Set(_systemReservedKeywords);
};
/**
 * Determines if a domain name is reserved for widely used brand names.
 *
 * This function checks if a given domain name is reserved for widely used brand names.
 * It compares the domain name against a list of reserved brand names and returns true
 * if the domain is found in the list.
 *
 * @param domain - The domain name to check
 * @returns boolean - True if the domain is reserved for widely used brand names
 */
export const isReservedKeyword = (keyword: string) => {
  if (keyword.includes('namefi')) {
    return true;
  }

  return getSystemReservedKeywords().has(keyword);
};

/**
 * Returns the union set of built-in reserved names and additional reserved names
 * configured for a specific parent domain in the poweredby_namefi_domains table.
 */
export const getAdditionalReservedNamesForParentDomain = async (
  parentDomain: string,
) => {
  const record = await db.query.poweredbyNamefiDomainsTable.findFirst({
    where: eq(
      poweredbyNamefiDomainsTable.normalizedDomainName,
      parentDomain as NamefiNormalizedDomain,
    ),
  });
  const additional = record?.additionalReservedNames ?? [];

  return new Set(additional);
};

/**
 * Async variant of keyword reservation that considers per-parent domain overrides
 * from the database (additionalReservedNames).
 */
export const isReservedKeywordForParentDomain = async (
  parentDomain: string,
  keyword: string,
) => {
  if (keyword.includes('namefi')) {
    return true;
  }
  if (isReservedKeyword(keyword)) {
    return true;
  }
  const additionalReservedNames =
    await getAdditionalReservedNamesForParentDomain(parentDomain);
  return additionalReservedNames.has(keyword);
};
