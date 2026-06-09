import { toBytes } from 'viem';
import { keccak256 } from 'viem';
import { db, poweredbyNamefiDomainsTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { TldRegistrationRequirement } from '@namefi-astra/common/domain-availability';

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

// ---------------------------------------------------------------------------
// TLD registration requirements
// ---------------------------------------------------------------------------

/**
 * TLD-specific registration requirements surfaced in the cart before checkout.
 *
 * Google Registry operates a large set of TLDs, each with a registration
 * policy at `https://www.registry.google/policies/registration/<tld>/`
 * (see https://www.registry.google/for-partners/). A subset are "secure
 * namespaces" (encrypted by default): the registry mandates a conspicuous
 * pre-purchase notice — separate from the terms of service — that the site
 * will not load in browsers without HTTPS. Those are surfaced as `'explicit'`
 * (the cart blocks checkout until the user ticks an acknowledgement). The
 * remaining Google TLDs carry a general policy disclosure shown as an
 * `'implicit'` informational banner.
 *
 * This list is intentionally hardcoded; edit it to add TLDs or to move a TLD
 * between the explicit and implicit tiers.
 */
const googleRegistrationPolicyUrl = (tld: string) =>
  `https://www.registry.google/policies/registration/${tld}/`;

// Google "secure namespaces" — encrypted by default, HTTPS required. The
// registry requires a conspicuous pre-purchase notice, so these get an
// explicit acknowledgement checkbox in the cart.
const GOOGLE_SECURE_NAMESPACE_TLDS = ['ing', 'app', 'dev'] as const;

// Other Google Registry TLDs — general registration policy, shown as an
// informational (implicit) banner. IDN TLDs (e.g. みんな) are omitted because
// normalized domains arrive as punycode and would not match by label.
const GOOGLE_GENERAL_POLICY_TLDS = [
  'new',
  'how',
  'phd',
  'prof',
  'esq',
  'foo',
  'zip',
  'mov',
  'nexus',
  'dad',
  'boo',
  'day',
  'channel',
  'meme',
  'rsvp',
  'soy',
  'app',
  'dev',
  'page',
] as const;

const buildSecureNamespaceRequirement = (
  tld: string,
): TldRegistrationRequirement => ({
  tld,
  title: `.${tld} requires HTTPS`,
  summary: `.${tld} is a secure namespace. Sites will not load in browsers until you set up HTTPS.`,
  outline: [
    `.${tld} is an encrypted-by-default namespace operated by Google Registry.`,
    'Browsers require a valid HTTPS certificate before they load any site on this domain.',
    'You must obtain an SSL/TLS certificate and configure HTTPS for the site to be reachable.',
    'Two-character labels must not falsely imply a government or country-code affiliation.',
  ],
  links: [
    {
      label: `Google Registry: .${tld} policy`,
      url: googleRegistrationPolicyUrl(tld),
    },
  ],
  confirmation: 'explicit',
});

const buildGeneralPolicyRequirement = (
  tld: string,
): TldRegistrationRequirement => ({
  tld,
  title: `.${tld} registration policy`,
  summary: `.${tld} is operated by Google Registry and is subject to its registration and acceptable-use policies.`,
  outline: [
    `.${tld} is operated by Google Registry.`,
    'Registration is subject to the registration and acceptable-use policies of Google Registry.',
    'Review the policy before registering to confirm your intended use is allowed.',
  ],
  links: [
    {
      label: `Google Registry: .${tld} policy`,
      url: googleRegistrationPolicyUrl(tld),
    },
  ],
  confirmation: 'implicit',
});

const TLD_REGISTRATION_REQUIREMENTS: Record<
  string,
  TldRegistrationRequirement
> = {
  ...Object.fromEntries(
    GOOGLE_SECURE_NAMESPACE_TLDS.map((tld) => [
      tld,
      buildSecureNamespaceRequirement(tld),
    ]),
  ),
  ...Object.fromEntries(
    GOOGLE_GENERAL_POLICY_TLDS.map((tld) => [
      tld,
      buildGeneralPolicyRequirement(tld),
    ]),
  ),
  ...(process.env.ENVIRONMENT !== 'production'
    ? {
        pw: {
          confirmation: 'explicit',
          tld: 'pw',
          title: '.pw registration policy',
          summary:
            '.pw is operated by Centralnic Registry and is subject to its registration and acceptable-use policies.',
          outline: [
            '.pw is operated by Centralnic Registry.',
            'Registration is subject to the registration and acceptable-use policies of Centralnic Registry.',
            'Review the policy before registering to confirm your intended use is allowed.',
          ],
          links: [
            {
              label: 'Centralnic Registry: .pw policy',
              url: 'https://google.com',
            },
          ],
        },
        gl: {
          confirmation: 'implicit',
          tld: 'gl',
          title: '.gl registration policy',
          summary:
            '.gl is operated by Centralnic Registry and is subject to its registration and acceptable-use policies.',
          outline: [
            '.gl is operated by Centralnic Registry.',
            'Registration is subject to the registration and acceptable-use policies of Centralnic Registry.',
            'Review the policy before registering to confirm your intended use is allowed.',
          ],
          links: [
            {
              label: 'Centralnic Registry: .gl policy',
              url: 'https://google.com',
            },
          ],
        },
      }
    : {}),
};

/**
 * Returns the hardcoded registration requirement for a domain's TLD, or
 * `undefined` when the TLD has no special requirement. Matches on the final
 * dot-separated label (all currently listed TLDs are single-label).
 */
export const getTldRegistrationRequirement = (
  domain: string,
): TldRegistrationRequirement | undefined => {
  const tld = domain.split('.').pop()?.toLowerCase();
  if (!tld) {
    return undefined;
  }
  return TLD_REGISTRATION_REQUIREMENTS[tld];
};
