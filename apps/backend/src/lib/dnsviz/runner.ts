import { randomInt } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  DoHResolver,
  RecordingResolver,
  TYPE,
  type CapturedEntry,
  type WalkResult,
  type WalkStep,
  walk,
} from '@namefi/dnssec-audit';

const DNSSEC_AUDIT_VERSION = 1;
const DEFAULT_QUERY_TYPE = TYPE.A;

export class DnsvizError extends Error {
  constructor(
    message: string,
    public readonly stderr: string = '',
    public readonly exitCode: number | null = null,
  ) {
    super(message);
    this.name = 'DnsvizError';
  }
}

interface DnssecAuditPayload {
  tool: '@namefi/dnssec-audit';
  version: number;
  domain: string;
  qtype: number;
  resolverUrl: string;
  capturedAt: string;
  result: WalkResult;
  responses: CapturedEntry[];
}

interface RunOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

export interface RunDnsvizProbeOptions extends RunOptions {
  threads?: number;
}

export async function runDnsvizProbe(
  domain: string,
  config: { index?: number; opts?: RunDnsvizProbeOptions } = {},
): Promise<unknown> {
  const { opts = {}, index } = config;
  const resolverUrl = pickResolverUrl(index);
  const resolver = new RecordingResolver(new DoHResolver(resolverUrl));
  const normalizedDomain = ensureTrailingDot(domain);

  const result = await withTimeout(
    () => walk(normalizedDomain, DEFAULT_QUERY_TYPE, resolver),
    {
      timeoutMs: opts.timeoutMs ?? 120_000,
      abortSignal: opts.abortSignal,
      label: `DNSSEC audit timed out for ${domain}`,
    },
  );

  return {
    tool: '@namefi/dnssec-audit',
    version: DNSSEC_AUDIT_VERSION,
    domain: normalizedDomain,
    qtype: DEFAULT_QUERY_TYPE,
    resolverUrl,
    capturedAt: new Date().toISOString(),
    result,
    responses: resolver.entries,
  } satisfies DnssecAuditPayload;
}

export interface RunDnsvizGrokOptions extends RunOptions {
  logLevel?: 'error' | 'warning' | 'info';
}

export async function runDnsvizGrok(
  probeJson: unknown,
  opts: RunDnsvizGrokOptions = {},
): Promise<unknown> {
  return await withTimeout(async () => validateAuditPayload(probeJson), {
    timeoutMs: opts.timeoutMs ?? 30_000,
    abortSignal: opts.abortSignal,
    label: 'DNSSEC audit result validation timed out',
  });
}

export type DnsvizGraphType = 'svg' | 'html';

export interface RunDnsvizGraphStreamOptions {
  timeoutMs?: number;
}

export function runDnsvizGraphStream(
  probeJson: unknown,
  format: DnsvizGraphType,
  _opts: RunDnsvizGraphStreamOptions = {},
): Readable {
  return Readable.from([renderAuditGraph(probeJson, format)]);
}

export async function runDnsvizGraphBuffered(
  probeJson: unknown,
  type: DnsvizGraphType,
  _opts: RunDnsvizGraphStreamOptions = {},
): Promise<Buffer> {
  return Buffer.from(renderAuditGraph(probeJson, type), 'utf8');
}

export function dnsvizGraphContentType(type: DnsvizGraphType): string {
  switch (type) {
    case 'svg':
      return 'image/svg+xml';
    case 'html':
      return 'text/html; charset=utf-8';
  }
}

function pickResolverUrl(index: number | undefined): string {
  const resolvers = [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.quad9.net/dns-query',
  ];
  const serverIdx =
    (index ?? randomInt(0, resolvers.length)) % resolvers.length;
  return resolvers[serverIdx];
}

async function withTimeout<T>(
  fn: () => Promise<T>,
  options: { timeoutMs: number; abortSignal?: AbortSignal; label: string },
): Promise<T> {
  if (options.abortSignal?.aborted) {
    throw new DnsvizError('DNSSEC audit aborted');
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortListener: (() => void) | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new DnsvizError(options.label)),
      options.timeoutMs,
    );
    abortListener = () => reject(new DnsvizError('DNSSEC audit aborted'));
    options.abortSignal?.addEventListener('abort', abortListener, {
      once: true,
    });
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
    if (abortListener) {
      options.abortSignal?.removeEventListener('abort', abortListener);
    }
  }
}

