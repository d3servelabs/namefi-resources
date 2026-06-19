import type { Locale } from '@/i18n-config';

/**
 * Controlled vocabularies for the resources topic-cluster / pillar + editorial
 * series information architecture.
 *
 * This is purely ADDITIVE: posts opt in via optional frontmatter fields
 * (`cluster`, `series`, `seriesOrder`, `format`). No existing article URL or
 * route changes — clusters and series are surfaced through new hub pages
 * (`/[lang]/topics`, `/[lang]/series`) and cross-links, never by moving posts.
 *
 * Two orthogonal axes:
 *  - Topic clusters (pillars): evergreen hub-and-spoke. A post has at most one
 *    primary `cluster`, which drives its breadcrumb and hub membership.
 *  - Editorial series: sequential, branded, bilingual. A post may also belong to
 *    one `series` with a `seriesOrder` for prev/next navigation.
 */

/** Localized display text. `en` is always required; other locales are optional. */
type LocalizedText = { en: string } & Partial<Record<Locale, string>>;

// ---------------------------------------------------------------------------
// Topic clusters (pillars)
// ---------------------------------------------------------------------------

export const CLUSTER_SLUGS = [
  'domain-tokenization',
  'domain-basics',
  'domain-security',
  'choosing-a-tld',
  'domain-investing',
  'web3-foundations',
] as const;

export type ClusterSlug = (typeof CLUSTER_SLUGS)[number];

export type ClusterMeta = {
  slug: ClusterSlug;
  title: LocalizedText;
  description: LocalizedText;
  /** Slug of the cornerstone (pillar) post that anchors the hub page. */
  cornerstoneSlug: string;
};

export const CLUSTERS: Record<ClusterSlug, ClusterMeta> = {
  'domain-tokenization': {
    slug: 'domain-tokenization',
    title: { en: 'Domain Tokenization', zh: '域名通证化' },
    description: {
      en: 'What tokenized domains are, why and how to tokenize, and how on-chain ownership works in practice.',
      zh: '什么是通证化域名、为什么以及如何通证化,以及链上所有权在实践中如何运作。',
    },
    cornerstoneSlug: 'what-are-tokenized-domains',
  },
  'domain-basics': {
    slug: 'domain-basics',
    title: { en: 'Domain Basics', zh: '域名基础' },
    description: {
      en: 'Start here: what a domain is, how TLDs work, key terminology, naming, and disputes.',
      zh: '从这里开始:什么是域名、TLD 如何运作、核心术语、起名与争议处理。',
    },
    cornerstoneSlug: 'what-is-domain',
  },
  'domain-security': {
    slug: 'domain-security',
    title: { en: 'Domain Security & Recovery', zh: '域名安全与恢复' },
    description: {
      en: 'Real-world domain disasters and the controls that stop them — hijacking, DNS takeovers, key management, and recovery.',
      zh: '真实世界的域名灾难以及阻止它们的控制手段——劫持、DNS 接管、密钥管理与恢复。',
    },
    cornerstoneSlug: 'how-domain-hijacking-actually-happens',
  },
  'choosing-a-tld': {
    slug: 'choosing-a-tld',
    title: { en: 'Choosing a TLD', zh: '如何选择 TLD' },
    description: {
      en: 'Pick and secure the right extension for your project — by industry, by price, and by the signals each TLD sends.',
      zh: '为你的项目挑选并保护合适的后缀——按行业、按价格、按每个 TLD 传递的信号。',
    },
    cornerstoneSlug: 'what-is-a-tld',
  },
  'domain-investing': {
    slug: 'domain-investing',
    title: { en: 'Domain Investing & Industry', zh: '域名投资与行业' },
    description: {
      en: 'Selling, valuing, and following the domain market — plus the media, communities, and case studies that shape it.',
      zh: '域名的出售、估值与市场追踪——以及塑造这一行业的媒体、社区与案例研究。',
    },
    cornerstoneSlug: 'how-to-sell-a-domain-name-you-own',
  },
  'web3-foundations': {
    slug: 'web3-foundations',
    title: { en: 'Web3 & Crypto Foundations', zh: 'Web3 与加密基础' },
    description: {
      en: 'Adjacent building blocks — stablecoins, tokenized assets, zero-knowledge, and the payment rails behind on-chain commerce.',
      zh: '相邻的基础构件——稳定币、通证化资产、零知识证明,以及链上商务背后的支付通道。',
    },
    cornerstoneSlug: 'what-are-stablecoins',
  },
};

