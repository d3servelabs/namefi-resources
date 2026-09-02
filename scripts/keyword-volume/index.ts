#!/usr/bin/env bun
// Fetch measured keyword volume for a set of target queries, per locale.
//
// This exists because the editorial backlog's v0 rank key is
// `expected_clicks = Σ volume × CTR(expected position)` and `volume` is the one
// term nothing in this workspace can currently supply. Wikipedia and HN, which
// the September 2026 slate ranked on, are positive-only momentum signals: their
// silence carries no information. This script replaces them for the volume term.
//
// Usage:
//   bun keywords:volume --dry-run                 # print the requests, no credentials needed
//   bun keywords:volume --in queries.json         # fetch and write results
//   bun keywords:volume --in queries.json --locale zh-CN
//   bun keywords:volume --providers               # what is configured, what is missing
//
// Input JSON: [{ "id": "C036", "en": ["…"], "zh-CN": ["…"] }, …]
// Output JSON: one row per (query, locale) with the measured value or null.
//
// Nothing here ever writes a number it did not receive. A failed request, an
// absent row and an unconfigured provider all produce `null` with a `note`.

import { DataForSeoProvider } from './dataforseo.ts';
import { GoogleAdsProvider } from './googleads.ts';
import { activeProvider, measuredCount, providers as PROVIDERS, toSpecs } from './api.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  if (has('providers')) {
    for (const p of PROVIDERS) {
      const state = p.configured() ? 'CONFIGURED' : `missing ${p.envVars.join(', ')}`;
      console.log(`${p.id.padEnd(14)} ${state}\n  ${p.scope}\n`);
    }
    console.log(
      'Put credentials in ~/ws/d3servelabs/namefi-resources/.env.local (the repo-container root,\n' +
        'not a worktree), so a grep from inside a worktree cannot find them.',
    );
    return;
  }

  const inPath = arg('in');
  if (!inPath && !has('dry-run')) {
    console.error('need --in <queries.json>, or --dry-run, or --providers');
    process.exit(1);
  }

  const input: Record<string, any>[] = inPath
    ? JSON.parse(await Bun.file(inPath).text())
    : [{ id: 'SAMPLE', en: ['domain name registration'], 'zh-CN': ['域名注册'] }];

  const specs = toSpecs(input, arg('locale'));
  const provider = activeProvider({ provider: arg('provider') });

  if (has('dry-run')) {
    console.log(`provider: ${provider.id} (${provider.configured() ? 'configured' : 'NOT configured'})`);
    console.log(`${specs.length} unique (query, locale) pairs\n`);
    if (provider instanceof DataForSeoProvider) {
      console.log(JSON.stringify(provider.buildTasks(specs), null, 2));
    } else if (provider instanceof GoogleAdsProvider) {
      const reqs = provider
        .markets(specs)
        .map((m) => provider.buildRequest(m.specs, m.locale, m.country));
      console.log(JSON.stringify(reqs, null, 2));
    }
    return;
  }

  const results = await provider.fetch(specs);
  const { measured } = measuredCount(results);
  const out = arg('out') ?? 'keyword-volume.json';
  await Bun.write(out, JSON.stringify(results, null, 1));
  console.error(
    `${measured} of ${results.length} rows carry a measured volume; ` +
      `${results.length - measured} are null with a stated reason. -> ${out}`,
  );
}

main();
