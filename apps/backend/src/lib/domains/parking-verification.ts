/**
 * Parked-domain verification core.
 *
 * Given a domain that Namefi parks (or forwards), this module probes the live
 * world and reports whether the parking is healthy across four checks:
 *
 *  1. DNS propagated  — A/AAAA resolve (via public DoH, Google + Cloudflare) to
 *     the parking IPs in `PARKED_DOMAIN_RECORDS`; the `_namefi-gate` JWT TXT is
 *     published; and (forward mode) the `--nfi-redirect=` TXT marker is present.
 *  2. SSL valid       — the host presents a trusted, in-date certificate that
 *     covers the hostname (Caddy on-demand TLS / Let's Encrypt / ZeroSSL).
 *  3. Serving page    — an HTTPS GET returns the "Namefi Park" landing page.
 *  4. Redirect        — redirect-aware: a forward-mode domain must 30x to its
 *     `forwardTo` target; a park-mode domain must NOT redirect.
 *
 * The mode is derived from `domainConfig.forwardTo`: a non-empty value means the
 * owner configured a forward (which the DNS service materializes as a
 * `--nfi-redirect=` TXT marker the park app turns into an HTTP 307), so we expect
 * a redirect instead of the parking page.
 *
 * Results are computed live and never persisted. Consumed by the admin tRPC
 * `verifyParkedDomains` procedure (on-demand) and the weekly verification
 * Temporal activity (full sweep). Pure decision logic lives in
 * `./parking-verification-logic.ts`.
 */

import { connect as tlsConnect, type PeerCertificate } from 'node:tls';
import { db, domainConfigTable } from '@namefi-astra/db';
import {
  FORWARDING_TXT_PREFIX,
  PARKED_DOMAIN_RECORDS,
} from '@namefi-astra/dns-service/services/dns/managed-records';
import {
  getUnofficialTlds,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import {
  toPunycodeDomainName,
  type PunycodeDomainName,
} from '@namefi-astra/registrars/data/validations';
import { RecordType } from '@namefi-astra/zod-dns';
import { eq } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import {
  type CheckStatus,
  type HttpProbe,
  type ParkingMode,
  type RedirectCheckResult,
  type ServingCheckResult,
  evaluateRedirect,
  evaluateServing,
  hostnameCoveredByNames,
  ipMatches,
  isPubliclyVerifiable,
  stripQuotations,
  worstStatus,
} from './parking-verification-logic';

const _logger = createLogger({ module: 'parking-verification' });

// #region constants & types

const DOH_TIMEOUT_MS = 8_000;
const SSL_TIMEOUT_MS = 8_000;
const HTTP_TIMEOUT_MS = 12_000;
/** Warn (don't fail) when a certificate is valid but expires within this window. */
const SSL_EXPIRY_WARN_DAYS = 14;
/** Substrings that uniquely identify the Namefi parking page (apps/park). */
const PARKING_PAGE_MARKERS = [
  'Namefi Park',
  'This domain is parked free courtesy of',
];

/** DoH numeric RR type codes (IANA); DoH JSON `Answer[].type` is numeric. */
const DOH_TYPE = { A: 1, AAAA: 28, TXT: 16 } as const;

/**
 * Expected parking record targets, read from the single source of truth in
 * `@namefi-astra/dns-service` (which itself honors `USE_LEGACY_PARKING_PAGE`),
 * so verification always matches what the DNS service actually serves.
 */
const EXPECTED_A =
  PARKED_DOMAIN_RECORDS.find((r) => r.type === RecordType.A)?.rdata ?? '';
const EXPECTED_AAAA =
  PARKED_DOMAIN_RECORDS.find((r) => r.type === RecordType.AAAA)?.rdata ?? '';

export interface DnsCheckResult {
  status: CheckStatus;
  detail: string;
  expected: { a: string; aaaa: string };
  observed: { a: string[]; aaaa: string[] };
  /** Whether the `_namefi-gate.<domain>` JWT TXT (which authorizes Caddy) is published. */
  gateTxtPresent: boolean;
  /** The `--nfi-redirect=` target observed in the apex TXT, if any. */
  redirectTxt: string | null;
}

export interface SslCheckResult {
  status: CheckStatus;
  detail: string;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  hostnameCovered: boolean;
  /** Whether the presented chain validated against the system trust store. */
  authorized: boolean;
}

export interface ParkedDomainVerification {
  domain: NamefiNormalizedDomain;
  punycode: string;
  mode: ParkingMode;
  forwardTo: string | null;
  /** False for relay / unofficial-TLD domains that can't be probed publicly. */
  publiclyVerifiable: boolean;
  dns: DnsCheckResult;
  ssl: SslCheckResult;
  serving: ServingCheckResult;
  redirect: RedirectCheckResult;
  /** Worst applicable check status (skipped only when every check is skipped). */
  overall: CheckStatus;
  /** ISO-8601 timestamp of when this verification ran. */
  checkedAt: string;
}

// #endregion

// #region DoH

type DohResolver = {
  label: string;
  url: (name: string, type: string) => string;
};

const DOH_RESOLVERS: DohResolver[] = [
  {
    label: 'google',
    url: (name, type) =>
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
  },
  {
    label: 'cloudflare',
    url: (name, type) =>
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  },
];

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}
interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
}