export function isClusterSlug(value: unknown): value is ClusterSlug {
  return (
    typeof value === 'string' &&
    (CLUSTER_SLUGS as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------------------
// Editorial series
// ---------------------------------------------------------------------------

export const SERIES_SLUGS = [
  'domain-apocalypse',
  'name-change-game-change',
  'tokenize-your-com',
  'best-tlds-by-industry',
  'domain-investor-field-guide',
] as const;

export type SeriesSlug = (typeof SERIES_SLUGS)[number];

export type SeriesMeta = {
  slug: SeriesSlug;
  /** Bilingual series name shown as the episode badge and on the series page. */
  title: LocalizedText;
  description: LocalizedText;
};

export const SERIES: Record<SeriesSlug, SeriesMeta> = {
  'domain-apocalypse': {
    slug: 'domain-apocalypse',
    title: { en: 'Domain Apocalypse', zh: '域名浩劫' },
    description: {
      en: 'Real domain disasters, told as incident stories — and the specific controls that would have stopped each one.',
      zh: '以事故故事的形式讲述真实的域名灾难——以及本可以阻止每一次灾难的具体控制手段。',
    },
  },
  'name-change-game-change': {
    slug: 'name-change-game-change',
    title: { en: 'Name Change, Game Change', zh: '改名,改命' },
    description: {
      en: 'Case studies where a brand-defining rename rode a premium-domain upgrade — and changed the company that followed.',
      zh: '一系列案例研究:一次定义品牌的改名如何踩着溢价域名升级完成,并改变了此后的公司。',
    },
  },
  'tokenize-your-com': {
    slug: 'tokenize-your-com',
    title: { en: 'Tokenize Your .com', zh: '通证化你的 .com' },
    description: {
      en: 'A step-by-step walkthrough of bringing a traditional .com on-chain — tokenizing, DNS, marketplaces, taxes, and recovery.',
      zh: '把传统 .com 上链的分步指南——通证化、DNS、交易市场、税务与恢复。',
    },
  },
  'best-tlds-by-industry': {
    slug: 'best-tlds-by-industry',
    title: { en: 'Best TLDs for Your Industry', zh: '各行业最佳 TLD' },
    description: {
      en: 'Which extensions to pick and secure, industry by industry — from startups and SaaS to law, real estate, and fashion.',
      zh: '逐个行业讲解该挑选并保护哪些后缀——从初创与 SaaS 到法律、房地产与时尚。',
    },
  },
  'domain-investor-field-guide': {
    slug: 'domain-investor-field-guide',
    title: { en: "Domain Investor's Field Guide", zh: '域名投资人手册' },
    description: {
      en: 'A practical field guide for domain investors — selling, the trade media, the newsletters, and the communities that matter.',
      zh: '面向域名投资人的实用手册——出售、行业媒体、值得订阅的资讯,以及重要的社区。',
    },
  },
};

export function isSeriesSlug(value: unknown): value is SeriesSlug {
  return (
    typeof value === 'string' &&
    (SERIES_SLUGS as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------------------
// Content format (article type), separated from topical tags
// ---------------------------------------------------------------------------

export const CONTENT_FORMATS = [
  'explainer',
  'guide',
  'comparison',
  'case-study',
  'faq',
  'roundup',
  'opinion',
  'news',
  'analysis',
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export function isContentFormat(value: unknown): value is ContentFormat {
  return (
    typeof value === 'string' &&
    (CONTENT_FORMATS as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------------------
// Tag normalization
// ---------------------------------------------------------------------------

/**
 * Canonicalize a topical tag: trim, lowercase, hyphenate whitespace, then map
 * known aliases to a single canonical form. Keeps the tag vocabulary consistent
 * across posts (e.g. `Infrastructure`, `AI Agents` → `infrastructure`,
 * `ai-agents`).
 */
const TAG_ALIASES: Record<string, string> = {
  infrastructure: 'infrastructure',
  'ai-agents': 'ai-agents',
  'digital-commerce': 'digital-commerce',
  'namefi-space': 'namefi-space',
  'incident-explainer': 'incident-response',
  'key-management': 'key-management',
};

export function normalizeTag(tag: string): string {
  const base = tag.trim().toLowerCase().replace(/\s+/g, '-');
  return TAG_ALIASES[base] ?? base;
}

/** Pick the best localized string for a locale, falling back to English. */
export function localizeText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}
