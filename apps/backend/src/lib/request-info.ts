import type { Context as HonoContext } from 'hono';
import type { ConnInfo } from 'hono/conninfo';

/**
 * Source of the IP/geo/device info we ended up using for a request.
 * Useful for logs + per-row `isGoogleLB` persistence.
 */
export type RequestInfoSource =
  | 'google-lb'
  | 'forwarded-for'
  | 'conn-info'
  | 'unknown';

export interface RequestGeo {
  /** City name ("Mountain View"). */
  city: string | null;
  /** Unicode CLDR subdivision ID (e.g. "USCA", "CAON"). */
  subdivision: string | null;
  /** Unicode CLDR region code ≈ ISO-3166-1 alpha-2 ("US", "FR"). */
  regionCode: string | null;
  /** Latitude in decimal degrees, if the LB resolved it. */
  lat: number | null;
  /** Longitude in decimal degrees, if the LB resolved it. */
  lng: number | null;
}

export interface RequestInfo {
  /** Best-known public client IP. Falls back to 'unknown'. */
  ipAddress: string;
  /** Where `ipAddress` / `geo` came from. */
  source: RequestInfoSource;
  geo: RequestGeo;
  /** Google LB's bucketed UA family ("APPLEWEBKIT", "GECKO", …). */
  userAgentFamily: string | null;
  /** Google LB's device bucket ("DESKTOP", "MOBILE", …). */
  deviceType: string | null;
  /** Client protocol ("HTTP/1.1", "HTTP/2", "HTTP/3"). */
  protocol: string | null;
  /** True iff the request arrived through the Google Cloud LB. */
  isGoogleLB: boolean;
  /**
   * Browser fingerprint hash (FingerprintJS visitorId), set by the
   * frontend in `X-Browser-Fingerprint`. Null if the client didn't send
   * one (privacy mode, ad-blocker, non-browser caller). Always trusted
   * for *recognition* (suppress alert) but not for *authentication*; a
   * forged value can only ever cause an email alert to be skipped, not
   * an auth bypass.
   */
  browserFingerprint: string | null;
}

const EMPTY_GEO: RequestGeo = {
  city: null,
  subdivision: null,
  regionCode: null,
  lat: null,
  lng: null,
};

function parseLatLongPair(value: string | null | undefined): {
  lat: number | null;
  lng: number | null;
} {
  if (!value) return { lat: null, lng: null };
  const [rawLat, rawLng] = value.split(',', 2).map((part) => part.trim());
  const lat = rawLat ? Number.parseFloat(rawLat) : Number.NaN;
  const lng = rawLng ? Number.parseFloat(rawLng) : Number.NaN;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function firstForwardedFor(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first ? first : null;
}

function emptyish(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolves per-request identity metadata (IP, approximate geo, device) with
 * Google Cloud Load Balancer headers as the source of truth when present,
 * falling back to Hono's `connInfo` + `X-Forwarded-For` otherwise.
 *
 * Keep this pure so it can be called once in the Hono middleware and stashed
 * on the request context — downstream (tRPC ctx, login-notification flow,
 * logger) should never re-parse the same headers.
 *
 * SECURITY — DEPLOYMENT INVARIANT
 * --------------------------------
 * This function trusts `X-GCLOUD-LB` and the sibling `X-Client-*` /
 * `X-Forwarded-For` headers as authoritative. That assumption is only safe
 * when the backend is **only reachable through the Google Cloud Load
 * Balancer** (or another trusted proxy that strips/sets these headers on
 * inbound traffic). If the backend port is also exposed directly (any
 * untrusted client can connect), an attacker can simply send their own
 * `X-GCLOUD-LB: true` + spoofed `X-Client-Ip-Address` / geo headers and
 * this function will believe them — corrupting login-history rows,
 * "new IP" / "new location" detection, audit logs, and rate limiting.
 *
 * If you cannot guarantee LB-only ingress, harden this by validating
 * `connInfo.remote.address` against a known-good GCLB IP range
 * (https://www.gstatic.com/ipranges/cloud.json) or your platform's
 * trusted-proxy CIDR list before honoring any of the header values, and
 * fall back to the connInfo-only path otherwise.
 */
export function resolveRequestInfo(
  c: HonoContext,
  connInfo: ConnInfo | undefined,
): RequestInfo {
  // The `X-GCLOUD-LB: true` flag is set by our LB config (see
  // `apps/backend/src/lib/google-lb-headers.ts`) and is what gates whether
  // we read the rest of the `X-Client-*` headers. SAFE only under the
  // deployment invariant documented above — direct exposure makes this
  // header trivially forgeable.
  const googleLbFlag = c.req.header('X-GCLOUD-LB')?.toLowerCase();
  const isGoogleLb = googleLbFlag === 'true';

  // The browser fingerprint is sent by our own frontend regardless of
  // whether traffic arrives via GCLB; the LB passes the header through
  // unchanged. Read it once and merge into every return path.
  const browserFingerprint = emptyish(c.req.header('X-Browser-Fingerprint'));

  if (isGoogleLb) {
    const ip =
      emptyish(c.req.header('X-Client-Ip-Address')) ??
      firstForwardedFor(c.req.header('X-Forwarded-For')) ??
      connInfo?.remote?.address ??
      'unknown';

    const { lat, lng } = parseLatLongPair(
      c.req.header('X-Client-Geo-Location-City-Coordinates'),
    );

    return {
      ipAddress: ip,
      source: 'google-lb',
      geo: {
        city: emptyish(c.req.header('X-Client-Geo-Location-City')),
        subdivision: emptyish(
          c.req.header('X-Client-Geo-Location-Region-Subdivision'),
        ),
        regionCode: emptyish(c.req.header('X-Client-Geo-Location-Region')),
        lat,
        lng,
      },
      userAgentFamily: emptyish(c.req.header('X-Client-User-Agent-Family')),
      deviceType: emptyish(c.req.header('X-Client-Device-Type')),
      protocol: emptyish(c.req.header('X-Client-Proto')),
      isGoogleLB: true,
      browserFingerprint,
    };
  }

  const forwarded = firstForwardedFor(c.req.header('X-Forwarded-For'));
  if (forwarded) {
    return {
      ipAddress: forwarded,
      source: 'forwarded-for',
      geo: EMPTY_GEO,
      userAgentFamily: null,
      deviceType: null,
      protocol: null,
      isGoogleLB: false,
      browserFingerprint,
    };
  }

  const connIp = emptyish(connInfo?.remote?.address ?? null);
  if (connIp) {
    return {
      ipAddress: connIp,
      source: 'conn-info',
      geo: EMPTY_GEO,
      userAgentFamily: null,
      deviceType: null,
      protocol: null,
      isGoogleLB: false,
      browserFingerprint,
    };
  }

  return {
    ipAddress: 'unknown',
    source: 'unknown',
    geo: EMPTY_GEO,
    userAgentFamily: null,
    deviceType: null,
    protocol: null,
    isGoogleLB: false,
    browserFingerprint,
  };
}