/**
 * Query one DoH resolver for `name`/`type` and return the `data` values of
 * matching answers. Never throws — returns `null` on failure so the caller can
 * distinguish "resolver errored" from "no records".
 */
async function queryDoh(
  resolver: DohResolver,
  name: string,
  type: keyof typeof DOH_TYPE,
): Promise<string[] | null> {
  try {
    const res = await fetch(resolver.url(name, type), {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(DOH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as DohResponse;
    // Status 0 = NOERROR, 3 = NXDOMAIN. Both mean "resolver answered".
    if (json.Status !== 0 && json.Status !== 3) return null;
    return (json.Answer ?? [])
      .filter((a) => a.type === DOH_TYPE[type])
      .map((a) => a.data);
  } catch (error) {
    _logger.debug(
      { error, resolver: resolver.label, name, type },
      'DoH query failed',
    );
    return null;
  }
}

// #endregion

// #region live probes

/**
 * DNS check: confirm A/AAAA point to the parking IPs across public resolvers,
 * the gate TXT is published, and (forward mode) the redirect TXT is present.
 * Never throws.
 */
async function checkDnsPropagation(
  punycode: PunycodeDomainName,
  mode: ParkingMode,
): Promise<DnsCheckResult> {
  const observedA = new Set<string>();
  const observedAaaa = new Set<string>();
  let anyResolverAnswered = false;

  await Promise.all(
    DOH_RESOLVERS.map(async (resolver) => {
      const [a, aaaa] = await Promise.all([
        queryDoh(resolver, punycode, 'A'),
        queryDoh(resolver, punycode, 'AAAA'),
      ]);
      if (a !== null || aaaa !== null) anyResolverAnswered = true;
      for (const v of a ?? []) observedA.add(v);
      for (const v of aaaa ?? []) observedAaaa.add(v);
    }),
  );

  // Gate TXT + apex TXT (redirect marker) via Google only — presence is enough.
  const [gateTxt, apexTxt] = await Promise.all([
    queryDoh(DOH_RESOLVERS[0], `_namefi-gate.${punycode}`, 'TXT'),
    queryDoh(DOH_RESOLVERS[0], punycode, 'TXT'),
  ]);
  const gateTxtPresent = (gateTxt ?? []).some(
    (r) => stripQuotations(r).length > 0,
  );
  const redirectTxt =
    (apexTxt ?? [])
      .map((r) => stripQuotations(r))
      .find((r) => r.startsWith(FORWARDING_TXT_PREFIX))
      ?.slice(FORWARDING_TXT_PREFIX.length) ?? null;

  const observed = { a: [...observedA], aaaa: [...observedAaaa] };
  const base = {
    expected: { a: EXPECTED_A, aaaa: EXPECTED_AAAA },
    observed,
    gateTxtPresent,
    redirectTxt,
  };

  if (!anyResolverAnswered) {
    return {
      ...base,
      status: 'fail',
      detail: 'No public resolver answered A/AAAA queries.',
    };
  }

  const aOk = ipMatches(observed.a, EXPECTED_A);
  const aaaaOk = ipMatches(observed.aaaa, EXPECTED_AAAA);

  const issues: string[] = [];
  let status: CheckStatus = 'pass';

  if (!aOk && !aaaaOk) {
    status = 'fail';
    issues.push(
      observed.a.length || observed.aaaa.length
        ? `A/AAAA do not point to the parking IPs (saw A=[${observed.a.join(', ') || '—'}], AAAA=[${observed.aaaa.join(', ') || '—'}]).`
        : 'No A/AAAA records found.',
    );
  } else if (!aOk || !aaaaOk) {
    status = 'warn';
    issues.push(
      `Only ${aOk ? 'A' : 'AAAA'} points to the parking IP; ${aOk ? 'AAAA' : 'A'} is missing or wrong (partial propagation).`,
    );
  }

  if (!gateTxtPresent) {
    // The Caddy gate won't serve without this; surface as a warning so the
    // serving/SSL checks (which depend on it) explain the downstream failure.
    if (status === 'pass') status = 'warn';
    issues.push(
      '`_namefi-gate` JWT TXT not found — Caddy may refuse to serve.',
    );
  }

  if (mode === 'forward' && !redirectTxt) {
    if (status === 'pass') status = 'warn';
    issues.push(
      'Forward configured but `--nfi-redirect=` TXT not propagated yet.',
    );
  }

  return {
    ...base,
    status,
    detail: issues.length
      ? issues.join(' ')
      : 'A/AAAA point to the parking IPs; gate TXT present.',
  };
}

function certNames(cert: PeerCertificate): string[] {
  const names: string[] = [];
  if (cert.subject?.CN) names.push(cert.subject.CN);
  if (cert.subjectaltname) {
    for (const entry of cert.subjectaltname.split(',')) {
      const trimmed = entry.trim();
      if (trimmed.startsWith('DNS:')) names.push(trimmed.slice(4));
    }
  }
  return names;
}

/** SSL check: inspect the live certificate for trust, validity window, and hostname coverage. */
function checkSsl(host: PunycodeDomainName): Promise<SslCheckResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SslCheckResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tlsConnect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: SSL_TIMEOUT_MS,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authError = socket.authorizationError?.toString() ?? null;
          socket.end();

          if (!cert || Object.keys(cert).length === 0) {
            finish(emptySslResult('fail', 'No certificate presented.'));
            return;
          }

          const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
          const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
          const now = Date.now();
          const issuer = cert.issuer?.O ?? cert.issuer?.CN ?? null;
          const hostnameCovered = hostnameCoveredByNames(certNames(cert), host);
          const daysUntilExpiry = validTo
            ? Math.floor((validTo.getTime() - now) / 86_400_000)
            : null;

          const issues: string[] = [];
          let status: CheckStatus = 'pass';

          if (validFrom && validFrom.getTime() > now) {
            status = 'fail';
            issues.push(
              `Certificate not yet valid (valid from ${cert.valid_from}).`,
            );
          }
          if (validTo && validTo.getTime() < now) {
            status = 'fail';
            issues.push(`Certificate expired (${cert.valid_to}).`);
          } else if (
            daysUntilExpiry !== null &&
            daysUntilExpiry < SSL_EXPIRY_WARN_DAYS
          ) {
            if (status === 'pass') status = 'warn';
            issues.push(`Certificate expires in ${daysUntilExpiry} day(s).`);
          }
          if (!hostnameCovered) {
            status = 'fail';
            issues.push('Certificate does not cover the hostname.');
          }
          if (!authorized) {
            status = 'fail';
            issues.push(
              `Chain not trusted${authError ? ` (${authError})` : ''}.`,
            );
          }

          finish({
            status,
            detail: issues.length
              ? issues.join(' ')
              : `Valid certificate from ${issuer ?? 'unknown CA'}, ${daysUntilExpiry} day(s) remaining.`,
            issuer,
            validFrom: validFrom?.toISOString() ?? null,
            validTo: validTo?.toISOString() ?? null,
            daysUntilExpiry,
            hostnameCovered,
            authorized,
          });
        } catch (error) {
          finish(
            emptySslResult(
              'fail',
              `Failed to read certificate: ${errMessage(error)}.`,
            ),
          );
        }
      },
    );

    socket.on('timeout', () => {
      socket.destroy();
      finish(
        emptySslResult(
          'fail',
          `TLS handshake timed out after ${SSL_TIMEOUT_MS}ms.`,
        ),
      );
    });
    socket.on('error', (error) => {
      finish(
        emptySslResult('fail', `TLS connection failed: ${errMessage(error)}.`),
      );
    });
  });
}

