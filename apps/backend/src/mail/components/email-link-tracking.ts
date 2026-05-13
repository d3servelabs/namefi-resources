import { randomUUID } from 'node:crypto';
import { mailSecrets } from '../env';
import { buildEmailAnalyticsUrl } from './email-tracking';

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

const TRACK_LINK_SUFFIX_REGEX = /@TrackLink(?:\(([^)]*)\))?$/;
const HREF_TRACK_LINK_REGEX =
  /href=(["'])([^"']*?)@TrackLink(?:\(([^"']*?)\))?\1/g;

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
  /** Full URL to the email-open tracking endpoint — see `buildEmailTrackedLink`. */
  trackUrl: string;
  /** Free-form campaign identifier applied to every rewritten link. */
  campaignKey: string;
  /** Optional recipient email — applied to every rewritten link. */
  userEmail?: string;
};

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
  options: RewriteTrackLinksOptions,
): Promise<string> {
  const matches = [...html.matchAll(HREF_TRACK_LINK_REGEX)];
  if (matches.length === 0) {
    return html;
  }

  const replacements = await Promise.all(
    matches.map(async (match) => {
      const quote = (match[1] === "'" ? "'" : '"') as '"' | "'";
      // react-email entity-encodes `&` in hrefs (and may encode other chars).
      // Decode before signing so the JWT payload carries the real URL.
      const destinationUrl = decodeHtmlEntities(match[2]);
      const groupIdentifier = match[3];

      const trackedUrl = await buildEmailTrackedLink({
        trackUrl: options.trackUrl,
        destinationUrl,
        campaignKey: options.campaignKey,
        groupIdentifier: groupIdentifier?.trim() || undefined,
        userEmail: options.userEmail,
      });

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
