/**
 * Thin wrapper around the `dnsviz` CLI. Intentionally has no Temporal, DB,
 * or HTTP dependencies so it can be unit-tested in isolation.
 *
 * `dnsviz` reads input from stdin via `-r -` and writes binary output to
 * stdout via `-o -` (verified on macOS local + Debian runtime image).
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomInt } from 'node:crypto';
import type { Readable } from 'node:stream';

const DEFAULT_BIN = process.env.DNSVIZ_BIN ?? 'dnsviz';

/**
 * Path to a DNSSEC root trust-anchor file (DNSKEY records in zone-file
 * format). When set, passed to `dnsviz grok` and `dnsviz graph` as
 * `-t <file>` so validation chains back to the trusted root key.
 *
 * - In the deployed Docker image: defaults to `/usr/share/dns/root.key`,
 *   provided by Debian's `dns-root-data` package (set via ENV in the
 *   Dockerfile). That package ships the IANA-signed root key and is
 *   updated through normal apt channels when the root key rotates.
 * - For local dev on Homebrew dnsviz: leave unset — the Homebrew formula
 *   bundles a TA at a path dnsviz finds via its own default lookup.
 *
 * Without a trust anchor, `delegation.status` from dnsviz can mislead:
 * it'll say SECURE based on local chain integrity but won't actually
 * have validated up to the root.
 */
const TRUSTED_KEYS_FILE = process.env.DNSVIZ_TRUSTED_KEYS_FILE;

/**
 * Append `--trusted-keys-file <file>` to the command line. dnsviz overloads
 * the short flag `-t`: it means `--threads` for `probe` but
 * `--trusted-keys-file` for `grok` and `graph`. We use the long form here
 * to remove that ambiguity at the call site.
 */
function withTrustAnchor(args: string[]): string[] {
  if (!TRUSTED_KEYS_FILE) return args;
  return [...args, '--trusted-keys-file', TRUSTED_KEYS_FILE];
}

export class DnsvizError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
    public readonly exitCode: number | null,
  ) {
    super(message);
    this.name = 'DnsvizError';
  }
}

interface RunOptions {
  timeoutMs: number;
  abortSignal?: AbortSignal;
}

/**
 * Spawn dnsviz with optional stdin and collect stdout/stderr. Used by the
 * one-shot probe/grok callers; the streaming `runDnsvizGraphStream` does its
 * own spawn because it returns a stream rather than an awaited string.
 */
async function runWithBufferedOutput(
  args: string[],
  stdin: string | null,
  { timeoutMs, abortSignal }: RunOptions,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(DEFAULT_BIN, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      abortSignal?.removeEventListener('abort', onAbort);
      fn();
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle(() =>
        reject(
          new DnsvizError(
            `dnsviz timed out after ${timeoutMs}ms (${args.join(' ')})`,
            stderr,
            null,
          ),
        ),
      );
    }, timeoutMs);

    const onAbort = () => {
      child.kill('SIGTERM');
      settle(() => reject(new DnsvizError('dnsviz aborted', stderr, null)));
    };
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d: string) => {
      stdout += d;
    });
    child.stderr.on('data', (d: string) => {
      stderr += d;
    });

    child.on('error', (err) => {
      settle(() =>
        reject(
          new DnsvizError(
            `failed to spawn dnsviz: ${err.message}`,
            stderr,
            null,
          ),
        ),
      );
    });

    child.on('close', (code) => {
      settle(() => {
        if (code === 0) {
          resolve({ stdout, stderr });
          return;
        }
        reject(
          new DnsvizError(
            `dnsviz exited with code ${code} (${args.join(' ')})`,
            stderr,
            code,
          ),
        );
      });
    });

    if (stdin !== null) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

export interface RunDnsvizProbeOptions {
  timeoutMs?: number;
  threads?: number;
  abortSignal?: AbortSignal;
}

/**
 * Run `dnsviz probe -t <threads> <domain>` and return the parsed JSON
 * (the diagnostic queries blob that `grok` and `graph` consume).
 */
export async function runDnsvizProbe(
  domain: string,
  config: { index?: number; opts?: RunDnsvizProbeOptions } = {},
): Promise<unknown> {
  const { opts = {}, index } = config;

  const dnsResolvers = [
    //Google
    '8.8.8.8,8.8.4.4',

    //Quad9
    '9.9.9.9,149.112.112.112',

    '9.9.9.10,149.112.112.10',

    '9.9.9.11,149.112.112.11',

    //Cloudflare
    '1.1.1.1,1.0.0.1',

    '1.1.1.2,1.0.0.2',

    '1.1.1.3,1.0.0.3',

    //OpenDNS
    '208.67.222.222,208.67.220.220',
    '208.67.222.123,208.67.220.123',

    // //AdGuard
    // '94.140.14.14,94.140.15.15',
    // '94.140.14.15,94.140.15.16',

    //MullvadDns
    '194.242.2.2,193.19.108.2',
    //NextDns
    '45.90.28.0,45.90.30.0',
  ];
  const serverIdx =
    (index ?? randomInt(0, dnsResolvers.length)) % dnsResolvers.length;

  const args = [
    'probe',
    '-s',
    dnsResolvers[serverIdx],
    '--rr-types',
    'A,AAAA,TXT,PTR,MX,NS,SOA,CNAME,CAA', //'SRV,NAPTR,TLSA,NSEC3PARAM,CDNSKEY,CDS',
    '--threads',
    String(opts.threads ?? 1),
    domain,
  ];
  const { stdout } = await runWithBufferedOutput(args, null, {
    timeoutMs: opts.timeoutMs ?? 120_000,
    abortSignal: opts.abortSignal,
  });
  return parseJsonOrThrow(stdout, 'probe');
}