function emptySslResult(status: CheckStatus, detail: string): SslCheckResult {
  return {
    status,
    detail,
    issuer: null,
    validFrom: null,
    validTo: null,
    daysUntilExpiry: null,
    hostnameCovered: false,
    authorized: false,
  };
}

/**
 * HTTP probe: GET the apex over HTTPS without following redirects, so we can
 * tell a parking-page 200 from a forward 30x and capture the Location. Never
 * throws.
 */
async function probeHttp(host: PunycodeDomainName): Promise<HttpProbe> {
  try {
    const res = await fetch(`https://${host}/`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: { 'User-Agent': 'namefi-parking-verifier/1.0' },
    });
    const status = res.status;
    if (status >= 300 && status < 400) {
      return {
        reachable: true,
        status,
        location: res.headers.get('location'),
        isParkingPage: false,
        detail: `Redirected (${status}).`,
      };
    }
    let isParkingPage = false;
    if (status === 200) {
      const body = await res.text();
      isParkingPage = PARKING_PAGE_MARKERS.some((m) => body.includes(m));
    }
    return {
      reachable: true,
      status,
      location: null,
      isParkingPage,
      detail: `HTTP ${status}.`,
    };
  } catch (error) {
    return {
      reachable: false,
      status: null,
      location: null,
      isParkingPage: false,
      detail: `Unreachable over HTTPS: ${errMessage(error)}.`,
    };
  }
}