function validateAuditPayload(input: unknown): DnssecAuditPayload {
  if (!isRecord(input)) {
    throw new DnsvizError('DNSSEC audit payload is not an object');
  }
  const result = input.result;
  if (!isRecord(result) || typeof result.verdict !== 'string') {
    throw new DnsvizError('DNSSEC audit payload is missing a result verdict');
  }
  return input as unknown as DnssecAuditPayload;
}

function renderAuditGraph(input: unknown, type: DnsvizGraphType): string {
  const payload = validateAuditPayload(input);
  const svg = renderSvg(payload);
  if (type === 'svg') return svg;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(payload.domain)} DNSSEC audit</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #172033; }
    main { max-width: 1120px; margin: 0 auto; padding: 24px; }
    svg { width: 100%; height: auto; display: block; border: 1px solid #d7dde7; border-radius: 8px; background: white; }
    ol { padding-left: 24px; }
    li { margin: 10px 0; }
    code { background: #eef2f7; border-radius: 4px; padding: 2px 4px; }
  </style>
</head>
<body>
  <main>
    ${svg}
    <h2>Audit steps</h2>
    <ol>
      ${payload.result.steps
        .map(
          (step) =>
            `<li><strong>${escapeHtml(step.kind)}</strong> ${escapeHtml(step.zone ?? step.qname ?? '')}<br />${escapeHtml(step.detail)}</li>`,
        )
        .join('\n      ')}
    </ol>
  </main>
</body>
</html>`;
}

function renderSvg(payload: DnssecAuditPayload): string {
  const result = payload.result;
  const steps = result.steps.length > 0 ? result.steps : [fallbackStep(result)];
  const width = 1000;
  const rowHeight = 64;
  const height = 174 + steps.length * rowHeight;
  const verdict = result.verdict;
  const color = colorForVerdict(verdict);

  const rows = steps
    .map((step, index) => {
      const y = 132 + index * rowHeight;
      const stateColor = step.ok ? '#166534' : '#b42318';
      const label = step.zone ?? step.qname ?? payload.domain;
      return `
  <g transform="translate(32 ${y})">
    <circle cx="16" cy="16" r="12" fill="${stateColor}" />
    <text x="40" y="10" fill="#172033" font-size="16" font-weight="700">${escapeXml(step.kind)} ${escapeXml(label)}</text>
    <text x="40" y="34" fill="#475467" font-size="13">${escapeXml(truncate(step.detail, 128))}</text>
  </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="DNSSEC audit graph for ${escapeXml(payload.domain)}">
  <rect width="${width}" height="${height}" fill="#f8fafc" />
  <rect x="24" y="24" width="${width - 48}" height="84" rx="8" fill="#ffffff" stroke="#d7dde7" />
  <text x="44" y="58" fill="#172033" font-size="24" font-weight="700">${escapeXml(payload.domain)}</text>
  <text x="44" y="84" fill="#475467" font-size="14">DNSSEC audit generated from @namefi/dnssec-audit</text>
  <rect x="${width - 260}" y="44" width="216" height="36" rx="18" fill="${color}" />
  <text x="${width - 152}" y="67" fill="#ffffff" font-size="14" font-weight="700" text-anchor="middle">${escapeXml(verdict)}</text>
${rows}
</svg>`;
}

function fallbackStep(result: WalkResult): WalkStep {
  return {
    kind: 'note',
    ok: result.verdict !== 'bogus',
    detail: result.detail,
    qname: result.qname,
  };
}

function colorForVerdict(verdict: WalkResult['verdict']): string {
  switch (verdict) {
    case 'secure-positive':
    case 'secure-nodata':
    case 'secure-nxdomain':
      return '#15803d';
    case 'insecure':
      return '#667085';
    case 'bogus':
      return '#b42318';
  }
}

function ensureTrailingDot(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength - 3)}...`;
}

function escapeHtml(input: string): string {
  return escapeXml(input);
}

function escapeXml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
