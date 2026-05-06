import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  computeDsDigest,
  computeKeyTag,
  parseDnskeyRecord,
  parseDsRecord,
} from '@namefi-astra/dns-tools';
import {
  DnssecFlags,
  type DnssecAlgorithms,
  type DnssecDigestType,
  type DnssecKey,
} from '@namefi-astra/registrars/lib/abstract-registrar/data/dnssec';
import {
  type PunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import { resolve } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { isEmpty, isNil } from 'ramda';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';

const execAsync = promisify(exec);

const _logger = createLogger({ module: 'domains-dnssec-validation' });

const DNSKEY_ANSWER_LINE_REGEX = /\bIN\s+DNSKEY\b/;
const WHITESPACE_REGEX = /\s+/;
const FULL_DNSKEY_REGEX = /\bDNSKEY\b/;
const FULL_DS_REGEX = /\bIN\b\s+\bDS\b/;
const HEX_ONLY_REGEX = /^[0-9a-fA-F]+$/;
const BASE64_HINT_REGEX = /[+/=]/;
const STRICT_BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Type 48 is the DNSKEY RR per IANA.
 * @see https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
 */
const DOH_TYPE_DNSKEY = 48;

/**
 * Google DNS-over-HTTPS endpoint. We use this as the "what does the world
 * see?" view, complementing the authoritative-NS query. The frontend pattern
 * mirrors `apps/frontend/src/hooks/use-search.ts:392 resolveNsDOH`.
 */
const PUBLIC_DOH_ENDPOINT = 'https://dns.google/resolve';
const PUBLIC_DOH_LABEL = 'dns.google';
const PUBLIC_DOH_TIMEOUT_MS = 10_000;

// #region Types

export type PublishedDnskey = {
  flags: number;
  algorithm: number;
  publicKey: string;
  computedKeyTag: number;
  computedDigest: string;
  matchesProvided: boolean;
};

/**
 * One side of a two-lane validation: result of comparing a user-supplied DS
 * against DNSKEYs from a single source (authoritative NS or public resolver).
 */
export type ValidationLaneResult = {
  isValid: boolean;
  matchedDnskey?: {
    keyTag: number;
    flags: number;
    algorithm: number;
    publicKey: string;
  };
  publishedDnskeys: PublishedDnskey[];
  /** Authoritative NS hostnames for the auth lane, resolver label for public. */
  queriedSource: string[];
  errorMessage?: string;
};

export type ValidateDelegationSignerResult = {
  authoritative: ValidationLaneResult;
  publicDns: ValidationLaneResult;
};

export type DerivedDelegationSigner = {
  algorithm: DnssecAlgorithms;
  /** Empty string when derived from a DS-only paste — the registrar requires it
   * for submission, so the frontend prompts the user to provide it. */
  publicKey: string;
  flags: DnssecFlags;
  keyTag: number;
  digestType: DnssecDigestType;
  digest: string;
};

export type DeriveDelegationSignerResult = {
  candidates: DerivedDelegationSigner[];
};

// #endregion

// #region Universal paste detector

type ParsedDnskeyInput = {
  kind: 'dnskey';
  flags: number;
  protocol: number;
  algorithm: number;
  publicKey: string;
};

type ParsedDsInput = {
  kind: 'ds';
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
};

type ParsedInput = ParsedDnskeyInput | ParsedDsInput;

/**
 * Parse a user-pasted record string into either DNSKEY or DS shape.
 *
 * Supported formats:
 * 1. Full DNSKEY record:    `example.com. 3600 IN DNSKEY 257 3 13 base64key`
 * 2. Full DS record:        `example.com. 3600 IN DS 12345 13 2 deadbeef…`
 * 3. DNSKEY rdata only:     `257 3 13 base64key`
 * 4. DS rdata only:         `12345 13 2 deadbeef…`
 *
 * Detection is shape-based:
 * - Presence of `DNSKEY` / `IN DS` literals identifies full records.
 * - For rdata-only the discriminator is the second token: DNSKEY's protocol
 *   is always `3` per RFC 4034, so `t2 === 3` plus a base64-shaped trailing
 *   field implies DNSKEY. A pure-hex trailing field implies DS.
 */
export function parseUserDsOrDnskeyInput(input: string): ParsedInput {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Input is empty.',
    });
  }

  if (FULL_DNSKEY_REGEX.test(trimmed)) {
    const dnskey = parseDnskeyRecord(trimmed);
    return {
      kind: 'dnskey',
      flags: dnskey.flags,
      protocol: dnskey.protocol,
      algorithm: dnskey.algorithm,
      publicKey: dnskey.publicKey,
    };
  }

  if (FULL_DS_REGEX.test(trimmed)) {
    const ds = parseDsRecord(trimmed);
    return {
      kind: 'ds',
      keyTag: ds.keyTag,
      algorithm: ds.algorithm,
      digestType: ds.digestType,
      digest: ds.digest,
    };
  }

  // Rdata-only path.
  const tokens = trimmed
    .split(WHITESPACE_REGEX)
    .filter((token) => token.length > 0);
  if (tokens.length < 4) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Could not parse pasted record. Expected DNSKEY/DS in zone-file format or rdata.',
    });
  }
  const t1 = Number.parseInt(tokens[0], 10);
  const t2 = Number.parseInt(tokens[1], 10);
  const t3 = Number.parseInt(tokens[2], 10);
  if (Number.isNaN(t1) || Number.isNaN(t2) || Number.isNaN(t3)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Could not parse pasted record: non-numeric leading fields.',
    });
  }
  const trailing = tokens.slice(3).join('');

  // DNSKEY rdata: protocol === 3 AND trailing is strict base64 (alphabet
  // [A-Za-z0-9+/] with optional `=` padding). Hex-only strings are not
  // unambiguously DNSKEY, so we require either a base64-only character (`+`,
  // `/`, `=`) or trailing that fails the hex check while still passing strict
  // base64 — both signals reject garbage like `not-a-key!`.
  if (
    t2 === 3 &&
    STRICT_BASE64_REGEX.test(trailing) &&
    (BASE64_HINT_REGEX.test(trailing) || !HEX_ONLY_REGEX.test(trailing))
  ) {
    return {
      kind: 'dnskey',
      flags: t1,
      protocol: t2,
      algorithm: t3,
      publicKey: trailing,
    };
  }
  // DS rdata: trailing must be hex.
  if (HEX_ONLY_REGEX.test(trailing)) {
    return {
      kind: 'ds',
      keyTag: t1,
      algorithm: t2,
      digestType: t3,
      digest: trailing,
    };
  }
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message:
      'Could not parse pasted record. Trailing field is neither hex (DS) nor base64 (DNSKEY).',
  });
}

