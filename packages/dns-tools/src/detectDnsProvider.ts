/**
 * Map authoritative-nameserver hostnames to a known DNS provider so the
 * Simple-mode DNSSEC panel can surface a one-click "Enable DNSSEC at
 * <Provider>" CTA when the user's NS hasn't published a DNSKEY yet.
 *
 * The list is best-effort and covers the major providers we see most often.
 * Patterns are matched against the lowercased, dot-stripped hostname.
 */

export type DnsProviderInfo = {
  name: string;
  /** Direct link to the provider's DNSSEC enablement docs. */
  dnssecSetupUrl?: string;
};

export type DetectDnsProviderResult = DnsProviderInfo & {
  /**
   * - `'all'`: every nameserver matches the same provider.
   * - `'majority'`: more than half of nameservers match the same provider but
   *   not all of them — useful during a migration in flight.
   * - `'unknown'`: no consistent match. The panel falls back to generic copy.
   */
  confidence: 'all' | 'majority' | 'unknown';
};

const CLOUDFLARE_PATTERN = /\.ns\.cloudflare\.com$/;
const AWS_ROUTE53_PATTERN = /\.awsdns-\d+\.(?:com|net|org|co\.uk)$/;
const GOOGLE_CLOUD_DNS_PATTERN = /\.googledomains\.com$/;
const GODADDY_PATTERN = /\.domaincontrol\.com$/;
const NAMECHEAP_PATTERN = /\.registrar-servers\.com$/;
const DNSIMPLE_PATTERN = /\.dnsimple\.com$/;
const HOVER_PATTERN = /\.hover\.com$/;
const SQUARESPACE_PATTERN = /\.squarespacedns\.com$/;
const VERCEL_PATTERN = /\.vercel-dns\.com$/;
const AZURE_DNS_PATTERN = /\.azure-dns\.(?:com|net|org|info)$/;
const LINODE_PATTERN = /\.linode\.com$/;
const DIGITALOCEAN_PATTERN = /\.digitalocean\.com$/;
const ATOM_PATTERN = /\.atom\.com$/;
const NAMEDOTCOM_PATTERN = /\.name\.com$/;
const PORKBUN_PATTERN = /\.ns\.porkbun\.com$/;
const TRAILING_DOT_PATTERN = /\.$/;

const PROVIDERS: ReadonlyArray<{
  pattern: RegExp;
  info: DnsProviderInfo;
}> = [
  {
    pattern: CLOUDFLARE_PATTERN,
    info: {
      name: 'Cloudflare',
      dnssecSetupUrl: 'https://developers.cloudflare.com/dns/dnssec/',
    },
  },
  {
    pattern: AWS_ROUTE53_PATTERN,
    info: {
      name: 'AWS Route 53',
      dnssecSetupUrl:
        'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html',
    },
  },
  {
    pattern: GOOGLE_CLOUD_DNS_PATTERN,
    info: {
      name: 'Google Cloud DNS',
      dnssecSetupUrl: 'https://cloud.google.com/dns/docs/dnssec',
    },
  },
  {
    pattern: GODADDY_PATTERN,
    info: {
      name: 'GoDaddy',
      dnssecSetupUrl: 'https://www.godaddy.com/help/turn-dnssec-on-or-off-6420',
    },
  },
  {
    pattern: NAMECHEAP_PATTERN,
    info: {
      name: 'Namecheap',
      dnssecSetupUrl:
        'https://www.namecheap.com/support/knowledgebase/article.aspx/9722/2232/managing-dnssec-for-domains-pointed-to-namecheap-bdns/',
    },
  },
  {
    pattern: DNSIMPLE_PATTERN,
    info: {
      name: 'DNSimple',
      dnssecSetupUrl: 'https://support.dnsimple.com/articles/dnssec/',
    },
  },
  { pattern: HOVER_PATTERN, info: { name: 'Hover' } },
  { pattern: SQUARESPACE_PATTERN, info: { name: 'Squarespace' } },
  { pattern: VERCEL_PATTERN, info: { name: 'Vercel' } },
  {
    pattern: AZURE_DNS_PATTERN,
    info: {
      name: 'Azure DNS',
      dnssecSetupUrl: 'https://learn.microsoft.com/en-us/azure/dns/dnssec',
    },
  },
  { pattern: LINODE_PATTERN, info: { name: 'Linode' } },
  {
    pattern: DIGITALOCEAN_PATTERN,
    info: {
      name: 'DigitalOcean',
      dnssecSetupUrl:
        'https://docs.digitalocean.com/products/networking/dns/concepts/dnssec/',
    },
  },
  {
    pattern: ATOM_PATTERN,
    info: {
      name: 'Atom.com',
      dnssecSetupUrl:
        'https://apidocs.atom.com/api-reference/registrar_apis/enable_dnssec',
    },
  },
  { pattern: NAMEDOTCOM_PATTERN, info: { name: 'Name.com' } },
  {
    pattern: PORKBUN_PATTERN,
    info: {
      name: 'Porkbun',
      dnssecSetupUrl: 'https://kb.porkbun.com/article/93-how-to-install-dnssec',
    },
  },
];

const UNKNOWN_PROVIDER: DnsProviderInfo = { name: 'unknown' };

function classifyOne(nameserver: string): DnsProviderInfo {
  const normalized = nameserver
    .trim()
    .toLowerCase()
    .replace(TRAILING_DOT_PATTERN, '');
  if (normalized.length === 0) return UNKNOWN_PROVIDER;
  for (const provider of PROVIDERS) {
    if (provider.pattern.test(normalized)) return provider.info;
  }
  return UNKNOWN_PROVIDER;
}

/**
 * Classify a list of authoritative nameserver hostnames by DNS provider.
 * Returns the provider that owns the most nameservers in the list, with a
 * `confidence` flag describing whether all/most/few of them agree.
 */
export function detectDnsProviderFromNameservers(
  nameservers: ReadonlyArray<string>,
): DetectDnsProviderResult {
  if (nameservers.length === 0) {
    return { ...UNKNOWN_PROVIDER, confidence: 'unknown' };
  }

  const counts = new Map<string, { info: DnsProviderInfo; count: number }>();
  for (const ns of nameservers) {
    const info = classifyOne(ns);
    const existing = counts.get(info.name);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(info.name, { info, count: 1 });
    }
  }

  let topName = UNKNOWN_PROVIDER.name;
  let topCount = 0;
  let topInfo: DnsProviderInfo = UNKNOWN_PROVIDER;
  for (const [name, entry] of counts) {
    if (entry.count > topCount) {
      topCount = entry.count;
      topName = name;
      topInfo = entry.info;
    }
  }

  if (topName === UNKNOWN_PROVIDER.name) {
    return { ...UNKNOWN_PROVIDER, confidence: 'unknown' };
  }

  if (topCount === nameservers.length) {
    return { ...topInfo, confidence: 'all' };
  }
  if (topCount * 2 > nameservers.length) {
    return { ...topInfo, confidence: 'majority' };
  }
  return { ...UNKNOWN_PROVIDER, confidence: 'unknown' };
}
