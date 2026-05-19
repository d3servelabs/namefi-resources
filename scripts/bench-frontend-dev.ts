#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Timing = {
  totalMs: number;
  primaryMs: number;
  secondaryMs: number;
  primaryLabel: string;
  secondaryLabel: string;
  raw: string;
};

type RouteResult = Record<string, Timing | null>;

type RunResult = {
  cold: RouteResult;
  hot: RouteResult;
  logPath: string;
};

type Options = {
  runs: number;
  routes: string[];
  baseUrl: string;
  devCmd: string;
  timeoutMs: number;
  phaseTimeoutMs: number;
  outputDir: string;
  outputFile: string;
  logDevOutput: boolean;
};

type AverageTiming = {
  totalMs: number | null;
  primaryMs: number | null;
  secondaryMs: number | null;
  primaryLabel: string;
  secondaryLabel: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const appDir = path.join(projectRoot, 'apps', 'frontend');

const DEFAULT_ROUTES = ['/', '/domains', '/studio'];
const DEFAULT_PRIMARY_LABEL = 'Next.js';
const DEFAULT_SECONDARY_LABEL = 'Application code';

function parseArgs(argv: string[]): Partial<Options> {
  const args: Partial<Options> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg === '--runs') {
      args.runs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--routes') {
      const value = argv[i + 1] ?? '';
      args.routes = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
    } else if (arg === '--base-url') {
      args.baseUrl = argv[i + 1];
      i += 1;
    } else if (arg === '--dev-cmd') {
      args.devCmd = argv[i + 1];
      i += 1;
    } else if (arg === '--timeout-ms') {
      args.timeoutMs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--phase-timeout-ms') {
      args.phaseTimeoutMs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--output') {
      args.outputFile = argv[i + 1];
      i += 1;
    } else if (arg === '--log-dev-output') {
      args.logDevOutput = true;
    }
  }
  return args;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseTimeToMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed.replace('ms', ''));
  }
  if (trimmed.endsWith('s')) {
    return Number.parseFloat(trimmed.replace('s', '')) * 1000;
  }
  return Number.isFinite(Number(trimmed)) ? Number(trimmed) : null;
}

