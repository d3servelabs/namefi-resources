import DottedMap from 'dotted-map';
import sharp from 'sharp';
import { logger } from '#lib/logger';

export interface LoginLocationMapInput {
  lat: number;
  lng: number;
  /** When true, render a warning color pin; otherwise use the default brand pin. */
  isAlert?: boolean;
}

export interface LoginLocationMap {
  /** PNG bytes suitable for attaching to an email with `contentDisposition: 'inline'`. */
  png: Buffer;
  /** MIME content type; always `'image/png'` for now. */
  contentType: 'image/png';
  /** Suggested filename, used for the nodemailer attachment entry. */
  filename: string;
  /** Width in pixels of the rendered PNG. */
  width: number;
  /** Height in pixels of the rendered PNG (computed from sharp auto-resize). */
  height: number | null;
}

const MAP_DOT_COLOR = '#2f3a3f';
const MAP_BG_COLOR = 'transparent';
const PIN_COLOR_OK = '#4ade80';
const PIN_COLOR_ALERT = '#f97316';
const DOTS_GRID_HEIGHT = 64;
const PNG_WIDTH = 600;

/**
 * Renders a minimal dotted world map with a single pin at the given
 * coordinates, then rasterizes to PNG. The buffer is returned alongside a
 * `filename` + `contentType` so the caller can drop it straight into
 * nodemailer's attachments array with `contentDisposition: 'inline'` and
 * reference it as `cid:<cid>` in the HTML.
 *
 * Returns null when coordinates are absent/invalid or when rendering fails —
 * the email path then omits the inline image rather than erroring out.
 */
export async function renderLoginLocationMap(
  input: LoginLocationMapInput,
): Promise<LoginLocationMap | null> {
  if (
    !Number.isFinite(input.lat) ||
    !Number.isFinite(input.lng) ||
    Math.abs(input.lat) > 90 ||
    Math.abs(input.lng) > 180
  ) {
    return null;
  }

  try {
    const map = new DottedMap({
      height: DOTS_GRID_HEIGHT,
      grid: 'diagonal',
    });

    map.addPin({
      lat: input.lat,
      lng: input.lng,
      svgOptions: {
        color: input.isAlert ? PIN_COLOR_ALERT : PIN_COLOR_OK,
        radius: 0.75,
      },
    });

    const svg = map.getSVG({
      shape: 'circle',
      color: MAP_DOT_COLOR,
      backgroundColor: MAP_BG_COLOR,
      radius: 0.25,
    });

    const png = await sharp(Buffer.from(svg))
      .resize({ width: PNG_WIDTH })
      .png({ compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });

    return {
      png: png.data,
      contentType: 'image/png',
      filename: 'login-location-map.png',
      width: png.info.width,
      height: png.info.height ?? null,
    };
  } catch (error) {
    logger.warn(
      {
        error,
        // Coarsened to whole degrees (~111km / ~70mi resolution at the
        // equator) so the log is useful for spotting region-level patterns
        // without recording the user's precise location.
        latDeg: Math.round(input.lat),
        lngDeg: Math.round(input.lng),
      },
      'Failed to render login location map',
    );
    return null;
  }
}