// #endregion

// #region Authoritative-NS DNSKEY query (existing pattern)

/**
 * Query DNSKEY records for `domain` at each of `nameservers` via `dig`,
 * mirroring the loop/error shape of `checkDsRecordExists`. Returns the
 * union across nameservers, deduped by public key. Throws if every
 * nameserver fails to respond. Returns an empty array if reachable
 * nameservers responded but none of them publish a DNSKEY.
 */
export async function fetchDnskeysAtAuthoritativeNs(
  domain: PunycodeDomainName,
  nameservers: string[],
): Promise<
  Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
    sourceNs: string;
  }>
> {
  if (isEmpty(nameservers)) {
    throw new Error(
      `No authoritative nameservers known for "${domain}" — cannot validate.`,
    );
  }

  const seen = new Set<string>();
  const dnskeys: Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
    sourceNs: string;
  }> = [];
  let anyResponded = false;

  // Query all nameservers in parallel — a single slow / unresponsive NS
  // (worst case 3 × 15 s = 45 s with `+tries=3 +time=15`) must not block the
  // others, otherwise the wall-clock time of this loop can exceed the
  // activity's startToCloseTimeout.
  const responses = await Promise.all(
    nameservers.map((ns) =>
      resolve(
        execAsync(
          [
            'dig',
            `@${ns}`,
            '+noall',
            '+answer',
            '+tries=3',
            '+time=15',
            domain,
            'DNSKEY',
          ].join(' '),
        ),
      ),
    ),
  );

  for (let i = 0; i < responses.length; i++) {
    const ns = nameservers[i];
    const response = responses[i];
    if (response.failed) {
      _logger.warn(
        { error: response.error, ns, domain },
        'dig DNSKEY query failed',
      );
      continue;
    }
    anyResponded = true;
    if (response.result.stderr) {
      _logger.warn(
        { stderr: response.result.stderr, ns, domain },
        'dig DNSKEY query produced stderr',
      );
    }

    const lines = response.result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && DNSKEY_ANSWER_LINE_REGEX.test(line));

    for (const line of lines) {
      try {
        const parsed = parseDnskeyRecord(line);
        if (seen.has(parsed.publicKey)) continue;
        seen.add(parsed.publicKey);
        dnskeys.push({
          flags: parsed.flags,
          protocol: parsed.protocol,
          algorithm: parsed.algorithm,
          publicKey: parsed.publicKey,
          sourceNs: ns,
        });
      } catch (error) {
        _logger.warn(
          { error, line, ns, domain },
          'Skipped unparseable DNSKEY answer',
        );
      }
    }
  }

  if (!anyResponded) {
    throw new Error(
      `No nameserver responded to DNSKEY queries for "${domain}".`,
    );
  }

  return dnskeys;
}

