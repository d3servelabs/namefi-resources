import { randomUUID } from 'node:crypto';
import { mailSecrets } from '../env';
import {
  EMAIL_CAMPAIGN_KEY_META_NAME,
  buildEmailAnalyticsUrl,
} from './email-tracking';

export type BuildEmailTrackedLinkOptions = {
  /**
   * Full URL to the email-open tracking endpoint (e.g.
   * `https://app.namefi.io/v1/email/analytics/open`). The click endpoint
   * URL is derived from this by replacing the trailing `/open` segment with
   * `/click` — both endpoints live on the same router by convention.
   */
  trackUrl: string;
  /** Destination URL the user is redirected to after the click is logged. */
  destinationUrl: string;
  /** Free-form campaign identifier; matches `email_campaign_sends.campaign_key` style. */
  campaignKey: string;
  /** Optional sub-grouping within the campaign (e.g. `cta-button`). */
  groupIdentifier?: string;
  /** Optional recipient email — carried in the JWT for trace logging only; not stored. */
  userEmail?: string;
  /** Optional pre-generated nonce. If omitted, a random UUID is used. */
  nonce?: string;
};

// Case-insensitive: WHATWG URL parsing (and some downstream sanitizers) can
// lowercase the host when a URL like `https://example.com@TrackLink(cta)` is
// re-serialized — the part after `@` is treated as the host and lowercased
// to `tracklink(cta)`. Matching case-insensitively means we still recognize
// (and strip) the sentinel after that has happened.
const TRACK_LINK_SUFFIX_REGEX = /@TrackLink(?:\(([^)]*)\))?$/i;
const HREF_TRACK_LINK_REGEX =
  /href=(["'])([^"']*?)@TrackLink(?:\(([^"']*?)\))?\1/gi;

/**
 * Build a tracking redirect URL for a single destination URL.
 *
 * Returns the tracked URL on success, or the original `destinationUrl`
 * unchanged when tracking is unavailable (e.g. `EMAIL_TRACKING_JWT_SECRET`
 * is not configured) so callers never have to handle a failure case at the
 * template layer.
 */
export async function buildEmailTrackedLink(
  options: BuildEmailTrackedLinkOptions,
): Promise<string> {
  if (!mailSecrets.EMAIL_TRACKING_JWT_SECRET) {
    return options.destinationUrl;
  }

  const clickTrackUrl = deriveClickTrackUrl(options.trackUrl);
  if (!clickTrackUrl) {
    return options.destinationUrl;
  }

  const result = await buildEmailAnalyticsUrl({
    trackUrl: clickTrackUrl,
    data: {
      type: 'campaign_link_click',
      campaignKey: options.campaignKey,
      groupIdentifier: options.groupIdentifier,
      destinationUrl: options.destinationUrl,
      userEmail: options.userEmail,
      nonce: options.nonce ?? randomUUID(),
    },
  });

  return result.url ?? options.destinationUrl;
}

export type RewriteTrackLinksOptions = {
  /**
   * Full URL to the email-open tracking endpoint — see
   * `buildEmailTrackedLink`. Optional: when omitted, the rewriter still
   * runs and strips the `@TrackLink` sentinel from every matched href
   * (so the destination URL still works), but no click-tracking wrapper
   * is applied.
   */
  trackUrl?: string;
  /**
   * Free-form campaign identifier applied to every rewritten link. When
   * omitted, the rewriter scans the input HTML for a hidden
   * `<meta name="namefi-campaign-key" content="...">` marker (emitted by
   * `NamefiEmailContainer` when an `EmailTrackingProvider` carries a
   * `campaignKey`). If neither is present, the sentinel is still stripped
   * but the link is left as-is (clicks aren't tracked).
   */
  campaignKey?: string;
  /** Optional recipient email — applied to every rewritten link. */
  userEmail?: string;
};

/**
 * Matches `<meta name="namefi-campaign-key" content="...">` (any attribute
 * order, single or double quotes). Used as a fallback when the caller
 * doesn't pass `campaignKey` explicitly.
 */
const CAMPAIGN_KEY_META_REGEX = new RegExp(
  `<meta\\s+(?:[^>]*?\\s+)?(?:name=(["'])${EMAIL_CAMPAIGN_KEY_META_NAME}\\1\\s+(?:[^>]*?\\s+)?content=(["'])([^"']*)\\2|content=(["'])([^"']*)\\4\\s+(?:[^>]*?\\s+)?name=(["'])${EMAIL_CAMPAIGN_KEY_META_NAME}\\6)[^>]*?>`,
  'i',
);