// #endregion

// #region orchestration

function errMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function notVerifiableResult(
  domain: NamefiNormalizedDomain,
  punycode: string,
  mode: ParkingMode,
  forwardTo: string | null,
  reason: string,
): ParkedDomainVerification {
  return {
    domain,
    punycode,
    mode,
    forwardTo,
    publiclyVerifiable: false,
    dns: {
      status: 'skipped',
      detail: reason,
      expected: { a: EXPECTED_A, aaaa: EXPECTED_AAAA },
      observed: { a: [], aaaa: [] },
      gateTxtPresent: false,
      redirectTxt: null,
    },
    ssl: emptySslResult('skipped', reason),
    serving: { status: 'skipped', detail: reason, httpStatus: null },
    redirect: {
      status: 'skipped',
      detail: reason,
      expectedTarget: null,
      observedTarget: null,
      redirectChain: [],
    },
    overall: 'skipped',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Verify a single parked domain across all four checks. Never throws — every
 * failure mode is encoded into the returned result.
 */
export async function verifyParkedDomain(
  domain: NamefiNormalizedDomain,
): Promise<ParkedDomainVerification> {
  const punycode = toPunycodeDomainName(domain);

  let forwardTo: string | null = null;
  try {
    const cfg = await db.query.domainConfigTable.findFirst({
      columns: { forwardTo: true },
      where: eq(domainConfigTable.normalizedDomainName, domain),
    });
    forwardTo = cfg?.forwardTo?.trim() ? cfg.forwardTo.trim() : null;
  } catch (error) {
    _logger.warn(
      { error, domain },
      'Failed to load domain config for verification',
    );
  }
  const mode: ParkingMode = forwardTo ? 'forward' : 'park';

  if (!isPubliclyVerifiable(domain, getUnofficialTlds())) {
    return notVerifiableResult(
      domain,
      punycode,
      mode,
      forwardTo,
      'Domain is not publicly resolvable (unofficial TLD / relay zone) — not verifiable from public DNS.',
    );
  }

  const [dns, ssl, http] = await Promise.all([
    checkDnsPropagation(punycode, mode),
    checkSsl(punycode),
    probeHttp(punycode),
  ]);

  const serving = evaluateServing(mode, http);
  const redirect = evaluateRedirect(mode, http, forwardTo);

  return {
    domain,
    punycode,
    mode,
    forwardTo,
    publiclyVerifiable: true,
    dns,
    ssl,
    serving,
    redirect,
    overall: worstStatus([
      dns.status,
      ssl.status,
      serving.status,
      redirect.status,
    ]),
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Verify many domains with bounded concurrency. Used by the admin on-demand
 * endpoint (small batch) and the weekly sweep activity (chunked). The returned
 * array preserves input order.
 */
export async function verifyParkedDomains(
  domains: NamefiNormalizedDomain[],
  { concurrency = 8 }: { concurrency?: number } = {},
): Promise<ParkedDomainVerification[]> {
  const results = new Array<ParkedDomainVerification>(domains.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < domains.length) {
      const index = cursor++;
      results[index] = await verifyParkedDomain(domains[index]);
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, domains.length)) },
      worker,
    ),
  );
  return results;
}

// #endregion
