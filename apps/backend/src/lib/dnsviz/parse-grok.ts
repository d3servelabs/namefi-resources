/**
 * Derives a per-domain `DnsvizAnalysisSummary` + status enum from a `dnsviz
 * grok` JSON output.
 *
 * Validation mapping (grok keys leaf zone by trailing-dot FQDN, e.g.
 * `"samyx.net."`, with a `delegation.status` field of SECURE/INSECURE/BOGUS):
 *
 * - SECURE   → full chain validates
 * - INSECURE → no DS at parent (no DNSSEC)
 * - BOGUS    → signatures or DS digests fail to validate (actionable)
 * - ERROR    → grok output is malformed or missing the leaf zone entirely
 */

import type {
  DnsvizAnalysisStatus,
  DnsvizAnalysisSummary,
} from '@namefi-astra/db/schema';

const MAX_TOP_MESSAGES = 3;

/**
 * Error codes that surface in dnsviz grok output but don't actually break
 * DNSSEC validation. Filtered out of `errorsCount` and `topErrors` so the
 * digest email and UI surfaces don't flag SECURE domains as problematic.
 *
 * The full list of raw errors is still preserved in the `grok_data` jsonb
 * column — this filter only affects the *derived* summary.
 *
 * - EXISTING_TYPE_NOT_IN_BITMAP: appears when a NODATA proof's NSEC bitmap
 *   omits a record type that does in fact exist for the name. Common in
 *   our own NSEC setup; orthogonal to chain-of-trust validation.
 */
export const DEFAULT_IGNORED_DNSVIZ_ERROR_CODES: ReadonlySet<string> = new Set([
  'EXISTING_TYPE_NOT_IN_BITMAP',
]);

export interface DeriveDnsvizStatusOptions {
  /**
   * Override the default ignored-codes set (e.g. `new Set()` to count
   * every raw error, or to add domain-specific suppressions).
   */
  ignoredErrorCodes?: ReadonlySet<string>;
}

interface DeriveResult {
  status: DnsvizAnalysisStatus;
  errorsCount: number;
  warningsCount: number;
  summary: DnsvizAnalysisSummary;
}

/**
 * Inspect a grok JSON blob for the given normalized domain and return the
 * verdict + a small summary suitable for the `dnsviz_analyses.summary` jsonb
 * column. Falls back to the deepest matching zone if the exact leaf key is
 * missing — that case is logged by the caller as ERROR-adjacent.
 */
export function deriveDnsvizStatus(
  grok: unknown,
  normalizedDomain: string,
  options: DeriveDnsvizStatusOptions = {},
): DeriveResult {
  const ignoredErrorCodes =
    options.ignoredErrorCodes ?? DEFAULT_IGNORED_DNSVIZ_ERROR_CODES;

  if (!isRecord(grok)) {
    return errorResult('grok output is not an object', {});
  }

  const leafKey = `${normalizedDomain.toLowerCase()}.`;
  const parentChainStatuses = extractParentChainStatuses(grok);

  const leafZone = pickLeafZone(grok, leafKey);
  if (!leafZone) {
    return errorResult(`no zone matches ${leafKey}`, parentChainStatuses);
  }

  const delegation = isRecord(leafZone.zone.delegation)
    ? leafZone.zone.delegation
    : undefined;
  const delegationStatus =
    typeof delegation?.status === 'string' ? delegation.status : null;
  const zoneStatus =
    typeof leafZone.zone.status === 'string' ? leafZone.zone.status : null;

  const errorsResult = collectMessages(
    leafZone.zone,
    'errors',
    ignoredErrorCodes,
  );
  const warningsResult = collectMessages(
    leafZone.zone,
    'warnings',
    ignoredErrorCodes,
  );

  const summary: DnsvizAnalysisSummary = {
    delegationStatus,
    zoneStatus,
    parentChainStatuses,
    topErrors: errorsResult.topErrors,
    topWarnings: warningsResult.topErrors,
    ignoredErrorsCount: errorsResult.ignoredCount,
    ignoredWarningsCount: warningsResult.ignoredCount,
  };

  const errorsCount = errorsResult.errorsCount;
  const warningsCount = warningsResult.errorsCount;

  const status = mapDelegationStatusToEnum(delegationStatus);
  return { status, errorsCount, warningsCount, summary };
}

function mapDelegationStatusToEnum(
  delegationStatus: string | null,
): DnsvizAnalysisStatus {
  switch (delegationStatus) {
    case 'SECURE':
      return 'SECURE';
    case 'INSECURE':
      return 'INSECURE';
    case 'BOGUS':
      return 'BOGUS';
    default:
      // Missing or unrecognized delegation status: treat as ERROR so it
      // shows up in the daily failure email for investigation.
      return 'ERROR';
  }
}

function pickLeafZone(
  grok: Record<string, unknown>,
  leafKey: string,
): { key: string; zone: Record<string, unknown> } | null {
  const direct = grok[leafKey];
  if (isRecord(direct)) {
    return { key: leafKey, zone: direct };
  }

  // Fallback: pick the deepest zone whose key is a label-boundary suffix
  // match, e.g. for an unexpected `foo.example.com` lookup, prefer
  // `example.com.` over `com.`. The root `.` is intentionally excluded —
  // it suffix-matches everything but tells us nothing about the leaf.
  let best: {
    key: string;
    zone: Record<string, unknown>;
    depth: number;
  } | null = null;
  for (const [zoneKey, zone] of Object.entries(grok)) {
    if (!isRecord(zone)) continue;
    const labels = zoneKey.split('.').filter(Boolean);
    if (labels.length === 0) continue; // root zone — skip
    // Match on label boundary so `xexample.com.` doesn't match `example.com.`.
    if (!leafKey.endsWith(`.${zoneKey}`) && leafKey !== zoneKey) continue;
    if (!best || labels.length > best.depth) {
      best = { key: zoneKey, zone, depth: labels.length };
    }
  }
  return best ? { key: best.key, zone: best.zone } : null;
}

