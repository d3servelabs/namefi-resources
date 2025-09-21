import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'analytics-parser' });

// Minimal GA4 RunReport response row shape we rely on
export interface GaReportRow {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
}

export interface GaReportLike {
  rows?: GaReportRow[] | null;
}

export interface DnsAnalyticsReportRaw {
  topDomains: GaReportLike;
  queriesByResponseCode: GaReportLike; // already mapped to names by backend
  queriesByType: GaReportLike;
  cacheHitRatio: GaReportLike; // dim: customEvent:cache_hit ("true" | "false")
  topClientIps: GaReportLike;
  dnssecStats: GaReportLike; // already normalized by backend
  hourlyVolume: GaReportLike; // dim: dateHour (YYYYMMDDHH)
  dailyVolume: GaReportLike; // dim: date (YYYYMMDD)
  publicSuffix: GaReportLike;
  publicSuffixPlusOne: GaReportLike;
}

export interface DnsAnalyticsSummary {
  totalQueries: number;
  uniqueDomains: number;
  cacheHitRatePercent: number | null; // 0-100; null if not computable
  uniqueClientIps: number;
  /** Optional top client IP details when enabled via options */
  topClientIpsDetails?: Array<{ ip: string; count: number }>;
}

export interface DnsAnalyticsSeriesPoint<
  TName extends string,
  TValue = number,
> {
  name: TName;
  count: TValue extends number ? number : never;
}

export interface DnsAnalyticsParsed {
  summary: DnsAnalyticsSummary;
  topDomains: Array<{ domain: string; count: number }>;
  queriesByResponseCode: Array<{ rcode: string; count: number }>; // e.g. "NOERROR(0)"
  queriesByType: Array<{ queryType: string; count: number }>;
  cacheHitBreakdown: {
    hits: number;
    misses: number;
    hitRatePercent: number | null;
  };
  topClientIps: Array<{ ip: string; count: number }>;
  dnssecStats: Array<{ status: string; count: number }>; // e.g. "DNSSEC Enabled" | "No DNSSEC"
  hourlyVolume: Array<{ dateHour: string; count: number }>; // dateHour as GA format: YYYYMMDDHH
  dailyVolume: Array<{ date: string; count: number }>; // date as GA format: YYYYMMDD
  publicSuffix: Array<{ publicSuffix: string; count: number }>;
  publicSuffixPlusOne: Array<{ domain: string; count: number }>;
}

export interface ParseDnsAnalyticsOptions {
  /** Include top client IP details inside summary.topClientIpsDetails */
  includeIpDetails?: boolean;
  /** Number of IPs to include when includeIpDetails is true (default: 10) */
  ipDetailsLimit?: number;
}

