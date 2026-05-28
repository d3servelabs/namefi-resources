import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/i18n-config';
import { getCareerEntriesForLocale, type CareerEntry } from '@/lib/content';
import { resolveBaseUrl } from '@/lib/site-url';
import { HowWeHireFooter } from '@/components/careers/how-we-hire-footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${lang}/careers`;

  return {
    title: 'Careers at Namefi — Join Us',
    description:
      'Join Namefi and build the future of domain names with AI agents and the latest generative tooling. Fully remote, competitive pay, equal opportunity.',
    alternates: { canonical: selfUrl },
    openGraph: {
      title: 'Careers at Namefi — Join Us',
      description:
        'Join Namefi and build the future of domain names with AI agents and the latest generative tooling.',
      url: selfUrl,
      type: 'website',
      siteName: 'Namefi',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@namefi_io',
      creator: '@namefi_io',
    },
    robots: { index: true, follow: true },
  };
}

export default async function CareerIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const entries = getCareerEntriesForLocale(locale);
  const jobEntries = entries.filter((e) => e.frontmatter.type === 'job');

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          Careers at Namefi
        </h1>
        <p className="text-lg text-muted-foreground">
          We are an ICANN-accredited registrar building the future of domain
          names — tokenization, DeFi, and AI-powered infrastructure. We work
          fully remote, ship with AI agents and the latest generative tooling,
          and hire based on what you can do, not where you went to school.
        </p>
      </header>

      {jobEntries.length > 0 && (
        <section className="space-y-4">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            Open Positions
          </h2>
          {jobEntries.map((job) => (
            <JobCard key={job.slug} job={job} locale={locale} />
          ))}
        </section>
      )}

      <HowWeHireFooter locale={locale} />
    </div>
  );
}

function JobCard({ job, locale }: { job: CareerEntry; locale: Locale }) {
  return (
    <Link
      href={`/${locale}/careers/${job.slug}`}
      className="block rounded-xl border border-border/40 bg-muted/20 p-6 transition hover:border-border/60 hover:bg-muted/40"
    >
      {job.frontmatter.team && (
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {job.frontmatter.team}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {job.frontmatter.title}
      </h3>
      {job.frontmatter.summary && (
        <p className="mb-3 text-sm text-muted-foreground">
          {job.frontmatter.summary}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {job.frontmatter.employmentType === 'FULL_TIME' && <Tag>Full-time</Tag>}
        {job.frontmatter.employmentType === 'PART_TIME' && <Tag>Part-time</Tag>}
        {job.frontmatter.employmentType === 'INTERN' && <Tag>Internship</Tag>}
        {job.frontmatter.location && <Tag>{job.frontmatter.location}</Tag>}
        <Tag>AI-First</Tag>
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}
