/**
 * Generates `docs/product/critical-user-journeys.md` from the typed CUJ registry.
 *
 * The doc is GENERATED — edit `packages/cuj/src/registry.ts`, then run:
 *   bun --cwd packages/cuj gen:doc      (or: bun run packages/cuj/scripts/generate-cuj-doc.ts)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AREA_ORDER,
  type Cuj,
  type CujArea,
  type CujStatus,
  CUJS,
  cujsByArea,
  PERSONAS,
} from '../src/registry';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../../../docs/product/critical-user-journeys.md');

const STATUS_BADGE: Record<CujStatus, string> = {
  live: '🟢 live',
  partial: '🟡 partial',
  draft: '📝 draft',
  deprecated: '⚠️ deprecated',
};

const AREA_TITLE: Record<CujArea, string> = {
  Owner: 'Owner Core — shared journey library (not a persona)',
  Trader: 'Domain Trader — signature journeys (profit-driven)',
  Collector: 'Domain Collector — signature journeys (emotion-driven)',
  DAO: 'DAO / Org Controller — signature journeys (multi-sig)',
  PBN: 'Powered-by-Namefi Partner',
  Dev: 'Developer / Integrator',
  Visitor: 'Visitor (SEO / top-of-funnel)',
  Admin: 'Admin / Operator (internal)',
  Hunter: 'Hunter — DEPRECATED (feature being retired)',
};

const cell = (v?: readonly string[]) =>
  v?.length ? v.map((s) => `\`${s}\``).join(', ') : '—';

const titleCell = (c: Cuj) =>
  c.status === 'deprecated' ? `~~${c.title}~~` : c.title;

const areaSection = (area: CujArea): string => {
  const rows = cujsByArea(area);
  if (!rows.length) return '';
  const lines = [
    `### ${AREA_TITLE[area]}`,
    '',
    '| ID | Journey | Status | Routes | Routers / API | Workflow | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (c) =>
        `| \`${c.id}\` | ${titleCell(c)} | ${STATUS_BADGE[c.status]} | ${cell(c.routes)} | ${cell(c.routers)} | ${c.workflow ? `\`${c.workflow}\`` : '—'} | ${c.notes ?? '—'} |`,
    ),
    '',
  ];
  return lines.join('\n');
};

const personaOverview = (): string => {
  const lines = [
    '## Personas',
    '',
    '| Persona | Motivation | Journeys |',
    '| --- | --- | --- |',
    ...PERSONAS.map((p) => {
      const label = p.deprecated ? `~~${p.label}~~ (deprecated)` : p.label;
      const areas = p.includes.map((a) => `\`${a}.*\``).join(' + ');
      return `| ${label} | ${p.motivation} | ${areas} |`;
    }),
    '',
  ];
  return lines.join('\n');
};

const summary = (): string => {
  const counts = CUJS.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
  const order: CujStatus[] = ['live', 'partial', 'draft', 'deprecated'];
  return order
    .filter((s) => counts[s])
    .map((s) => `${STATUS_BADGE[s]} ${counts[s]}`)
    .join(' · ');
};

const TRAILING_BLANK_LINES = /\n+$/;

const main = async () => {
  const body = [
    '<!-- GENERATED FILE — do not edit by hand.',
    '     Source of truth: packages/cuj/src/registry.ts',
    '     Regenerate: bun --cwd packages/cuj gen:doc -->',
    '',
    '# Namefi Astra — Critical User Journeys (CUJ)',
    '',
    "Canonical catalog of the product's critical user journeys. Each journey has a",
    'stable, hierarchical id (`CUJ-<Area>.<n>`) used as the join key across this doc,',
    'e2e test tags, `data-cuj` markers, and the preview-recording generator.',
    '',
    `**Inventory:** ${summary()} (total ${CUJS.length})`,
    '',
    '`Owner` is a shared journey library (the mechanics every owner performs), not a',
    'persona. The Trader, Collector and DAO personas all reference it, so shared',
    'journeys are defined exactly once. Ids are append-only: retired journeys are',
    'marked deprecated, never deleted or renumbered.',
    '',
    personaOverview(),
    '## Journeys by area',
    '',
    ...AREA_ORDER.map(areaSection),
  ].join('\n');

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${body.replace(TRAILING_BLANK_LINES, '')}\n`, 'utf8');
};

await main();
