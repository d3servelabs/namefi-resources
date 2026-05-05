import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  computeDsDigest,
  computeKeyTag,
  parseDnskeyRecord,
} from '@namefi-astra/dns-tools';
import type {
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
  DnssecKey,
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

/**
 * Parsed DNSKEY published at an authoritative nameserver, plus the
 * DS-side fields we recompute locally so the caller can present a
 * side-by-side diff against the user's submission.
 */
export type PublishedDnskey = {
  flags: number;
  algorithm: number;
  publicKey: string;
  computedKeyTag: number;
  computedDigest: string;
  matchesProvided: boolean;
};

export type ValidateDelegationSignerResult = {
  isValid: boolean;
  matchedDnskey?: {
    keyTag: number;
    flags: number;
    algorithm: number;
    publicKey: string;
  };
  publishedDnskeys: PublishedDnskey[];
  nameserversQueried: string[];
  errorMessage?: string;
};

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

  for (const ns of nameservers) {
    const response = await resolve(
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
    );
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

/**
 * Validate a user-supplied DS record against the DNSKEY RRset
 * actually published at the domain's authoritative nameservers.
 *
 * For each published DNSKEY we recompute the DS digest using the
 * caller's `digestType` and compare to the submitted `digest`
 * (case-insensitive hex). The result also includes per-DNSKEY
 * computed key tag / digest values so the UI can render a diff
 * even on mismatch.
 */
export async function validateDelegationSignerAgainstPublishedDnskeys({
  domainName,
  signingConfig,
}: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidateDelegationSignerResult> {
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

  const details = await sldRegistrar.getDomainDetails(domainName);
  const nameservers = details.nameservers.map((ns) => toPunycodeFqdn(ns));

  let dnskeys: Awaited<ReturnType<typeof fetchDnskeysAtAuthoritativeNs>>;
  try {
    dnskeys = await fetchDnskeysAtAuthoritativeNs(domainName, nameservers);
  } catch (error: unknown) {
    return {
      isValid: false,
      publishedDnskeys: [],
      nameserversQueried: nameservers,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Failed to query DNSKEY records.',
    };
  }

  if (isEmpty(dnskeys)) {
    return {
      isValid: false,
      publishedDnskeys: [],
      nameserversQueried: nameservers,
      errorMessage: `No DNSKEY records published at authoritative nameservers for "${domainName}". Verify DNSSEC is enabled at your DNS provider.`,
    };
  }

  const providedDigest = signingConfig.digest.toLowerCase();
  const published: PublishedDnskey[] = dnskeys.map((dnskey) => {
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
    nameserversQueried: nameservers,
  };
}

/**
 * Parse a user-pasted DNSKEY input — accepts either a full record line
 * (`example.com. 3600 IN DNSKEY 257 3 13 base64key`) or just rdata
 * (`257 3 13 base64key`). The resulting flags/protocol/algorithm/
 * publicKey are then used to derive the corresponding DS fields.
 */
function parseUserDnskeyInput(input: string): {
  flags: number;
  protocol: number;
  algorithm: number;
  publicKey: string;
} {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'DNSKEY input is empty.',
    });
  }

  try {
    const dnskey = parseDnskeyRecord(trimmed);
    return {
      flags: dnskey.flags,
      protocol: dnskey.protocol,
      algorithm: dnskey.algorithm,
      publicKey: dnskey.publicKey,
    };
  } catch {
    const parts = trimmed.split(WHITESPACE_REGEX);
    if (parts.length !== 4) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Could not parse DNSKEY. Expected "name TTL IN DNSKEY flags protocol algorithm publicKey" or "flags protocol algorithm publicKey".',
      });
    }
    const [flagsStr, protocolStr, algorithmStr, publicKey] = parts;
    const flags = Number.parseInt(flagsStr, 10);
    const protocol = Number.parseInt(protocolStr, 10);
    const algorithm = Number.parseInt(algorithmStr, 10);
    if (
      Number.isNaN(flags) ||
      Number.isNaN(protocol) ||
      Number.isNaN(algorithm)
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'DNSKEY rdata fields must be integers.',
      });
    }
    if (protocol !== 3) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'DNSKEY protocol must be 3.',
      });
    }
    return { flags, protocol, algorithm, publicKey };
  }
}

/**
 * Derive the DS-side fields (keyTag + digest) from a user-pasted
 * DNSKEY string at the chosen digest type. Pure function — no
 * network. The result is shaped to drop directly into the form's
 * DnssecKey state.
 */
export function deriveDsFromDnskey({
  domainName,
  dnskeyRecord,
  digestType,
}: {
  domainName: PunycodeDomainName;
  dnskeyRecord: string;
  digestType: DnssecDigestType;
}): {
  algorithm: DnssecAlgorithms;
  publicKey: string;
  flags: DnssecFlags;
  keyTag: number;
  digestType: DnssecDigestType;
  digest: string;
} {
  const parsed = parseUserDnskeyInput(dnskeyRecord);
  const keyTag = computeKeyTag(
    parsed.flags,
    parsed.protocol,
    parsed.algorithm,
    parsed.publicKey,
  );
  const digest = computeDsDigest(
    domainName,
    parsed.flags,
    parsed.protocol,
    parsed.algorithm,
    parsed.publicKey,
    digestType as number,
  );
  return {
    algorithm: parsed.algorithm as DnssecAlgorithms,
    publicKey: parsed.publicKey,
    flags: parsed.flags as DnssecFlags,
    keyTag,
    digestType,
    digest,
  };
}