export interface RunDnsvizGrokOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  /** dnsviz log level; defaults to 'info' which yields warnings + errors. */
  logLevel?: 'error' | 'warning' | 'info';
}

/**
 * Run `dnsviz grok -l info -c -r -` against a probe JSON and return the
 * parsed (minimized) assessment JSON.
 *
 * `-c` (minimize-output) keeps the JSON compact, which keeps the row size
 * in the dnsviz_analyses jsonb column small.
 */
export async function runDnsvizGrok(
  probeJson: unknown,
  opts: RunDnsvizGrokOptions = {},
): Promise<unknown> {
  const args = withTrustAnchor([
    'grok',
    '-l',
    opts.logLevel ?? 'info',
    '-c',
    '-r',
    '-',
  ]);
  const { stdout } = await runWithBufferedOutput(
    args,
    JSON.stringify(probeJson),
    {
      timeoutMs: opts.timeoutMs ?? 30_000,
      abortSignal: opts.abortSignal,
    },
  );
  return parseJsonOrThrow(stdout, 'grok');
}

export type DnsvizGraphType = 'png' | 'svg' | 'html';

export interface RunDnsvizGraphStreamOptions {
  timeoutMs?: number;
}

/**
 * Spawn `dnsviz graph -T <type> -r - -o -`, feed `probeJson` to stdin,
 * and return the child's stdout as a Node `Readable`. The caller is
 * responsible for piping/consuming the stream; the child is killed if the
 * timeout elapses before stdout closes.
 *
 * `type='html'` returns a self-contained XHTML document with embedded SVG
 * — dnsviz uses this for its interactive web viewer; the bytes are text
 * but we still treat the channel as binary so the encoding stays untouched.
 *
 * Returns the stream synchronously (not a Promise) so the HTTP layer can
 * stream the bytes through to the client without buffering the whole image.
 */
export function runDnsvizGraphStream(
  probeJson: unknown,
  format: DnsvizGraphType,
  opts: RunDnsvizGraphStreamOptions = {},
): Readable {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const args = withTrustAnchor(['graph', '-T', format, '-r', '-', '-o', '-']);
  const child: ChildProcessWithoutNullStreams = spawn(DEFAULT_BIN, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const timer = setTimeout(() => {
    child.kill('SIGKILL');
  }, timeoutMs);
  child.on('close', () => clearTimeout(timer));

  // Surface stderr/spawn errors on the returned stream so consumers see them.
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d: string) => {
    stderr += d;
  });
  child.on('error', (err) => {
    child.stdout.destroy(
      new DnsvizError(
        `failed to spawn dnsviz graph: ${err.message}`,
        stderr,
        null,
      ),
    );
  });
  child.on('close', (code) => {
    if (code !== 0) {
      child.stdout.destroy(
        new DnsvizError(`dnsviz graph exited with code ${code}`, stderr, code),
      );
    }
  });

  child.stdin.write(JSON.stringify(probeJson));
  child.stdin.end();

  return child.stdout;
}

/**
 * Buffered variant of `runDnsvizGraphStream` for callers that need the
 * complete output before sending (e.g. a tRPC procedure that returns
 * base64). For html the buffered output is also post-processed by
 * `rewriteDnsvizHtmlAssets` so the doc loads correctly in an iframe;
 * streaming + html would ship a doc with broken `file://` refs, so use
 * this buffered call for html.
 */
export async function runDnsvizGraphBuffered(
  probeJson: unknown,
  type: DnsvizGraphType,
  opts: RunDnsvizGraphStreamOptions = {},
): Promise<Buffer> {
  const stream = runDnsvizGraphStream(probeJson, type, opts);
  const chunks: Buffer[] = [];
  for await (const c of stream) {
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c as string));
  }
  const raw = Buffer.concat(chunks);
  if (type !== 'html') return raw;
  const rewritten = rewriteDnsvizHtmlAssets(raw.toString('utf8'));
  return Buffer.from(rewritten, 'utf8');
}