export function extractCampaignKeyFromHtml(html: string): string | null {
  const match = html.match(CAMPAIGN_KEY_META_REGEX);
  if (!match) return null;
  // Either capture group (3) or (5) holds the content depending on attribute order.
  const value = (match[3] ?? match[5] ?? '').trim();
  return value.length > 0 ? value : null;
}

/**
 * Scan rendered email HTML for hrefs ending in the literal sentinel
 * `@TrackLink` (no group) or `@TrackLink(<group-identifier>)`, strip the
 * sentinel, and rewrap the URL with a click-tracking redirect.
 *
 * If tracking can't be configured (e.g. missing JWT secret) the sentinel is
 * still stripped so the original URL works — opens just won't be counted.
 *
 * The scan only matches when the sentinel appears at the very end of an
 * `href` attribute value, so URLs that legitimately contain the substring
 * `@TrackLink` mid-path are not affected.
 */
export async function rewriteTrackLinksInHtml(
  html: string,
  options: RewriteTrackLinksOptions = {},
): Promise<string> {
  const matches = [...html.matchAll(HREF_TRACK_LINK_REGEX)];
  if (matches.length === 0) {
    return html;
  }

  const resolvedCampaignKey =
    options.campaignKey ?? extractCampaignKeyFromHtml(html) ?? null;
  // We can only build a tracked redirect when both a track endpoint URL and
  // a resolvable campaign key are available. Either missing → strip the
  // sentinel only.
  const canTrack = Boolean(options.trackUrl && resolvedCampaignKey);

  const replacements = await Promise.all(
    matches.map(async (match) => {
      const quote = (match[1] === "'" ? "'" : '"') as '"' | "'";
      // react-email entity-encodes `&` in hrefs (and may encode other chars).
      // Decode before signing so the JWT payload carries the real URL.
      const destinationUrl = decodeHtmlEntities(match[2]);
      const groupIdentifier = match[3];

      const trackedUrl =
        canTrack && options.trackUrl && resolvedCampaignKey
          ? await buildEmailTrackedLink({
              trackUrl: options.trackUrl,
              destinationUrl,
              campaignKey: resolvedCampaignKey,
              groupIdentifier: groupIdentifier?.trim() || undefined,
              userEmail: options.userEmail,
            })
          : destinationUrl;

      return {
        original: match[0],
        replacement: `href=${quote}${escapeHrefValue(trackedUrl, quote)}${quote}`,
      };
    }),
  );

  let index = 0;
  return html.replace(
    HREF_TRACK_LINK_REGEX,
    () => replacements[index++].replacement,
  );
}

/**
 * Strip the `@TrackLink` sentinel from a raw URL without doing any tracking
 * work. Useful for tests or for previewing the destination URL out of band.
 */
export function stripTrackLinkSuffix(url: string): {
  url: string;
  groupIdentifier?: string;
} {
  const match = url.match(TRACK_LINK_SUFFIX_REGEX);
  if (!match) {
    return { url };
  }
  return {
    url: url.slice(0, match.index),
    groupIdentifier: match[1]?.trim() || undefined,
  };
}

function deriveClickTrackUrl(openTrackUrl: string): string | null {
  try {
    const url = new URL(openTrackUrl);
    if (url.pathname.endsWith('/open')) {
      url.pathname = `${url.pathname.slice(0, -'/open'.length)}/click`;
      return url.toString();
    }
    // Fallback: last path segment is something else; replace it with `click`.
    const segments = url.pathname.split('/');
    segments[segments.length - 1] = 'click';
    url.pathname = segments.join('/');
    return url.toString();
  } catch {
    return null;
  }
}

function escapeHrefValue(value: string, quote: '"' | "'"): string {
  // Always escape `&`. Then escape whichever quote-character bounds the
  // attribute so the value can never close it prematurely. For
  // single-quoted attributes that means escaping `'` too — a URL
  // produced by `URL.toString()` won't normally contain one, but
  // user-controlled `destinationUrl` from a JWT payload might.
  const escaped = value.replace(/&/g, '&amp;');
  return quote === "'"
    ? escaped.replace(/'/g, '&#39;')
    : escaped.replace(/"/g, '&quot;');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