// #endregion

// #region Public DNS DoH lookup

type DohAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

type DohResponse = {
  Status: number;
  Answer?: DohAnswer[];
};

/**
 * Fetch DNSKEY records via Google's public recursive DoH endpoint. This
 * answers "what does the world see?" — useful to confirm propagation
 * after a DNSKEY publish. The DoH `Answer[].data` field is DNSKEY rdata in
 * zone-file format (`flags protocol algorithm publicKey`); we feed it
 * through the same rdata-detection branch used for user paste.
 */
export async function fetchDnskeysViaPublicResolver(
  domain: PunycodeDomainName,
): Promise<
  Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
  }>
> {
  const url = `${PUBLIC_DOH_ENDPOINT}?name=${encodeURIComponent(domain)}&type=DNSKEY&do=true`;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    PUBLIC_DOH_TIMEOUT_MS,
  );
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Public DoH query for "${domain}" timed out after ${PUBLIC_DOH_TIMEOUT_MS}ms.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
  if (!response.ok) {
    throw new Error(
      `Public DoH query failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as DohResponse;
  if (json.Status !== 0) {
    throw new Error(
      `Public DoH returned non-zero status ${json.Status} for "${domain}".`,
    );
  }
  if (!json.Answer || json.Answer.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const dnskeys: Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
  }> = [];

  for (const answer of json.Answer) {
    if (answer.type !== DOH_TYPE_DNSKEY) continue;
    try {
      const parsed = parseUserDsOrDnskeyInput(answer.data);
      if (parsed.kind !== 'dnskey') continue;
      if (seen.has(parsed.publicKey)) continue;
      seen.add(parsed.publicKey);
      dnskeys.push({
        flags: parsed.flags,
        protocol: parsed.protocol,
        algorithm: parsed.algorithm,
        publicKey: parsed.publicKey,
      });
    } catch (error) {
      _logger.warn(
        { error, data: answer.data, domain },
        'Skipped unparseable DoH DNSKEY answer',
      );
    }
  }

  return dnskeys;
}

// #endregion

// #region Two-lane validation

function buildLaneResult({
  domainName,
  signingConfig,
  publishedDnskeys,
  queriedSource,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  publishedDnskeys: Array<{
    flags: number;
    protocol: number;
    algorithm: number;
    publicKey: string;
  }>;
  queriedSource: string[];
}): ValidationLaneResult {
  const providedDigest = (signingConfig.digest ?? '').toLowerCase();
  const published: PublishedDnskey[] = publishedDnskeys.map((dnskey) => {
    const computedKeyTag = computeKeyTag(
      dnskey.flags,
      dnskey.protocol,
      dnskey.algorithm,
      dnskey.publicKey,
    );
    const computedDigest = computeDsDigest(
      domainName,
      dnskey.flags,
      dnskey.protocol,
      dnskey.algorithm,
      dnskey.publicKey,
      signingConfig.digestType as number,
    );
    return {
      flags: dnskey.flags,
      algorithm: dnskey.algorithm,
      publicKey: dnskey.publicKey,
      computedKeyTag,
      computedDigest,
      matchesProvided: computedDigest.toLowerCase() === providedDigest,
    };
  });

  const matched = published.find((entry) => entry.matchesProvided);
  return {
    isValid: Boolean(matched),
    matchedDnskey: matched
      ? {
          keyTag: matched.computedKeyTag,
          flags: matched.flags,
          algorithm: matched.algorithm,
          publicKey: matched.publicKey,
        }
      : undefined,
    publishedDnskeys: published,
    queriedSource,
  };
}

function assertSigningConfigComplete(signingConfig: DnssecKey) {
  if (
    isNil(signingConfig.digest) ||
    isNil(signingConfig.digestType) ||
    isNil(signingConfig.algorithm) ||
    isNil(signingConfig.flags)
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Validation requires algorithm, flags, digestType, and digest to be provided.',
    });
  }
}

/**
 * Validate a DS against the DNSKEYs published at the domain's authoritative
 * nameservers. Returns a `ValidationLaneResult`; never throws — DNS / network
 * failures are converted into `errorMessage` so the caller (workflow polling
 * or two-lane endpoint) can react uniformly.
 */
export async function validateDsAgainstAuthoritative({
  domainName,
  signingConfig,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidationLaneResult> {
  assertSigningConfigComplete(signingConfig);
  let nameservers: string[] = [];
  try {
    const details = await sldRegistrar.getDomainDetails(domainName);
    nameservers = details.nameservers.map((ns) => toPunycodeFqdn(ns));
    const dnskeys = await fetchDnskeysAtAuthoritativeNs(
      domainName,
      nameservers,
    );
    if (isEmpty(dnskeys)) {
      return {
        isValid: false,
        publishedDnskeys: [],
        queriedSource: nameservers,
        errorMessage: `No DNSKEY records returned by authoritative nameservers for "${domainName}".`,
      };
    }
    return buildLaneResult({
      domainName,
      signingConfig,
      publishedDnskeys: dnskeys,
      queriedSource: nameservers,
    });
  } catch (error) {
    return {
      isValid: false,
      publishedDnskeys: [],
      queriedSource: nameservers,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Authoritative DNSKEY query failed.',
    };
  }
}

/**
 * Validate a DS against the DNSKEYs visible via Google's public DoH resolver.
 * Same shape as `validateDsAgainstAuthoritative`; never throws.
 */
export async function validateDsAgainstPublicDns({
  domainName,
  signingConfig,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidationLaneResult> {
  assertSigningConfigComplete(signingConfig);
  try {
    const dnskeys = await fetchDnskeysViaPublicResolver(domainName);
    if (isEmpty(dnskeys)) {
      return {
        isValid: false,
        publishedDnskeys: [],
        queriedSource: [PUBLIC_DOH_LABEL],
        errorMessage: `No DNSKEY records returned by ${PUBLIC_DOH_LABEL} for "${domainName}".`,
      };
    }
    return buildLaneResult({
      domainName,
      signingConfig,
      publishedDnskeys: dnskeys,
      queriedSource: [PUBLIC_DOH_LABEL],
    });
  } catch (error) {
    return {
      isValid: false,
      publishedDnskeys: [],
      queriedSource: [PUBLIC_DOH_LABEL],
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Public DoH DNSKEY query failed.',
    };
  }
}

/**
 * Validate a user-supplied DS record against the DNSKEY RRset published at
 * the domain's authoritative nameservers AND at a public recursive resolver
 * (Google DoH). The two lanes run in parallel; a failure in one is reported
 * via `errorMessage` on that lane only and does not affect the other.
 */
export async function validateDelegationSignerAgainstPublishedDnskeys({
  domainName,
  signingConfig,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidateDelegationSignerResult> {
  const [authoritative, publicDns] = await Promise.all([
    validateDsAgainstAuthoritative({ domainName, signingConfig }),
    validateDsAgainstPublicDns({ domainName, signingConfig }),
  ]);
  return { authoritative, publicDns };
}

// #endregion

// #region Derive delegation signer (manual paste OR auto detect)

function deriveFromDnskeyShape({
  domainName,
  flags,
  protocol,
  algorithm,
  publicKey,
  digestType,
}: {
  domainName: PunycodeDomainName;
  flags: number;
  protocol: number;
  algorithm: number;
  publicKey: string;
  digestType: DnssecDigestType;
}): DerivedDelegationSigner {
  const keyTag = computeKeyTag(flags, protocol, algorithm, publicKey);
  const digest = computeDsDigest(
    domainName,
    flags,
    protocol,
    algorithm,
    publicKey,
    digestType as number,
  );
  return {
    algorithm: algorithm as DnssecAlgorithms,
    publicKey,
    flags: flags as DnssecFlags,
    keyTag,
    digestType,
    digest,
  };
}

/**
 * Universal derivation entry point used by both the Manual paste tab
 * (`text` provided) and the Automatic Detection tab (`text` omitted).
 *
 * - Manual: parses any of the four supported formats. DNSKEY → derive DS.
 *   DS-only → return DS fields with `publicKey: ''` so the form can prompt
 *   the user to provide a DNSKEY (the registrar needs publicKey to submit).
 * - Auto: queries the domain's authoritative NS, returns one candidate per
 *   KSK (flags === 257). Multi-KSK rotations surface every candidate so the
 *   frontend can render a chooser.
 */
export async function deriveDelegationSigner({
  domainName,
  text,
  digestType,
}: {
  domainName: PunycodeDomainName;
  text?: string;
  digestType: DnssecDigestType;
}): Promise<DeriveDelegationSignerResult> {
  if (text !== undefined && text.trim().length > 0) {
    const parsed = parseUserDsOrDnskeyInput(text);
    if (parsed.kind === 'dnskey') {
      const derived = deriveFromDnskeyShape({
        domainName,
        flags: parsed.flags,
        protocol: parsed.protocol,
        algorithm: parsed.algorithm,
        publicKey: parsed.publicKey,
        digestType,
      });
      return { candidates: [derived] };
    }
    // DS-only paste: publicKey is not derivable. Default flags to KSK; the
    // frontend surfaces a notice so the user can either paste DNSKEY or use
    // Automatic Detection.
    return {
      candidates: [
        {
          algorithm: parsed.algorithm as DnssecAlgorithms,
          publicKey: '',
          flags: DnssecFlags.KSK,
          keyTag: parsed.keyTag,
          digestType: parsed.digestType as DnssecDigestType,
          digest: parsed.digest,
        },
      ],
    };
  }

  // Auto detect: fetch the domain's authoritative DNSKEYs and return KSKs.
  const details = await sldRegistrar.getDomainDetails(domainName);
  const nameservers = details.nameservers.map((ns) => toPunycodeFqdn(ns));
  const dnskeys = await fetchDnskeysAtAuthoritativeNs(domainName, nameservers);
  const ksks = dnskeys.filter((dk) => dk.flags === DnssecFlags.KSK);
  if (isEmpty(ksks)) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `No KSK (flags=257) DNSKEY published at authoritative nameservers for "${domainName}".`,
    });
  }
  const candidates = ksks.map((dnskey) =>
    deriveFromDnskeyShape({
      domainName,
      flags: dnskey.flags,
      protocol: dnskey.protocol,
      algorithm: dnskey.algorithm,
      publicKey: dnskey.publicKey,
      digestType,
    }),
  );
  return { candidates };
}

// #endregion
