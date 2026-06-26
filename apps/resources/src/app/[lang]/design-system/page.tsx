import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { i18n, type Locale } from '@/i18n-config';

// Internal visual reference — never indexed. It documents the design tokens and
// component variants so humans and LLM agents building Resources UI reuse the
// system instead of inventing one-off styles. English-only by design (the
// resources app is out of scope for the i18n hardcoding rules).
export const metadata: Metadata = {
  title: 'Design System — Namefi Resources',
  description:
    'Visual reference for the colors, typography, spacing, and components used across the Namefi Resources site.',
  robots: { index: false, follow: false },
};

type ColorToken = {
  /** CSS custom property name as authored in globals.css. */
  readonly name: string;
  /** The resolved value (for documentation; the swatch reads the live var). */
  readonly value: string;
  readonly note?: string;
  /** Semi-transparent tokens render over a checkerboard so alpha is visible. */
  readonly alpha?: boolean;
};

const COLOR_TOKENS: readonly ColorToken[] = [
  { name: '--background', value: 'oklch(0.145 0 0)', note: 'page canvas' },
  { name: '--foreground', value: 'oklch(0.985 0 0)', note: 'body text' },
  { name: '--card', value: 'oklch(0.205 0 0)', note: 'raised surface' },
  { name: '--primary', value: 'var(--brand-primary)', note: 'primary action' },
  {
    name: '--primary-foreground',
    value: 'oklch(0.205 0 0)',
    note: 'on primary',
  },
  { name: '--secondary', value: 'oklch(0.269 0 0)' },
  { name: '--muted', value: 'oklch(0.269 0 0)' },
  { name: '--muted-foreground', value: 'oklch(0.708 0 0)', note: 'captions' },
  { name: '--accent', value: 'oklch(0.269 0 0)' },
  { name: '--destructive', value: 'oklch(0.704 0.191 22.216)', note: 'danger' },
  { name: '--border', value: 'oklch(1 0 0 / 10%)', alpha: true },
  { name: '--ring', value: 'oklch(0.556 0 0)', note: 'focus ring' },
  {
    name: '--brand-primary',
    value: 'oklch(0.7585 0.1804 155.5)',
    note: 'Namefi green',
  },
  { name: '--chart-1', value: 'oklch(0.488 0.243 264.376)' },
  { name: '--chart-2', value: 'oklch(0.696 0.17 162.48)' },
  { name: '--chart-3', value: 'oklch(0.769 0.188 70.08)' },
  { name: '--chart-4', value: 'oklch(0.627 0.265 303.9)' },
  { name: '--chart-5', value: 'oklch(0.645 0.246 16.439)' },
];

const BUTTON_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const;

const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const;

const TYPE_SCALE = [
  {
    label: 'Display',
    className: 'text-4xl font-bold tracking-tight',
    sample: 'Own your name onchain',
  },
  {
    label: 'Heading 2',
    className: 'text-2xl font-semibold tracking-tight',
    sample: 'Domains, decentralized',
  },
  {
    label: 'Heading 3',
    className: 'text-xl font-semibold',
    sample: 'A section heading',
  },
  {
    label: 'Body',
    className: 'text-base',
    sample: 'The quick brown fox registers example.eth onchain.',
  },
  {
    label: 'Small',
    className: 'text-sm text-muted-foreground',
    sample: 'Muted caption text for metadata and timestamps.',
  },
  {
    label: 'Mono',
    className: 'font-mono text-sm',
    sample: 'const domain = "namefi.io";',
  },
] as const;