function toInt(value: string | null | undefined): number {
  const parsed = Number.parseInt((value ?? '').toString(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeGetDim(row: GaReportRow, index = 0): string {
  return row?.dimensionValues?.[index]?.value ?? '';
}

function safeGetMetric(row: GaReportRow, index = 0): number {
  return toInt(row?.metricValues?.[index]?.value ?? '0');
}

/**
 * Parse a GA4 report into an array of name/count pairs.
 */
function parseNameCount(
  report: GaReportLike | undefined,
  nameSelector: (row: GaReportRow) => string,
  metricIndex = 0,
): Array<{ name: string; count: number }> {
  if (!report?.rows || report.rows.length === 0) return [];
  return report.rows.map((row) => ({
    name: nameSelector(row),
    count: safeGetMetric(row, metricIndex),
  }));
}

/**
 * Produce a frontend-friendly, typed view of the analytics reports.
 * Accepts the raw object returned by getDashboardOverview/getFullReportByRecordName.
 */
export function parseDnsAnalyticsReportData(
  raw: DnsAnalyticsReportRaw,
  options?: ParseDnsAnalyticsOptions,
): DnsAnalyticsParsed {
  try {
    // Totals and summary
    const totalQueries = (raw.dailyVolume.rows ?? []).reduce((sum, row) => {
      return sum + safeGetMetric(row, 0);
    }, 0);

    const uniqueDomains = (raw.topDomains.rows ?? []).length;
    const uniqueClientIps = (raw.topClientIps.rows ?? []).length;

    // Cache hit breakdown
    let hits = 0;
    let misses = 0;
    for (const row of raw.cacheHitRatio.rows ?? []) {
      const key = (safeGetDim(row, 0) || '').toLowerCase();
      const count = safeGetMetric(row, 0);
      if (key === 'true' || key === '1') hits += count;
      else if (
        key === 'false' ||
        key === '0' ||
        key === '' ||
        key === '(not set)'
      )
        misses += count;
      else misses += count; // treat unknown as miss
    }
    const denom = hits + misses;
    const cacheHitRatePercent = denom > 0 ? (hits / denom) * 100 : null;

    // Top domains
    const topDomains = parseNameCount(raw.topDomains, (row) =>
      safeGetDim(row, 0),
    ).map((it) => ({ domain: it.name, count: it.count }));

    // Queries by response code (already mapped to human-friendly label by router)
    const queriesByResponseCode = parseNameCount(
      raw.queriesByResponseCode,
      (row) => safeGetDim(row, 0) || '(not set)',
    ).map((it) => ({ rcode: it.name, count: it.count }));

    // Queries by type
    const queriesByType = parseNameCount(
      raw.queriesByType,
      (row) => safeGetDim(row, 0) || '(not set)',
    ).map((it) => ({ queryType: it.name, count: it.count }));

    // Top client IPs
    const topClientIps = parseNameCount(
      raw.topClientIps,
      (row) => safeGetDim(row, 0) || '(not set)',
    ).map((it) => ({ ip: it.name, count: it.count }));

    // DNSSEC stats (already normalized by router)
    const dnssecStats = parseNameCount(
      raw.dnssecStats,
      (row) => safeGetDim(row, 0) || '(not set)',
    ).map((it) => ({ status: it.name, count: it.count }));

    // Hourly and daily volumes
    const hourlyVolume = parseNameCount(
      raw.hourlyVolume,
      (row) => safeGetDim(row, 0) || '',
    ).map((it) => ({ dateHour: it.name, count: it.count }));

    const dailyVolume = parseNameCount(
      raw.dailyVolume,
      (row) => safeGetDim(row, 0) || '',
    ).map((it) => ({ date: it.name, count: it.count }));

    // Public suffix and plus one
    const publicSuffix = parseNameCount(
      raw.publicSuffix,
      (row) => safeGetDim(row, 0) || '',
    )
      .filter((it) => it.name && it.name !== '(not set)')
      .map((it) => ({ publicSuffix: it.name, count: it.count }));

    const publicSuffixPlusOne = parseNameCount(
      raw.publicSuffixPlusOne,
      (row) => safeGetDim(row, 0) || '',
    )
      .filter((it) => it.name && it.name !== '(not set)')
      .map((it) => ({ domain: it.name, count: it.count }));

    const summary: DnsAnalyticsSummary = {
      totalQueries,
      uniqueDomains,
      cacheHitRatePercent:
        cacheHitRatePercent === null
          ? null
          : Number(cacheHitRatePercent.toFixed(1)),
      uniqueClientIps,
    };

    if (options?.includeIpDetails) {
      const limit = Math.max(0, Math.min(100, options.ipDetailsLimit ?? 10));
      summary.topClientIpsDetails = topClientIps.slice(0, limit);
    }

    const parsed: DnsAnalyticsParsed = {
      summary,
      topDomains,
      queriesByResponseCode,
      queriesByType,
      cacheHitBreakdown: {
        hits,
        misses,
        hitRatePercent:
          cacheHitRatePercent === null
            ? null
            : Number(cacheHitRatePercent.toFixed(1)),
      },
      topClientIps,
      dnssecStats,
      hourlyVolume,
      dailyVolume,
      publicSuffix,
      publicSuffixPlusOne,
    };

    return parsed;
  } catch (error) {
    logger.error({ error }, 'Failed to parse DNS analytics report data');
    // Fail closed with minimal structure to avoid crashing callers
    return {
      summary: {
        totalQueries: 0,
        uniqueDomains: 0,
        cacheHitRatePercent: null,
        uniqueClientIps: 0,
      },
      topDomains: [],
      queriesByResponseCode: [],
      queriesByType: [],
      cacheHitBreakdown: { hits: 0, misses: 0, hitRatePercent: null },
      topClientIps: [],
      dnssecStats: [],
      hourlyVolume: [],
      dailyVolume: [],
      publicSuffix: [],
      publicSuffixPlusOne: [],
    };
  }
}
