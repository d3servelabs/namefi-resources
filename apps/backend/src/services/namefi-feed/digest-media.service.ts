import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import type { NamefiFeedSalesDigestFormattedPick } from '@namefi-astra/ai';
import type { NamefiFeedSalesDigestAnimationResult } from './digest.service';

export const SALES_DIGEST_TOP_PICK_LOGO_LIMIT = 2;
export const SALES_DIGEST_HERO_IMAGE_ALT_TEXT =
  'Daily Namefi Feed digest word cloud.';
export const SALES_DIGEST_HERO_IMAGE_CAPTION = 'Daily Namefi Feed sales digest';
export const SALES_DIGEST_HERO_ANIMATION_ALT_TEXT =
  'Daily Namefi Feed animated sales digest.';
export const SALES_DIGEST_HERO_ANIMATION_CAPTION =
  'Daily Namefi Feed sales digest animation';

const SALES_DIGEST_MEDIA_FETCH_TIMEOUT_MS = 8000;
const SALES_DIGEST_TRUSTED_LOGO_HOSTS = new Set(['pbs.twimg.com']);
const IMAGE_DATA_URL_PATTERN =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;
const FILENAME_UNSAFE_PATTERN = /[^a-z0-9.-]+/g;
const FILENAME_EDGE_DASH_PATTERN = /^-+|-+$/g;
const REMOTE_IMAGE_HOSTNAME_BRACKET_PATTERN = /^\[|\]$/g;
const REMOTE_IMAGE_HOSTNAME_TRAILING_DOT_PATTERN = /\.$/;
const BLOCKED_IPV4_SUBNETS: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];
const BLOCKED_IPV6_SUBNETS: Array<[string, number]> = [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
];
const SALES_DIGEST_BLOCKED_REMOTE_IMAGE_IPS =
  buildSalesDigestBlockedRemoteImageIps();

type SalesDigestHostnameLookup = (
  hostname: string,
) => Promise<Array<{ address: string; family?: number }>>;

export interface SalesDigestHeroImageAttachment {
  kind: 'hero_image';
  dataUrl: string;
  altText: string;
  caption: string;
  title: string;
  filenameBase: string;
}

export interface SalesDigestHeroAnimationAttachment {
  kind: 'hero_animation';
  url: string;
  mimeType: string;
  altText: string;
  caption: string;
  title: string;
  filenameBase: string;
}

export interface SalesDigestTopPickLogoAttachment {
  kind: 'top_pick_logo';
  domain: string;
  logoUrl: string;
  altText: string;
  caption: string;
  title: string;
  filenameBase: string;
  rank: number;
}

export interface SalesDigestMediaPlan {
  heroMedia: SalesDigestHeroMediaAttachment | null;
  heroAnimation: SalesDigestHeroAnimationAttachment | null;
  heroImage: SalesDigestHeroImageAttachment | null;
  topPickLogos: SalesDigestTopPickLogoAttachment[];
}

export type SalesDigestHeroMediaAttachment =
  | SalesDigestHeroAnimationAttachment
  | SalesDigestHeroImageAttachment;

export type SalesDigestImageAttachment =
  | SalesDigestHeroImageAttachment
  | SalesDigestTopPickLogoAttachment;

export type SalesDigestMediaAttachment =
  | SalesDigestHeroMediaAttachment
  | SalesDigestTopPickLogoAttachment;

export interface SalesDigestLoadedImage {
  bytes: Uint8Array;
  dataUrl: string;
  extension: string;
  mimeType: string;
}