function extractParentChainStatuses(
  grok: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [zoneKey, zone] of Object.entries(grok)) {
    if (!isRecord(zone)) continue;
    const delegation = isRecord(zone.delegation) ? zone.delegation : undefined;
    if (delegation && typeof delegation.status === 'string') {
      out[zoneKey] = delegation.status;
    } else if (typeof zone.status === 'string') {
      out[zoneKey] = zone.status;
    }
  }
  return out;
}

/**
 * Walk the leaf zone recursively, collecting `description` strings from any
 * objects nested under an `errors` or `warnings` array. Entries whose
 * `code` is in `ignoredCodes` are dropped — they don't count toward the
 * total and don't appear in `topErrors`. Cap at `MAX_TOP_MESSAGES` for the
 * summary; return the full count separately.
 *
 * Real-world example: a SECURE samyx.net probe yields ~8 raw entries
 * with `code: EXISTING_TYPE_NOT_IN_BITMAP`. With the default ignored set
 * those drop out and the SECURE row's `errorsCount` is correctly 0.
 */
function collectMessages(
  zone: Record<string, unknown>,
  key: 'errors' | 'warnings',
  ignoredCodes: ReadonlySet<string>,
): { topErrors: string[]; errorsCount: number; ignoredCount: number } {
  const top: string[] = [];
  let count = 0;
  let ignoredCount = 0;

  const visit = (node: unknown) => {
    if (!isRecord(node)) {
      if (Array.isArray(node)) {
        for (const child of node) visit(child);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === key && Array.isArray(v)) {
        for (const entry of v) {
          if (
            isRecord(entry) &&
            typeof entry.code === 'string' &&
            ignoredCodes.has(entry.code)
          ) {
            ignoredCount++;
            continue;
          }
          count++;
          if (top.length < MAX_TOP_MESSAGES) {
            const description = isRecord(entry)
              ? typeof entry.description === 'string'
                ? entry.description
                : JSON.stringify(entry).slice(0, 200)
              : String(entry).slice(0, 200);
            top.push(description);
          }
        }
      } else {
        visit(v);
      }
    }
  };

  visit(zone);
  return { topErrors: top, errorsCount: count, ignoredCount };
}

function errorResult(
  message: string,
  parentChainStatuses: Record<string, string>,
): DeriveResult {
  return {
    status: 'ERROR',
    errorsCount: 1,
    warningsCount: 0,
    summary: {
      delegationStatus: null,
      zoneStatus: null,
      parentChainStatuses,
      topErrors: [message],
      topWarnings: [],
      ignoredErrorsCount: 0,
      ignoredWarningsCount: 0,
    },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface DnsvizMessageEntry {
  /** Trailing-dot zone the message came from (e.g. `samyx.net.`). */
  zone: string;
  /**
   * Dotted path within the zone (e.g.
   * `queries.samyx.net./IN/CNAME.nodata[0].proof[0].errors[0]`). Useful
   * for finding the exact location in the raw grok JSON.
   */
  path: string;
  /** dnsviz error/warning code, when present. */
  code: string | null;
  /** Human-readable description from dnsviz. */
  description: string;
  /** True when `code` is in the ignored set — surfaces these as
   *  "informational" instead of dropping them entirely. */
  ignored: boolean;
  severity: 'error' | 'warning';
}

/**
 * Walk every zone in a grok output and return all `errors[]` /
 * `warnings[]` entries with full paths. Used by the admin
 * `getAnalysisDetails` procedure to populate the per-row details modal —
 * unlike `deriveDnsvizStatus` which caps + filters for the digest summary,
 * this returns everything dnsviz produced so an operator can drill in.
 */
export function extractAllDnsvizMessages(
  grok: unknown,
  options: { ignoredErrorCodes?: ReadonlySet<string> } = {},
): DnsvizMessageEntry[] {
  const ignored =
    options.ignoredErrorCodes ?? DEFAULT_IGNORED_DNSVIZ_ERROR_CODES;
  if (!isRecord(grok)) return [];

  const out: DnsvizMessageEntry[] = [];
  for (const [zoneName, zoneVal] of Object.entries(grok)) {
    if (!isRecord(zoneVal)) continue;
    for (const severity of ['errors', 'warnings'] as const) {
      walkMessageArrays(zoneVal, '', severity, (path, entry) => {
        const isObj = isRecord(entry);
        const code =
          isObj && typeof entry.code === 'string' ? entry.code : null;
        const description = isObj
          ? typeof entry.description === 'string'
            ? entry.description
            : JSON.stringify(entry).slice(0, 800)
          : String(entry).slice(0, 800);
        out.push({
          zone: zoneName,
          path,
          code,
          description,
          ignored: code !== null && ignored.has(code),
          severity: severity === 'errors' ? 'error' : 'warning',
        });
      });
    }
  }
  return out;
}

function walkMessageArrays(
  node: unknown,
  pathPrefix: string,
  key: 'errors' | 'warnings',
  callback: (path: string, entry: unknown) => void,
): void {
  if (!isRecord(node)) {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        walkMessageArrays(node[i], `${pathPrefix}[${i}]`, key, callback);
      }
    }
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    const newPath = pathPrefix === '' ? k : `${pathPrefix}.${k}`;
    if (k === key && Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        callback(`${newPath}[${i}]`, v[i]);
      }
    } else {
      walkMessageArrays(v, newPath, key, callback);
    }
  }
}
