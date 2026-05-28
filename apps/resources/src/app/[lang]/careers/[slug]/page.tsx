import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { getCareerCached, getCareerParams } from '@/lib/content';
import { loadMdxModule } from '@/lib/load-mdx-module';
import { resolveBaseUrl } from '@/lib/site-url';
import { useMDXComponents } from '@/mdx-components';
import { JobPostingJsonLd } from '@/components/careers/job-posting-jsonld';
import { HowWeHireFooter } from '@/components/careers/how-we-hire-footer';

const ABOUT_NAMEFI_PATH = 'careers/_shared/about-namefi.md';

export async function generateStaticParams() {
  return getCareerParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const entry = getCareerCached(locale, slug);

  if (!entry) return {};

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/careers/${slug}`;
  const selfUrl = `${baseUrl}${selfPath}`;
  const canonicalUrl =
    locale === 'en' || !getCareerCached('en', slug)
      ? selfUrl
      : `${baseUrl}/r/en/careers/${slug}`;

  const titleSuffix =
    entry.frontmatter.type === 'job' ? ' — Namefi Careers' : '';

  return {
    alternates: { canonical: canonicalUrl },
    title: `${entry.frontmatter.title}${titleSuffix}`,
    description: entry.frontmatter.summary ?? entry.frontmatter.description,
    openGraph: {
      title: `${entry.frontmatter.title}${titleSuffix}`,
      description: entry.frontmatter.summary ?? entry.frontmatter.description,
      url: selfUrl,
      locale,
      type: 'article',
      tags: entry.frontmatter.tags,
      siteName: 'Namefi',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${entry.frontmatter.title}${titleSuffix}`,
      description: entry.frontmatter.summary ?? entry.frontmatter.description,
      site: '@namefi_io',
      creator: '@namefi_io',
    },
    robots: { index: true, follow: true },
  };
}

export default async function CareerSlugPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const entry = getCareerCached(locale, slug);

  if (!entry) {
    notFound();
  }

  const components = useMDXComponents();
  const proseComponents = {
    ...components,
    wrapper: ({ children }: { children: ReactNode }) => (
      <article className="prose prose-invert md:prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-a:font-semibold prose-a:no-underline prose-hr:border-border/60">
        {children}
      </article>
    ),
  };

  const { default: Content } = await loadMdxModule(entry.relativePath);
  const isJob = entry.frontmatter.type === 'job';
  const baseUrl = resolveBaseUrl();

  const AboutNamefi = isJob
    ? (await loadMdxModule(ABOUT_NAMEFI_PATH)).default
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 md:px-10">
      {isJob && (
        <JobPostingJsonLd
          title={entry.frontmatter.title}
          description={
            entry.frontmatter.description ?? entry.frontmatter.summary ?? ''
          }
          datePosted={entry.frontmatter.date}
          validThrough={entry.frontmatter.validThrough}
          employmentType={entry.frontmatter.employmentType ?? 'FULL_TIME'}
          slug={slug}
          siteUrl={baseUrl}
          locale={locale}
        />
      )}

      <Link
        href={`/${locale}/careers`}
        className="inline-flex w-fit items-center rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground transition hover:border-brand-primary/60 hover:text-foreground"
      >
        All Positions
      </Link>

      <header className="space-y-4">
        {isJob && entry.frontmatter.team && (
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {entry.frontmatter.team}
            {entry.frontmatter.location && (
              <> &middot; {entry.frontmatter.location}</>
            )}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {entry.frontmatter.title}
        </h1>
        {entry.frontmatter.summary && (
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            {entry.frontmatter.summary}
          </p>
        )}
        {isJob && (
          <div className="flex flex-wrap gap-2">
            {entry.frontmatter.employmentType === 'FULL_TIME' && (
              <Tag>Full-time</Tag>
            )}
            {entry.frontmatter.employmentType === 'PART_TIME' && (
              <Tag>Part-time</Tag>
            )}
            {entry.frontmatter.employmentType === 'INTERN' && (
              <Tag>Internship</Tag>
            )}
            {entry.frontmatter.location && (
              <Tag>{entry.frontmatter.location}</Tag>
            )}
            <Tag>AI-First</Tag>
          </div>
        )}
      </header>

      <Content components={proseComponents} />

      {AboutNamefi && <AboutNamefi components={proseComponents} />}

      <HowWeHireFooter locale={locale} currentSlug={slug} />
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}