const RADIUS_SCALE = [
  { label: 'sm', className: 'rounded-sm' },
  { label: 'md', className: 'rounded-md' },
  { label: 'lg', className: 'rounded-lg' },
  { label: 'xl', className: 'rounded-xl' },
  { label: '2xl', className: 'rounded-2xl' },
  { label: 'full', className: 'rounded-full' },
] as const;

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-16 scroll-mt-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl tracking-tight">{title}</h2>
        <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Namefi · Resources
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Design System
        </h1>
        <p className="mt-3 max-w-[64ch] text-lg text-muted-foreground">
          The single source of visual truth for the Resources site — colors,
          type, spacing, and components. Built so humans and LLM agents stay
          consistent: use these tokens and component variants instead of
          inventing one-off styles.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-chart-3" aria-hidden />
          Internal reference page — noindex, nofollow
        </span>
      </header>

      {/* Primary action: solid green was too loud → quiet outline treatment.
          The "Outline" sample is the real <Button>, restyled by the scoped
          override in globals.css. */}
      <Section
        eyebrow="Primary action"
        title="A quiet, on-brand primary"
        description={
          <>
            The primary maps to the Namefi brand green (
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              --primary: var(--brand-primary)
            </code>
            ), but a solid fill shouts on a content page. So the primary renders
            as an <strong>outline</strong> — transparent fill, green border and
            label, a faint green wash on hover. On-brand, yet it lets the
            writing lead. One primary action per view; the rest are secondary or
            ghost.
          </>
        }
      >
        <div className="flex flex-wrap items-stretch gap-4">
          <figure className="flex flex-1 basis-56 flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <figcaption className="flex items-center justify-between text-sm">
              <span className="font-semibold">Solid fill</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                Too vocal
              </span>
            </figcaption>
            <div
              className="flex h-10 items-center justify-center rounded-md text-sm font-medium"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              Start exploring
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              Competes with the content.
            </p>
          </figure>

          <figure className="flex flex-1 basis-56 flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <figcaption className="flex items-center justify-between text-sm">
              <span className="font-semibold">Outline</span>
              <span className="rounded-full border border-brand-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand-primary">
                Now
              </span>
            </figcaption>
            <Button className="h-10">Start exploring</Button>
            <p className="m-0 text-xs text-muted-foreground">
              On-brand, calm — lets content lead.
            </p>
          </figure>

          <figure className="flex flex-1 basis-56 flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <figcaption className="flex items-center justify-between text-sm">
              <span className="font-semibold">Soft tint</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                Alt
              </span>
            </figcaption>
            <div
              className="flex h-10 items-center justify-center rounded-md border text-sm font-medium"
              style={{
                background:
                  'color-mix(in oklab, var(--primary) 14%, transparent)',
                color: 'var(--primary)',
                borderColor:
                  'color-mix(in oklab, var(--primary) 30%, transparent)',
              }}
            >
              Start exploring
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              A filled-but-muted middle ground.
            </p>
          </figure>
        </div>
      </Section>

      {/* Color tokens. */}
      <Section
        eyebrow="Foundations"
        title="Color tokens"
        description={
          <>
            Every color is a CSS variable from{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              packages/ui/src/styles/globals.css
            </code>
            . Reference the token (
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              bg-primary
            </code>
            ,{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              text-muted-foreground
            </code>
            ) — never a raw hex.
          </>
        }
      >
        <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 p-0">
          {COLOR_TOKENS.map((token) => (
            <li
              key={token.name}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div
                className="h-16 border-b border-border"
                // For semi-transparent tokens, layer the color *over* a
                // checkerboard (two background-image layers) so the alpha is
                // visible; opaque tokens get a plain solid fill.
                style={
                  token.alpha
                    ? {
                        backgroundImage: `linear-gradient(var(${token.name}), var(${token.name})), repeating-conic-gradient(#333 0% 25%, transparent 0% 50%)`,
                        backgroundSize: '100% 100%, 14px 14px',
                      }
                    : { backgroundColor: `var(${token.name})` }
                }
                aria-hidden
              />
              <div className="px-3 py-2">
                <p className="font-mono text-[13px] font-semibold">
                  {token.name}
                </p>
                <p className="mt-0.5 break-all text-[11px] text-muted-foreground">
                  {token.note ? `${token.note} · ` : ''}
                  {token.value}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Typography. */}
      <Section
        eyebrow="Foundations"
        title="Typography"
        description={
          <>
            Body and headings use <strong>Geist Sans</strong>; code uses{' '}
            <strong>Geist Mono</strong>.
          </>
        }
      >
        <div className="divide-y divide-border">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3"
            >
              <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                {row.label}
              </span>
              <span className={row.className}>{row.sample}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons. */}
      <Section
        eyebrow="Components"
        title="Buttons"
        description={
          <>
            Variants map 1:1 to the{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              &lt;Button&gt;
            </code>{' '}
            in{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              @namefi-astra/ui
            </code>
            . These render the real component, so this page always reflects the
            shipped styles.
          </>
        }
      >
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button disabled>disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size}>
                {size}
              </Button>
            ))}
          </div>
        </div>
      </Section>

      {/* Surfaces & badges. */}
      <Section
        eyebrow="Components"
        title="Surfaces and badges"
        description={
          <>
            Cards use the{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              .surface-card
            </code>{' '}
            utility; inputs share the radius, border, and focus-ring tokens.
          </>
        }
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <div className="surface-card">
            <h3 className="text-base font-semibold">Onchain ownership</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your domain is an NFT you fully control — transfer, list, or build
              on it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Verified
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Draft
              </span>
              <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                Expiring
              </span>
            </div>
          </div>
          <div className="surface-card">
            <h3 className="text-base font-semibold">Form input</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Inputs share the design tokens.
            </p>
            <label className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
              Search a domain
              <input
                className="h-9 rounded-md border border-input bg-input/30 px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/40"
                placeholder="example.io"
              />
            </label>
          </div>
          <div className="surface-card">
            <h3 className="text-base font-semibold">Call to action</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A card can host the primary action — it inherits the brand-green
              primary.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button>Get started</Button>
              <Button variant="ghost">Later</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Radius. */}
      <Section
        eyebrow="Foundations"
        title="Radius"
        description={
          <>
            Derived from{' '}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
              --radius: 0.65rem
            </code>
            . Use the scale; don&apos;t hand-pick pixel radii.
          </>
        }
      >
        <div className="flex flex-wrap gap-4">
          {RADIUS_SCALE.map((radius) => (
            <div
              key={radius.label}
              className="text-center text-xs text-muted-foreground"
            >
              <div
                className={`mb-2 size-16 border border-border bg-secondary ${radius.className}`}
              />
              {radius.label}
            </div>
          ))}
        </div>
      </Section>

      {/* Guidance. */}
      <Section
        eyebrow="How to stay consistent"
        title="Rules for humans and agents"
        description="When adding UI to Resources, follow these. They mirror the repo's CLAUDE.md and rulesync rules."
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {[
            {
              title: 'Color',
              items: [
                'Use tokens (bg-primary, text-muted-foreground, border-border) — never hard-coded hex/oklch.',
                'One primary action per view; the rest are secondary / ghost.',
              ],
            },
            {
              title: 'Components',
              items: [
                'Reuse @namefi-astra/ui primitives before writing new ones.',
                'Match an existing variant; add a new one only on real reuse.',
                'Keep "use client" at the leaf.',
              ],
            },
            {
              title: 'RTL & spacing',
              items: [
                'Logical CSS only: ms/me, ps/pe, start/end — never left/right.',
                'Use gap, not space-x, on flex/grid. Spacing in 4px steps.',
              ],
            },
            {
              title: 'Minimal chrome',
              items: [
                'No divider/background/shadow unless it solves a named problem.',
                'Prefer space over lines; don’t block the content area.',
              ],
            },
          ].map((group) => (
            <div
              key={group.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
              <ul className="m-0 flex list-disc flex-col gap-2 ps-5">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
