export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface MlsSaleCardTheme {
  accent: string;
  accentStrong: string;
  accentMuted: string;
  accentSoft: string;
  accentGlow: string;
  accentLine: string;
  shadow: string;
}

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

const COLOR_SAMPLE_SIZE = 36;

export function buildMlsSaleCardThemeFromRgb(
  color: RgbColor,
): MlsSaleCardTheme {
  return buildThemeFromHsl(rgbToHsl(color.red, color.green, color.blue));
}

export function buildMlsSaleCardFallbackTheme(seed: string): MlsSaleCardTheme {
  const hash = hashString(seed);

  return buildThemeFromHsl({
    hue: hash % 360,
    saturation: clamp(0.62 + ((hash >> 4) % 7) * 0.03, 0.58, 0.82),
    lightness: clamp(0.54 + ((hash >> 8) % 6) * 0.03, 0.54, 0.7),
  });
}

export function extractDominantColorFromImage(
  image: HTMLImageElement,
): RgbColor | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return null;
  }

  canvas.width = COLOR_SAMPLE_SIZE;
  canvas.height = COLOR_SAMPLE_SIZE;

  try {
    context.drawImage(image, 0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE);
    return extractDominantColorFromPixels(
      context.getImageData(0, 0, COLOR_SAMPLE_SIZE, COLOR_SAMPLE_SIZE).data,
    );
  } catch {
    return null;
  }
}

export function extractDominantColorFromPixels(
  pixels: Uint8ClampedArray,
): RgbColor | null {
  return (
    getWeightedDominantColor(pixels, true) ??
    getWeightedDominantColor(pixels, false)
  );
}

function getWeightedDominantColor(
  pixels: Uint8ClampedArray,
  strict: boolean,
): RgbColor | null {
  let totalWeight = 0;
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;

  for (let index = 0; index <= pixels.length - 4; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.45) {
      continue;
    }

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const { saturation, lightness } = rgbToHsl(red, green, blue);

    const hasUsableSaturation = strict
      ? saturation >= 0.18
      : saturation >= 0.08;
    const hasUsableLightness = strict
      ? lightness >= 0.16 && lightness <= 0.88
      : lightness >= 0.1 && lightness <= 0.92;
    if (!hasUsableSaturation || !hasUsableLightness) {
      continue;
    }

    const chromaWeight = saturation * 1.2 + 0.2;
    const midtoneWeight = 1 - Math.abs(lightness - 0.56);
    const weight = alpha * chromaWeight * Math.max(midtoneWeight, 0.18);

    totalWeight += weight;
    redTotal += red * weight;
    greenTotal += green * weight;
    blueTotal += blue * weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return {
    red: Math.round(redTotal / totalWeight),
    green: Math.round(greenTotal / totalWeight),
    blue: Math.round(blueTotal / totalWeight),
  };
}

function buildThemeFromHsl({ hue, saturation, lightness }: HslColor) {
  const normalizedHue = normalizeHue(hue);
  const normalizedSaturation = Math.round(clamp(saturation * 100 + 12, 55, 84));
  const accentLightness = Math.round(clamp(lightness * 100 + 8, 54, 72));
  const accentStrongLightness = Math.round(clamp(accentLightness - 8, 46, 62));
  const mutedSaturation = Math.round(clamp(normalizedSaturation - 18, 34, 70));
  const mutedLightness = Math.round(clamp(accentLightness + 10, 64, 82));

  return {
    accent: toHslCss(normalizedHue, normalizedSaturation, accentLightness),
    accentStrong: toHslCss(
      normalizedHue,
      Math.min(normalizedSaturation + 6, 88),
      accentStrongLightness,
    ),
    accentMuted: toHslCss(normalizedHue, mutedSaturation, mutedLightness),
    accentSoft: toHslCss(
      normalizedHue,
      Math.max(normalizedSaturation - 8, 40),
      Math.max(accentLightness - 4, 50),
      0.14,
    ),
    accentGlow: toHslCss(
      normalizedHue,
      Math.max(normalizedSaturation - 2, 48),
      Math.max(accentLightness - 8, 48),
      0.28,
    ),
    accentLine: toHslCss(
      normalizedHue,
      Math.max(normalizedSaturation - 12, 42),
      Math.max(accentLightness - 6, 46),
      0.26,
    ),
    shadow: toHslCss(
      normalizedHue,
      Math.max(normalizedSaturation - 18, 32),
      Math.max(accentStrongLightness - 18, 22),
      0.34,
    ),
  };
}

function rgbToHsl(red: number, green: number, blue: number): HslColor {
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const maxChannel = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minChannel = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const lightness = (maxChannel + minChannel) / 2;

  if (maxChannel === minChannel) {
    return {
      hue: 0,
      saturation: 0,
      lightness,
    };
  }

  const delta = maxChannel - minChannel;
  const saturation =
    lightness > 0.5
      ? delta / (2 - maxChannel - minChannel)
      : delta / (maxChannel + minChannel);

  let hue = 0;
  if (maxChannel === normalizedRed) {
    hue =
      (normalizedGreen - normalizedBlue) / delta +
      (normalizedGreen < normalizedBlue ? 6 : 0);
  } else if (maxChannel === normalizedGreen) {
    hue = (normalizedBlue - normalizedRed) / delta + 2;
  } else {
    hue = (normalizedRed - normalizedGreen) / delta + 4;
  }

  return {
    hue: hue * 60,
    saturation,
    lightness,
  };
}

function toHslCss(
  hue: number,
  saturation: number,
  lightness: number,
  alpha?: number,
) {
  const color = `${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%`;
  if (alpha === undefined) {
    return `hsl(${color})`;
  }

  return `hsl(${color} / ${alpha})`;
}

function normalizeHue(value: number) {
  const normalized = Math.round(value) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function hashString(value: string) {
  let hash = 7;
  for (const character of value) {
    hash = Math.imul(hash, 31) + character.charCodeAt(0);
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
