#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LOCALES = ['en', 'es', 'de', 'fr', 'zh-CN', 'ar', 'hi', 'ko', 'ja', 'ta'] as const;
type Locale = (typeof LOCALES)[number];
type Collection = 'blog' | 'tld' | 'glossary' | 'partners';

const COLLECTIONS: Collection[] = ['blog', 'tld', 'glossary', 'partners'];
const DATA_ROOT = path.join(process.cwd(), 'content');

const TOPICS = [
  'domain-tokenization',
  'domain-basics',
  'domain-security',
  'choosing-a-tld',
  'domain-investing',
  'web3-foundations',
] as const;

const SERIES = [
  'domain-apocalypse',
  'name-change-game-change',
  'tokenize-your-com',
  'best-tlds-by-industry',
  'domain-investor-field-guide',
  'domain-flipping-skills',
] as const;

const TOPIC_TEXT: Record<string, string> = {
  'domain-tokenization':
    'tokenized domains tokenization onchain NFT domain ownership DNS marketplace escrow wallet custody recovery',
  'domain-basics':
    'domain name basics terminology TLD registrar registry registrant UDRP naming DNS internet address',
  'domain-security':
    'domain security hijacking DNS attack phishing breach recovery lock multisig custody wallet DNSSEC',
  'choosing-a-tld':
    'TLD extension ccTLD gTLD choose domain extension industry startup SaaS ecommerce law real estate pricing',
  'domain-investing':
    'domain investing flipping sale valuation appraisal aftermarket broker auction portfolio domaining marketplace',
  'web3-foundations':
    'web3 crypto blockchain stablecoin tokenized assets xstocks zero knowledge AI agents DAO payments',
};

const SERIES_TEXT: Record<string, string> = {
  'domain-apocalypse':
    'domain security incidents hijack breach attack DNS phishing recovery domain disasters case study',
  'name-change-game-change':
    'brand rename rebrand premium domain upgrade company name change dot com case study',
  'tokenize-your-com':
    'tokenize your com DNS tokenized domain marketplace tax recovery onchain ownership walkthrough',
  'best-tlds-by-industry':
    'best TLDs industry startup SaaS ecommerce business law accounting real estate fashion defensive registration',
  'domain-investor-field-guide':
    'domain investor media newsletters forums sell domain community field guide',
  'domain-flipping-skills':
    'domain flipping skills source appraise value sell portfolio marketplace broker law escrow scams',
};

const STOP_WORDS = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'can',
    'com',
    'for',
    'from',
    'how',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'or',
    'that',
    'the',
    'this',
    'to',
    'vs',
    'what',
    'when',
    'where',
    'who',
    'why',
    'with',
    'your',
  ].map((word) => word.toLowerCase()),
);

type Entry = {
  collection: Collection;
  slug: string;
  locale: Locale;
  filePath: string;
  data: Record<string, unknown>;
  body: string;
  tokens: Map<string, number>;
};

function markdownFiles(collection: Collection, locale: Locale) {
  const dir = path.join(DATA_ROOT, collection, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .sort();
}

function readEntry(collection: Collection, locale: Locale, fileName: string): Entry {
  const filePath = path.join(DATA_ROOT, collection, locale, fileName);
  const parsed = matter(readFileSync(filePath, 'utf8'));
  const slug = fileName.replace(/\.mdx?$/, '');
  const data = parsed.data as Record<string, unknown>;
  const haystack = [
    slug,
    data.title,
    data.description,
    data.summary,
    data.cluster,
    data.series,
    data.format,
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.keywords) ? data.keywords : []),
    parsed.content.replace(/\[[^\]]+\]\([^)]+\)/g, ' '),
  ]
    .filter(Boolean)
    .join(' ');

  return {
    collection,
    slug,
    locale,
    filePath,
    data,
    body: parsed.content,
    tokens: tokenize(haystack),
  };
}

function loadEntries() {
  const entries: Entry[] = [];
  for (const collection of COLLECTIONS) {
    for (const locale of LOCALES) {
      for (const fileName of markdownFiles(collection, locale)) {
        entries.push(readEntry(collection, locale, fileName));
      }
    }
  }
  return entries;
}

function tokenize(input: string) {
  const tokens = new Map<string, number>();
  const normalized = input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');

  for (const token of normalized.split(/\s+/)) {
    if (token.length < 2 || STOP_WORDS.has(token)) continue;
    tokens.set(token, (tokens.get(token) ?? 0) + 1);
  }
  return tokens;
}

