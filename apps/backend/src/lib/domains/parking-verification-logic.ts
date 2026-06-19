/**
 * Pure decision logic for parked-domain verification.
 *
 * This module is intentionally dependency-free (no network, DB, tls, or heavy
 * package imports) so it can be unit-tested in isolation. The live probes and
 * orchestration live in `./parking-verification.ts`, which imports these.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skipped';

export type ParkingMode = 'park' | 'forward';

export interface RedirectHop {
  status: number;
  location: string;
}

/** Raw HTTP probe shared by the serving + redirect evaluators. */
export interface HttpProbe {
  reachable: boolean;
  status: number | null;
  /** Location header on a 3xx response. */
  location: string | null;
  isParkingPage: boolean;
  detail: string;
}

export interface ServingCheckResult {
  status: CheckStatus;
  detail: string;
  httpStatus: number | null;
}

export interface RedirectCheckResult {
  status: CheckStatus;
  detail: string;
  expectedTarget: string | null;
  observedTarget: string | null;
  redirectChain: RedirectHop[];
}

const STATUS_RANK: Record<CheckStatus, number> = {
  fail: 3,
  warn: 2,
  pass: 1,
  skipped: 0,
};

/** Worst applicable status (skipped only when every check was skipped). */
export function worstStatus(statuses: CheckStatus[]): CheckStatus {
  const applicable = statuses.filter((s) => s !== 'skipped');
  if (applicable.length === 0) return 'skipped';
  return applicable.reduce<CheckStatus>(
    (acc, s) => (STATUS_RANK[s] > STATUS_RANK[acc] ? s : acc),
    'pass',
  );
}

