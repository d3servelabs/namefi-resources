import Link from 'next/link';
import type { Locale } from '@/i18n-config';

interface HowWeHireFooterProps {
  locale: Locale;
  currentSlug?: string;
}

export function HowWeHireFooter({ locale, currentSlug }: HowWeHireFooterProps) {
  if (currentSlug === 'how-we-hire') return null;

  return (
    <section className="mt-16 rounded-xl border border-border/40 bg-muted/30 px-6 py-8 text-center">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        How We Hire at Namefi
      </h2>
      <p className="mx-auto mb-4 max-w-xl text-sm text-muted-foreground">
        We evaluate every candidate on six dimensions: Values, Expertise,
        Communication, Intelligence, Resource, and Potential. No resume
        gatekeeping, no pedigree filters — just what you can do and who you are.
      </p>
      <Link
        href={`/${locale}/careers/how-we-hire`}
        className="inline-block rounded-lg bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/80"
      >
        Read: How We Hire
      </Link>
    </section>
  );
}