function similarity(a: Map<string, number>, b: Map<string, number>) {
  let score = 0;
  for (const [token, count] of a) {
    const other = b.get(token);
    if (!other) continue;
    score += Math.min(count, other);
  }
  return score;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function pathFor(locale: Locale, collection: 'blog' | 'glossary', slug: string) {
  return `/${locale}/${collection}/${slug}/`;
}

function topicPath(locale: Locale, slug: string) {
  return `/${locale}/topics/${slug}/`;
}

function seriesPath(locale: Locale, slug: string) {
  return `/${locale}/series/${slug}/`;
}

function entryKey(entry: Pick<Entry, 'collection' | 'locale' | 'slug'>) {
  return `${entry.collection}/${entry.locale}/${entry.slug}`;
}

const allEntries = loadEntries();
const entriesByKey = new Map(allEntries.map((entry) => [entryKey(entry), entry]));
const englishEntries = allEntries.filter((entry) => entry.locale === 'en');
const englishBlogs = englishEntries.filter((entry) => entry.collection === 'blog');
const englishGlossary = englishEntries.filter((entry) => entry.collection === 'glossary');

const topicTokens = new Map(
  TOPICS.map((topic) => [topic, tokenize(`${topic} ${TOPIC_TEXT[topic]}`)]),
);
const seriesTokens = new Map(
  SERIES.map((series) => [series, tokenize(`${series} ${SERIES_TEXT[series]}`)]),
);

function hasLocalized(locale: Locale, collection: Collection, slug: string) {
  return entriesByKey.has(`${collection}/${locale}/${slug}`);
}

function blogScore(source: Entry, candidate: Entry) {
  if (source.slug === candidate.slug) return Number.NEGATIVE_INFINITY;
  let score = similarity(source.tokens, candidate.tokens);

  const sourceCluster = asString(source.data.cluster);
  const candidateCluster = asString(candidate.data.cluster);
  if (sourceCluster && sourceCluster === candidateCluster) score += 16;

  const sourceSeries = asString(source.data.series);
  const candidateSeries = asString(candidate.data.series);
  if (sourceSeries && sourceSeries === candidateSeries) {
    score += 28;
    const sourceOrder = Number(source.data.seriesOrder);
    const candidateOrder = Number(candidate.data.seriesOrder);
    if (Number.isFinite(sourceOrder) && Number.isFinite(candidateOrder)) {
      score += Math.max(0, 12 - Math.abs(sourceOrder - candidateOrder) * 2);
    }
  }

  if (source.collection === 'tld') {
    const slug = source.slug.replace(/^xn--/, '');
    if (candidate.slug.includes(slug) || candidate.body.includes(`.${slug}`)) {
      score += 30;
    }
  }

  if (source.collection === 'glossary') {
    const title = asString(source.data.title).toLowerCase();
    if (candidate.body.toLowerCase().includes(title.toLowerCase())) score += 18;
    if (candidate.slug.includes(source.slug)) score += 12;
  }

  return score;
}

function relatedBlogSlugs(source: Entry, locale: Locale) {
  const ranked = englishBlogs
    .filter((candidate) => hasLocalized(locale, 'blog', candidate.slug))
    .map((candidate) => ({
      slug: candidate.slug,
      score: blogScore(source, candidate),
    }))
    .filter((candidate) => candidate.score > Number.NEGATIVE_INFINITY)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  return ranked.slice(0, 5).map((candidate) => candidate.slug);
}

function relatedTopics(source: Entry, relatedArticles: string[]) {
  const scores = new Map<string, number>();
  const ownCluster = asString(source.data.cluster);
  if (TOPICS.includes(ownCluster as (typeof TOPICS)[number])) {
    scores.set(ownCluster, 100);
  }

  for (const slug of relatedArticles) {
    const blog = entriesByKey.get(`blog/en/${slug}`);
    const cluster = blog ? asString(blog.data.cluster) : '';
    if (cluster) scores.set(cluster, (scores.get(cluster) ?? 0) + 20);
  }

  for (const topic of TOPICS) {
    const tokens = topicTokens.get(topic)!;
    scores.set(topic, (scores.get(topic) ?? 0) + similarity(source.tokens, tokens));
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([topic]) => topic);
}

function relatedSeries(source: Entry, relatedArticles: string[]) {
  const scores = new Map<string, number>();
  const ownSeries = asString(source.data.series);
  if (SERIES.includes(ownSeries as (typeof SERIES)[number])) {
    scores.set(ownSeries, 100);
  }

  for (const slug of relatedArticles) {
    const blog = entriesByKey.get(`blog/en/${slug}`);
    const series = blog ? asString(blog.data.series) : '';
    if (series) scores.set(series, (scores.get(series) ?? 0) + 20);
  }

  for (const series of SERIES) {
    const tokens = seriesTokens.get(series)!;
    scores.set(series, (scores.get(series) ?? 0) + similarity(source.tokens, tokens));
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([series]) => series);
}

function relatedGlossarySlugs(source: Entry, locale: Locale) {
  const sourceTitle = asString(source.data.title).toLowerCase();
  const ranked = englishGlossary
    .filter((candidate) => candidate.slug !== source.slug)
    .filter((candidate) => hasLocalized(locale, 'glossary', candidate.slug))
    .map((candidate) => {
      let score = similarity(source.tokens, candidate.tokens);
      const title = asString(candidate.data.title).toLowerCase();
      if (title && source.body.toLowerCase().includes(title)) score += 24;
      if (sourceTitle && candidate.body.toLowerCase().includes(sourceTitle)) {
        score += 12;
      }
      if (source.slug.includes(candidate.slug) || candidate.slug.includes(source.slug)) {
        score += 10;
      }
      return { slug: candidate.slug, score };
    })
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  return ranked.slice(0, 5).map((candidate) => candidate.slug);
}

function relationBlock(entry: Entry) {
  const englishSource =
    entriesByKey.get(`${entry.collection}/en/${entry.slug}`) ?? entry;
  const relatedArticles = relatedBlogSlugs(englishSource, entry.locale);
  const topics = relatedTopics(englishSource, relatedArticles);
  const series = relatedSeries(englishSource, relatedArticles);
  const glossary = relatedGlossarySlugs(englishSource, entry.locale);

  return {
    relatedArticles: relatedArticles.map((slug) => pathFor(entry.locale, 'blog', slug)),
    relatedTopics: topics.map((slug) => topicPath(entry.locale, slug)),
    relatedSeries: series.map((slug) => seriesPath(entry.locale, slug)),
    relatedGlossary: glossary.map((slug) =>
      pathFor(entry.locale, 'glossary', slug),
    ),
  };
}

function formatYamlArray(key: string, values: string[]) {
  return [`${key}:`, ...values.map((value) => `  - ${value}`)].join('\n');
}

function stripExistingRelationBlock(frontmatter: string) {
  const relationKeys = new Set([
    'relatedArticles',
    'relatedTopics',
    'relatedSeries',
    'relatedGlossary',
  ]);
  const lines = frontmatter.split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const key = lines[index].match(/^([A-Za-z][A-Za-z0-9_]*):(?:\s|$)/)?.[1];
    if (!key || !relationKeys.has(key)) {
      output.push(lines[index]);
      continue;
    }

    while (index + 1 < lines.length && !/^[A-Za-z][A-Za-z0-9_]*:/.test(lines[index + 1])) {
      index += 1;
    }
  }

  while (output.at(-1) === '') output.pop();
  return output.join('\n');
}

function upsertRelations(entry: Entry) {
  const raw = readFileSync(entry.filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`Missing frontmatter fence: ${entry.filePath}`);
  }

  const relations = relationBlock(entry);
  const cleanFrontmatter = stripExistingRelationBlock(match[1]);
  const block = [
    formatYamlArray('relatedArticles', relations.relatedArticles),
    formatYamlArray('relatedTopics', relations.relatedTopics),
    formatYamlArray('relatedSeries', relations.relatedSeries),
    formatYamlArray('relatedGlossary', relations.relatedGlossary),
  ].join('\n');
  const nextFrontmatter = `${cleanFrontmatter}\n${block}`;
  const nextRaw = raw.replace(match[0], `---\n${nextFrontmatter}\n---\n`);

  if (nextRaw !== raw) {
    writeFileSync(entry.filePath, nextRaw);
  }
}

for (const entry of allEntries) {
  upsertRelations(entry);
}

console.log(`Added related-content frontmatter to ${allEntries.length} files.`);