export function stripQuotations(text: string): string {
  return text.trim().replace(/(^"|^'|"$|'$)/g, '');
}

/**
 * Expand an IPv6 address to its full 8-group form for reliable equality, since
 * resolvers may return different compressions of the same address. Returns the
 * lowercased input unchanged for IPv4 / hostnames.
 */
export function canonicalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (!trimmed.includes(':')) return trimmed;
  const [head, tail = ''] = trimmed.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const missing = 8 - headGroups.length - tailGroups.length;
  if (missing < 0) return trimmed;
  const groups = [
    ...headGroups,
    ...Array(trimmed.includes('::') ? missing : 0).fill('0'),
    ...tailGroups,
  ];
  return groups.map((g) => (g || '0').padStart(4, '0')).join(':');
}

export function ipMatches(observed: string[], expected: string): boolean {
  if (!expected) return false;
  const target = canonicalizeIp(expected);
  return observed.some((o) => canonicalizeIp(o) === target);
}

/**
 * Match a hostname against a single certificate name, supporting one leading
 * wildcard label (e.g. `*.example.com` matches `a.example.com` but not
 * `a.b.example.com` or the apex).
 */
export function certNameCoversHost(certName: string, host: string): boolean {
  const name = certName.trim().toLowerCase();
  const h = host.toLowerCase();
  if (name === h) return true;
  if (name.startsWith('*.')) {
    const suffix = name.slice(1); // ".example.com"
    if (!h.endsWith(suffix)) return false;
    const left = h.slice(0, h.length - suffix.length);
    return left.length > 0 && !left.includes('.');
  }
  return false;
}

export function hostnameCoveredByNames(names: string[], host: string): boolean {
  return names.some((n) => certNameCoversHost(n, host));
}

/**
 * Parse a forward target (possibly scheme-less) into a lowercase host, dropping
 * a default port so `shop.example.com` and `https://shop.example.com:443/`
 * compare equal.
 */
export function targetHost(value: string | null): string | null {
  if (!value) return null;
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(value);
  try {
    const url = new URL(hasScheme ? value : `https://${value}`);
    const hostname = url.hostname.toLowerCase();
    const isDefaultPort =
      !url.port ||
      (url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80');
    return isDefaultPort ? hostname : `${hostname}:${url.port}`;
  } catch {
    return null;
  }
}

/** Extract the single-hop redirect chain from a probe (3xx + Location). */
export function redirectChainFromProbe(http: HttpProbe): RedirectHop[] {
  return http.status !== null &&
    http.status >= 300 &&
    http.status < 400 &&
    http.location
    ? [{ status: http.status, location: http.location }]
    : [];
}

/**
 * Serving check: in park mode expect a 200 carrying the Namefi parking page; in
 * forward mode the parking page is not expected (the redirect check covers it).
 */
export function evaluateServing(
  mode: ParkingMode,
  http: HttpProbe,
): ServingCheckResult {
  if (mode === 'forward') {
    return {
      status: 'skipped',
      detail:
        'Forwarding domain — parking page not expected (see redirect check).',
      httpStatus: http.status,
    };
  }
  if (!http.reachable) {
    return { status: 'fail', detail: http.detail, httpStatus: null };
  }
  if (http.status !== null && http.status >= 300 && http.status < 400) {
    return {
      status: 'fail',
      detail: `Unexpected redirect (${http.status} → ${http.location ?? '?'}) for a park-mode domain.`,
      httpStatus: http.status,
    };
  }
  if (http.status === 200 && http.isParkingPage) {
    return {
      status: 'pass',
      detail: 'Serving the Namefi parking page.',
      httpStatus: 200,
    };
  }
  if (http.status === 200) {
    return {
      status: 'fail',
      detail: 'Returned HTTP 200 but the body is not the Namefi parking page.',
      httpStatus: 200,
    };
  }
  return {
    status: 'fail',
    detail: `Expected the parking page but got HTTP ${http.status}.`,
    httpStatus: http.status,
  };
}

/**
 * Redirect-aware check: forward-mode domains must 30x to their configured
 * target; park-mode domains must not redirect at all.
 */
export function evaluateRedirect(
  mode: ParkingMode,
  http: HttpProbe,
  forwardTo: string | null,
): RedirectCheckResult {
  const redirectChain = redirectChainFromProbe(http);
  const observedTarget = targetHost(http.location);

  if (mode === 'park') {
    if (redirectChain.length > 0) {
      return {
        status: 'fail',
        detail: `Unexpected redirect to ${http.location} (park-mode domains should serve the parking page).`,
        expectedTarget: null,
        observedTarget,
        redirectChain,
      };
    }
    return {
      status: http.reachable ? 'pass' : 'skipped',
      detail: http.reachable
        ? 'No redirect, as expected.'
        : 'Host unreachable; nothing to redirect.',
      expectedTarget: null,
      observedTarget: null,
      redirectChain,
    };
  }

  // forward mode
  const expectedTarget = targetHost(forwardTo);
  if (!http.reachable) {
    return {
      status: 'fail',
      detail: http.detail,
      expectedTarget,
      observedTarget: null,
      redirectChain,
    };
  }
  if (redirectChain.length === 0) {
    return {
      status: 'fail',
      detail: `Expected a redirect to ${forwardTo} but got HTTP ${http.status}.`,
      expectedTarget,
      observedTarget,
      redirectChain,
    };
  }
  if (expectedTarget && observedTarget === expectedTarget) {
    return {
      status: 'pass',
      detail: `Redirects to ${http.location} as configured.`,
      expectedTarget,
      observedTarget,
      redirectChain,
    };
  }
  return {
    status: 'fail',
    detail: `Redirects to ${http.location} but the configured target is ${forwardTo}.`,
    expectedTarget,
    observedTarget,
    redirectChain,
  };
}

/**
 * A domain is publicly verifiable unless it lives under a Namefi unofficial TLD
 * (served via the relay zone, not public DNS) or is a bare TLD.
 *
 * @param unofficialTlds the configured unofficial TLD list (from `getUnofficialTlds()`)
 */
export function isPubliclyVerifiable(
  domain: string,
  unofficialTlds: string[],
): boolean {
  const normalized = domain.toLowerCase().replace(/\.+$/, '');
  if (!normalized.includes('.')) return false; // bare TLD
  return !unofficialTlds
    .map((t) => t.toLowerCase())
    .some((tld) => normalized === tld || normalized.endsWith(`.${tld}`));
}

function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split('.');
  if (octets.length !== 4) return true; // malformed → unsafe
  const parts = octets.map((o) =>
    /^\d{1,3}$/.test(o) ? Number(o) : Number.NaN,
  );
  if (parts.some((p) => Number.isNaN(p) || p > 255)) return true; // unparseable → unsafe
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // this-host / private / loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  if (ip === '::1' || ip === '::') return true; // loopback / unspecified
  const dottedMapped = ip.match(
    /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/,
  );
  if (dottedMapped) return isPrivateIpv4(dottedMapped[1]); // ::ffff:1.2.3.4
  const groups = canonicalizeIp(ip).split(':');
  // IPv4-mapped (::ffff:a.b.c.d) in hex form, e.g. ::ffff:0a00:0001 → 10.0.0.1.
  if (
    groups.length === 8 &&
    groups.slice(0, 5).every((g) => g === '0000') &&
    groups[5] === 'ffff'
  ) {
    const a = Number.parseInt(groups[6].slice(0, 2), 16);
    const b = Number.parseInt(groups[6].slice(2, 4), 16);
    const c = Number.parseInt(groups[7].slice(0, 2), 16);
    const d = Number.parseInt(groups[7].slice(2, 4), 16);
    return isPrivateIpv4(`${a}.${b}.${c}.${d}`);
  }
  const first = groups[0];
  if (first.startsWith('fc') || first.startsWith('fd')) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(first)) return true; // link-local fe80::/10
  if (first.startsWith('ff')) return true; // multicast ff00::/8
  return false;
}

/**
 * Best-effort check that an IP is private / reserved / loopback / link-local.
 * Used to gate outbound TLS/HTTP probes (SSRF guard) — unparseable input is
 * treated as unsafe. Not rebinding-proof, but blocks the common case of a
 * publicly-named domain pointing at an internal address.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const addr = ip.trim().toLowerCase();
  if (!addr) return true;
  return addr.includes(':') ? isPrivateIpv6(addr) : isPrivateIpv4(addr);
}