export function buildSalesDigestMediaPlan(
  digestRender: {
    imageDataUrl: string | null;
    topPicks: NamefiFeedSalesDigestFormattedPick[];
    animation?: NamefiFeedSalesDigestAnimationResult | null;
  },
  options: { logoLimit?: number } = {},
): SalesDigestMediaPlan {
  const logoLimit = Math.max(
    0,
    options.logoLimit ?? SALES_DIGEST_TOP_PICK_LOGO_LIMIT,
  );
  const animationUrl = normalizeOptionalText(digestRender.animation?.url);
  const heroAnimation = animationUrl
    ? {
        kind: 'hero_animation' as const,
        url: animationUrl,
        mimeType: digestRender.animation?.mimeType ?? 'video/mp4',
        altText: SALES_DIGEST_HERO_ANIMATION_ALT_TEXT,
        caption: SALES_DIGEST_HERO_ANIMATION_CAPTION,
        title: 'Daily Digest Animation',
        filenameBase: 'daily-digest-animation',
      }
    : null;
  const imageDataUrl = normalizeOptionalText(digestRender.imageDataUrl);
  const heroImage = imageDataUrl
    ? {
        kind: 'hero_image' as const,
        dataUrl: imageDataUrl,
        altText: SALES_DIGEST_HERO_IMAGE_ALT_TEXT,
        caption: SALES_DIGEST_HERO_IMAGE_CAPTION,
        title: 'Daily Digest Word Cloud',
        filenameBase: 'daily-digest-wordcloud',
      }
    : null;

  return {
    heroMedia: heroAnimation ?? heroImage,
    heroAnimation,
    heroImage,
    topPickLogos: digestRender.topPicks
      .slice(0, logoLimit)
      .map((pick, index) => {
        const domain = normalizeOptionalText(pick.domain);
        const logoUrl = normalizeOptionalText(pick.logoUrl);
        if (!domain || !logoUrl) {
          return null;
        }

        return {
          kind: 'top_pick_logo' as const,
          domain,
          logoUrl,
          altText: `${domain} logo.`,
          caption: `Top pick logo: ${domain}`,
          title: `${domain} logo`,
          filenameBase: `daily-digest-${sanitizeFilenamePart(domain)}-logo`,
          rank: index + 1,
        };
      })
      .filter((attachment): attachment is SalesDigestTopPickLogoAttachment =>
        Boolean(attachment),
      ),
  };
}

export async function loadSalesDigestHeroMediaAttachment(
  attachment: SalesDigestHeroMediaAttachment,
): Promise<SalesDigestLoadedImage | null> {
  if (attachment.kind === 'hero_image') {
    return loadSalesDigestImageAttachment(attachment);
  }

  try {
    const response = await fetch(attachment.url, {
      signal: AbortSignal.timeout(SALES_DIGEST_MEDIA_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }

    const mimeType =
      normalizeMediaMimeType(attachment.mimeType) ??
      normalizeMediaMimeType(response.headers.get('content-type'));
    if (!mimeType) {
      return null;
    }

    const bytes = Uint8Array.from(Buffer.from(await response.arrayBuffer()));
    if (bytes.length === 0) {
      return null;
    }

    return {
      bytes,
      dataUrl: buildMediaDataUrl({ bytes, mimeType }),
      extension: resolveMediaExtension(mimeType),
      mimeType,
    };
  } catch {
    return null;
  }
}

export async function loadSalesDigestImageAttachment(
  attachment: SalesDigestImageAttachment,
  options: { lookupHostname?: SalesDigestHostnameLookup } = {},
): Promise<SalesDigestLoadedImage | null> {
  const source =
    attachment.kind === 'hero_image' ? attachment.dataUrl : attachment.logoUrl;
  const dataUrlImage = parseImageDataUrl(source);
  if (dataUrlImage) {
    return dataUrlImage;
  }

  if (attachment.kind === 'hero_image') {
    return null;
  }

  try {
    if (
      !(await isAllowedSalesDigestRemoteImageUrl(
        source,
        options.lookupHostname,
      ))
    ) {
      return null;
    }

    const response = await fetch(source, {
      redirect: 'manual',
      signal: AbortSignal.timeout(SALES_DIGEST_MEDIA_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }

    const mimeType = normalizeImageMimeType(
      response.headers.get('content-type'),
    );
    if (!mimeType) {
      return null;
    }

    const bytes = Uint8Array.from(Buffer.from(await response.arrayBuffer()));
    if (bytes.length === 0) {
      return null;
    }

    return {
      bytes,
      dataUrl: buildMediaDataUrl({ bytes, mimeType }),
      extension: resolveImageExtension(mimeType),
      mimeType,
    };
  } catch {
    return null;
  }
}

export async function isAllowedSalesDigestRemoteImageUrl(
  source: string,
  lookupHostname: SalesDigestHostnameLookup = lookupSalesDigestRemoteImageHostname,
): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return false;
  }

  const hostname = normalizeRemoteImageHostname(url.hostname);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !SALES_DIGEST_TRUSTED_LOGO_HOSTS.has(hostname)
  ) {
    return false;
  }

  try {
    const resolved = await lookupHostname(hostname);
    return (
      resolved.length > 0 &&
      resolved.every((record) => isPublicRoutableIpAddress(record.address))
    );
  } catch {
    return false;
  }
}

export function buildSalesDigestMediaFilename(
  attachment: SalesDigestMediaAttachment,
  at: Date,
  extension: string,
): string {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, '0');
  const day = String(at.getUTCDate()).padStart(2, '0');
  return `${attachment.filenameBase}-${year}${month}${day}.${extension}`;
}