function formatMs(ms: number | null, unit: 'ms' | 's') {
  if (ms === null || Number.isNaN(ms)) return 'n/a';
  if (unit === 's') {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(child: ReturnType<typeof spawn>, timeoutMs: number) {
  return await new Promise<boolean>((resolve) => {
    if (child.exitCode !== null) {
      resolve(true);
      return;
    }
    const timer = setTimeout(() => resolve(false), timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function killProcessTree(
  child: ReturnType<typeof spawn>,
  signal: NodeJS.Signals,
) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    child.kill(signal);
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

async function waitForReady(
  lines: string[],
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
) {
  const start = Date.now();
  const readyRegex = /Local:|Ready in|started server|Ready on/;
  const failedRegex = /Failed to start server/;

  while (Date.now() - start < timeoutMs) {
    const recent = lines.slice(-20);
    if (recent.some((line) => readyRegex.test(line))) return;
    if (recent.some((line) => failedRegex.test(line))) {
      throw new Error('Dev server failed to start');
    }
    if (child.exitCode !== null) {
      throw new Error(`Dev server exited early with code ${child.exitCode}`);
    }
    await sleep(500);
  }
  throw new Error('Timed out waiting for dev server readiness');
}

async function waitForRoutes(
  lines: string[],
  routes: string[],
  startIndex: number,
  timeoutMs: number,
) {
  const remaining = new Set(routes);
  const regexes = new Map(
    routes.map((route) => [
      route,
      new RegExp(`GET\\s+${escapeRegExp(route)}\\s+\\d+\\s+in\\s+`),
    ]),
  );

  let cursor = startIndex;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    while (cursor < lines.length) {
      const line = lines[cursor] ?? '';
      for (const route of Array.from(remaining)) {
        const regex = regexes.get(route);
        if (regex && regex.test(line)) {
          remaining.delete(route);
        }
      }
      cursor += 1;
    }
    if (remaining.size === 0) return cursor;
    await sleep(200);
  }

  throw new Error(
    `Timed out waiting for routes: ${Array.from(remaining).join(', ')}`,
  );
}

function parseTimingLine(line: string, route: string): Timing | null {
  const routePattern = escapeRegExp(route);
  const match = line.match(
    new RegExp(
      `GET\\s+${routePattern}\\s+\\d+\\s+in\\s+([^\\s]+)\\s+\\(([^)]+)\\)`,
      'i',
    ),
  );
  if (!match) {
    return null;
  }

  const totalMs = parseTimeToMs(match[1] ?? '');
  const phaseTimings = new Map<string, number>();
  for (const phase of (match[2] ?? '').split(',')) {
    const [rawLabel, rawValue] = phase.split(':');
    if (!rawLabel || !rawValue) {
      continue;
    }
    const parsedValue = parseTimeToMs(rawValue);
    if (parsedValue === null) {
      continue;
    }
    phaseTimings.set(rawLabel.trim().toLowerCase(), parsedValue);
  }
  const primaryMs = phaseTimings.get('next.js') ?? null;
  const secondaryMs = phaseTimings.get('application-code') ?? null;

  if (totalMs === null || primaryMs === null || secondaryMs === null) {
    return null;
  }

  return {
    totalMs,
    primaryMs,
    secondaryMs,
    primaryLabel: DEFAULT_PRIMARY_LABEL,
    secondaryLabel: DEFAULT_SECONDARY_LABEL,
    raw: line.trim(),
  };
}

export function parseSegment(lines: string[], routes: string[]): RouteResult {
  const result: RouteResult = Object.fromEntries(
    routes.map((route) => [route, null]),
  );

  for (const route of routes) {
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i] ?? '';
      const timing = parseTimingLine(line, route);
      if (timing) {
        result[route] = timing;
        break;
      }
    }
  }

  return result;
}

export function averageTimings(results: RouteResult[]) {
  const averages: Record<string, AverageTiming> = {};

  const allRoutes = new Set<string>();
  for (const result of results) {
    for (const route of Object.keys(result)) {
      allRoutes.add(route);
    }
  }

  for (const route of allRoutes) {
    const totals: number[] = [];
    const primary: number[] = [];
    const secondary: number[] = [];
    let primaryLabel = DEFAULT_PRIMARY_LABEL;
    let secondaryLabel = DEFAULT_SECONDARY_LABEL;

    for (const result of results) {
      const timing = result[route];
      if (!timing) continue;
      totals.push(timing.totalMs);
      primary.push(timing.primaryMs);
      secondary.push(timing.secondaryMs);
      primaryLabel = timing.primaryLabel;
      secondaryLabel = timing.secondaryLabel;
    }

    const avg = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

    averages[route] = {
      totalMs: avg(totals),
      primaryMs: avg(primary),
      secondaryMs: avg(secondary),
      primaryLabel,
      secondaryLabel,
    };
  }

  return averages;
}

function resolveRouteLabels(results: RouteResult) {
  for (const timing of Object.values(results)) {
    if (!timing) continue;
    return {
      primaryLabel: timing.primaryLabel,
      secondaryLabel: timing.secondaryLabel,
    };
  }

  return {
    primaryLabel: DEFAULT_PRIMARY_LABEL,
    secondaryLabel: DEFAULT_SECONDARY_LABEL,
  };
}

function resolveAverageLabels(averages: Record<string, AverageTiming>) {
  for (const timing of Object.values(averages)) {
    return {
      primaryLabel: timing.primaryLabel,
      secondaryLabel: timing.secondaryLabel,
    };
  }

  return {
    primaryLabel: DEFAULT_PRIMARY_LABEL,
    secondaryLabel: DEFAULT_SECONDARY_LABEL,
  };
}

async function requestRoute(baseUrl: string, route: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}${route}`);
      if (response.status === 200 || response.status === 304) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(`Timed out requesting route ${route}`);
}

async function hitRoutes(baseUrl: string, routes: string[], timeoutMs: number) {
  for (const route of routes) {
    await requestRoute(baseUrl, route, timeoutMs);
  }
}

async function runOnce(index: number, options: Options): Promise<RunResult> {
  await fs.rm(path.join(appDir, '.next'), { recursive: true, force: true });

  const logLines: string[] = [];
  let buffer = '';

  const logPath = path.join(
    options.outputDir,
    `run-${index.toString().padStart(2, '0')}.log`,
  );

  const child = spawn(options.devCmd, {
    shell: true,
    cwd: appDir,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const onChunk = (chunk: Buffer) => {
    buffer += chunk.toString();
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      logLines.push(line.replace(/\r$/, ''));
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');
    }
  };

  const onStdout = (chunk: Buffer) => {
    if (options.logDevOutput) {
      process.stdout.write(chunk);
    }
    onChunk(chunk);
  };

  const onStderr = (chunk: Buffer) => {
    if (options.logDevOutput) {
      process.stderr.write(chunk);
    }
    onChunk(chunk);
  };

  child.stdout?.on('data', onStdout);
  child.stderr?.on('data', onStderr);

  try {
    await waitForReady(logLines, child, options.timeoutMs);

    const coldStart = logLines.length;
    await hitRoutes(options.baseUrl, options.routes, options.phaseTimeoutMs);
    const coldEnd = await waitForRoutes(
      logLines,
      options.routes,
      coldStart,
      options.phaseTimeoutMs,
    );

    const hotStart = logLines.length;
    await hitRoutes(options.baseUrl, options.routes, options.phaseTimeoutMs);
    const hotEnd = await waitForRoutes(
      logLines,
      options.routes,
      hotStart,
      options.phaseTimeoutMs,
    );

    const cold = parseSegment(
      logLines.slice(coldStart, coldEnd),
      options.routes,
    );
    const hot = parseSegment(logLines.slice(hotStart, hotEnd), options.routes);

    if (buffer.length > 0) {
      logLines.push(buffer.replace(/\r$/, ''));
      buffer = '';
    }
    await fs.writeFile(logPath, logLines.join('\n'));

    return { cold, hot, logPath };
  } catch (error) {
    if (buffer.length > 0) {
      logLines.push(buffer.replace(/\r$/, ''));
      buffer = '';
    }
    await fs.writeFile(logPath, logLines.join('\n'));
    throw error;
  } finally {
    killProcessTree(child, 'SIGTERM');
    const exited = await waitForExit(child, 5000);
    if (!exited || child.exitCode === null) {
      killProcessTree(child, 'SIGKILL');
      await waitForExit(child, 5000);
    }
  }
}

function renderTable(results: RouteResult, unit: 's' | 'ms') {
  const labels = resolveRouteLabels(results);
  const lines: string[] = [];
  lines.push(
    `| Route | Total | ${labels.primaryLabel} | ${labels.secondaryLabel} |`,
  );
  lines.push('| --- | --- | --- | --- |');
  for (const [route, timing] of Object.entries(results)) {
    if (!timing) {
      lines.push(`| ${route} | n/a | n/a | n/a |`);
      continue;
    }
    lines.push(
      `| ${route} | ${formatMs(timing.totalMs, unit)} | ${formatMs(
        timing.primaryMs,
        unit,
      )} | ${formatMs(timing.secondaryMs, unit)} |`,
    );
  }
  return lines.join('\n');
}

export function renderAverages(
  cold: ReturnType<typeof averageTimings>,
  hot: ReturnType<typeof averageTimings>,
) {
  const routes = new Set([...Object.keys(cold), ...Object.keys(hot)]);
  const coldLabels =
    Object.keys(cold).length > 0
      ? resolveAverageLabels(cold)
      : resolveAverageLabels(hot);
  const hotLabels =
    Object.keys(hot).length > 0
      ? resolveAverageLabels(hot)
      : resolveAverageLabels(cold);
  const lines: string[] = [];
  lines.push(
    `| Route | Cold total | Cold ${coldLabels.primaryLabel} | Cold ${coldLabels.secondaryLabel} | Hot total | Hot ${hotLabels.primaryLabel} | Hot ${hotLabels.secondaryLabel} |`,
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const route of routes) {
    const coldTiming = cold[route];
    const hotTiming = hot[route];
    lines.push(
      `| ${route} | ${formatMs(coldTiming?.totalMs ?? null, 's')} | ${formatMs(
        coldTiming?.primaryMs ?? null,
        's',
      )} | ${formatMs(coldTiming?.secondaryMs ?? null, 'ms')} | ${formatMs(
        hotTiming?.totalMs ?? null,
        'ms',
      )} | ${formatMs(hotTiming?.primaryMs ?? null, 'ms')} | ${formatMs(
        hotTiming?.secondaryMs ?? null,
        'ms',
      )} |`,
    );
  }
  return lines.join('\n');
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');

  const args = parseArgs(process.argv.slice(2));
  const runs = args.runs ?? 3;
  const routes = args.routes ?? DEFAULT_ROUTES;
  const baseUrl = args.baseUrl ?? 'https://localhost:5050';
  const devCmd =
    args.devCmd ??
    '../../node_modules/.bin/infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun dev -- --experimental-https';
  const outputDir = path.join(appDir, '.benchmarks');
  await fs.mkdir(outputDir, { recursive: true });
  const outputFile =
    args.outputFile ?? path.join(outputDir, `next-dev-bench-${timestamp}.md`);

  const options: Options = {
    runs,
    routes,
    baseUrl,
    devCmd,
    timeoutMs: args.timeoutMs ?? 180_000,
    phaseTimeoutMs: args.phaseTimeoutMs ?? 600_000,
    outputDir,
    outputFile,
    logDevOutput: args.logDevOutput ?? false,
  };

  const machine = {
    os: `${os.platform()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()?.[0]?.model ?? 'unknown',
    cores: os.cpus()?.length ?? 0,
    ramGb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
    node: process.versions.node ?? 'unknown',
    bun: typeof Bun !== 'undefined' ? Bun.version : 'n/a',
  };

  const runResults: RunResult[] = [];
  for (let i = 1; i <= runs; i += 1) {
    const result = await runOnce(i, options);
    runResults.push(result);
  }

  const coldAvg = averageTimings(runResults.map((result) => result.cold));
  const hotAvg = averageTimings(runResults.map((result) => result.hot));

  const lines: string[] = [];
  lines.push('# Next.js Dev Cold/Hot Benchmark');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('## Settings');
  lines.push(`- Runs: ${runs}`);
  lines.push(`- Base URL: ${baseUrl}`);
  lines.push(`- Routes: ${routes.join(', ')}`);
  lines.push(`- Dev command: \`${devCmd}\``);
  lines.push(`- Ready timeout: ${Math.round(options.timeoutMs / 1000)}s`);
  lines.push(`- Phase timeout: ${Math.round(options.phaseTimeoutMs / 1000)}s`);
  lines.push('');
  lines.push('## Machine');
  lines.push(`- OS: ${machine.os}`);
  lines.push(`- CPU: ${machine.cpu}`);
  lines.push(`- Cores: ${machine.cores}`);
  lines.push(`- RAM: ${machine.ramGb} GB`);
  lines.push(`- Node: ${machine.node}`);
  lines.push(`- Bun: ${machine.bun}`);
  lines.push('');
  lines.push('## Averages');
  lines.push(renderAverages(coldAvg, hotAvg));
  lines.push('');

  runResults.forEach((result, index) => {
    lines.push(`## Run ${index + 1}`);
    lines.push('');
    lines.push('### Cold');
    lines.push(renderTable(result.cold, 's'));
    lines.push('');
    lines.push('### Hot');
    lines.push(renderTable(result.hot, 'ms'));
    lines.push('');
    lines.push(`Log: \`${path.relative(projectRoot, result.logPath)}\``);
    lines.push('');
  });

  await fs.writeFile(outputFile, `${lines.join('\n')}\n`);
  console.log(`Benchmark report written to ${outputFile}`);
  process.exit(0);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