/**
 * dnsviz's HTML output hard-codes absolute `file://` paths to its CSS, JS,
 * and the bundled jQuery/jQuery-UI/Raphael libraries — those paths can't
 * be loaded by a browser embedding the doc in an iframe (or by anyone
 * downloading the file). This rewriter swaps each known `file://` ref for
 * a same-origin URL on our `raw.githubusercontent.com` proxy
 * (`apps/backend/src/routers/raw-github-proxy.ts`), which fetches the
 * dnsviz v0.11.1 release file from GitHub and rewrites the Content-Type
 * (GitHub serves everything as `text/plain` + `nosniff`, which the
 * browser refuses to apply as CSS or run as JS).
 *
 * Mapping (Debian apt path → dnsviz v0.11.1 file path inside the repo):
 *
 *   /usr/share/javascript/jquery-ui-themes/redmond/jquery-ui.css
 *     → external/jquery-ui/jquery-ui-1.11.4.custom.min.css
 *   /usr/share/dnsviz/css/dnsviz.css
 *     → share/css/dnsviz.css
 *   /usr/share/javascript/jquery/jquery.min.js
 *     → external/jquery/jquery-1.11.3.min.js
 *   /usr/share/javascript/jquery-ui/jquery-ui.min.js
 *     → external/jquery-ui/jquery-ui-1.11.4.custom.min.js
 *   /usr/share/javascript/raphael/raphael.min.js
 *     → external/raphael/raphael-min.js
 *   /usr/share/dnsviz/js/dnsviz.js
 *     → share/js/dnsviz.js
 *
 * Matched by path-suffix so the same table works on Debian
 * (`/usr/share/...`) and Homebrew (`/opt/homebrew/.../share/dnsviz/...`)
 * without per-distro branching.
 */
const DNSVIZ_PROXY_BASE =
  '/proxy/raw.githubusercontent.com/dnsviz/dnsviz/refs/tags/v0.11.1';

const DNSVIZ_ASSET_URL_MAP: ReadonlyArray<{
  /** Path suffix used to recognise the asset across distros. */
  suffix: string;
  /** Same-origin proxy URL serving the same file (dnsviz v0.11.1). */
  url: string;
}> = [
  {
    suffix: '/dnsviz/css/dnsviz.css',
    // url: `${DNSVIZ_PROXY_BASE}/share/css/dnsviz.css`,
    url: `${process.env.DNSVIZ_NFI_BASEURL ?? ''}/dnsviz/v0.11.1/dnsviz.css`,
  },
  {
    suffix: '/dnsviz/js/dnsviz.js',
    // url: `${DNSVIZ_PROXY_BASE}/share/js/dnsviz.js`,
    url: `${process.env.DNSVIZ_NFI_BASEURL ?? ''}/dnsviz/v0.11.1/dnsviz.js`,
  },
  {
    suffix: '/jquery-ui-themes/redmond/jquery-ui.css',
    // url: `${DNSVIZ_PROXY_BASE}/external/jquery-ui/jquery-ui-1.11.4.custom.min.css`,
    url: 'https://code.jquery.com/ui/1.11.4/themes/redmond/jquery-ui.css',
  },
  {
    suffix: '/jquery/jquery.min.js',
    // url: `${DNSVIZ_PROXY_BASE}/external/jquery/jquery-1.11.3.min.js`,
    url: 'https://code.jquery.com/jquery-1.11.3.min.js',
  },
  {
    suffix: '/jquery-ui/jquery-ui.min.js',
    // url: `${DNSVIZ_PROXY_BASE}/external/jquery-ui/jquery-ui-1.11.4.custom.min.js`,
    url: 'https://code.jquery.com/ui/1.11.4/jquery-ui.min.js',
  },
  {
    suffix: '/raphael/raphael.min.js',
    // url: `${DNSVIZ_PROXY_BASE}/external/raphael/raphael-min.js`,
    url: 'https://cdnjs.cloudflare.com/ajax/libs/raphael/2.1.4/raphael-min.js',
  },
];

function urlForFilePath(filePath: string): string | null {
  for (const { suffix, url } of DNSVIZ_ASSET_URL_MAP) {
    if (filePath.endsWith(suffix)) return url;
  }
  return null;
}

function rewriteDnsvizHtmlAssets(html: string): string {
  // Match every `file://...` reference (single or double-quoted) and, if
  // the path matches a known dnsviz asset, swap it for the public URL.
  // Anything that doesn't match the asset map is left alone so we don't
  // accidentally rewrite unrelated `file://` references that might appear
  // in the doc.
  return html.replace(/(["'])file:\/\/([^"']+)\1/g, (orig, quote, path) => {
    const url = urlForFilePath(path);
    return url ? `${quote}${url}${quote}` : orig;
  });
}

export function dnsvizGraphContentType(type: DnsvizGraphType): string {
  switch (type) {
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'html':
      return 'text/html; charset=utf-8';
  }
}

function parseJsonOrThrow(text: string, stage: 'probe' | 'grok'): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new DnsvizError(
      `failed to parse ${stage} JSON: ${(err as Error).message}`,
      text.slice(0, 500),
      0,
    );
  }
}