export function parseImageDataUrl(
  value: string,
): SalesDigestLoadedImage | null {
  const match = value.match(IMAGE_DATA_URL_PATTERN);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  const mimeType = normalizeImageMimeType(match[1]);
  if (!mimeType) {
    return null;
  }

  const bytes = Uint8Array.from(Buffer.from(match[2], 'base64'));
  if (bytes.length === 0) {
    return null;
  }

  return {
    bytes,
    dataUrl: buildMediaDataUrl({ bytes, mimeType }),
    extension: resolveImageExtension(mimeType),
    mimeType,
  };
}

function buildMediaDataUrl({
  bytes,
  mimeType,
}: {
  bytes: Uint8Array;
  mimeType: string;
}): string {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

function normalizeImageMimeType(
  value: string | null | undefined,
): string | null {
  const normalized = value?.split(';')[0]?.trim().toLowerCase();
  return normalized?.startsWith('image/') ? normalized : null;
}

function normalizeMediaMimeType(
  value: string | null | undefined,
): string | null {
  const normalized = value?.split(';')[0]?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized.startsWith('image/') || normalized.startsWith('video/')
    ? normalized
    : null;
}

function resolveMediaExtension(mimeType: string): string {
  switch (mimeType) {
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    default:
      return resolveImageExtension(mimeType);
  }
}

function resolveImageExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/svg+xml':
      return 'svg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'png';
  }
}

function sanitizeFilenamePart(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(FILENAME_UNSAFE_PATTERN, '-')
      .replace(FILENAME_EDGE_DASH_PATTERN, '') || 'top-pick'
  );
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function buildSalesDigestBlockedRemoteImageIps(): {
  ipv4: BlockList;
  ipv6: BlockList;
} {
  const ipv4 = new BlockList();
  const ipv6 = new BlockList();
  for (const [address, prefix] of BLOCKED_IPV4_SUBNETS) {
    ipv4.addSubnet(address, prefix, 'ipv4');
  }
  for (const [address, prefix] of BLOCKED_IPV6_SUBNETS) {
    ipv6.addSubnet(address, prefix, 'ipv6');
  }
  return { ipv4, ipv6 };
}

async function lookupSalesDigestRemoteImageHostname(
  hostname: string,
): Promise<Array<{ address: string; family?: number }>> {
  return lookup(hostname, {
    all: true,
    verbatim: true,
  });
}

function normalizeRemoteImageHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(REMOTE_IMAGE_HOSTNAME_BRACKET_PATTERN, '')
    .replace(REMOTE_IMAGE_HOSTNAME_TRAILING_DOT_PATTERN, '');
}

function isPublicRoutableIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family !== 4 && family !== 6) {
    return false;
  }

  return family === 6
    ? !SALES_DIGEST_BLOCKED_REMOTE_IMAGE_IPS.ipv6.check(address, 'ipv6')
    : !SALES_DIGEST_BLOCKED_REMOTE_IMAGE_IPS.ipv4.check(address, 'ipv4');
}
