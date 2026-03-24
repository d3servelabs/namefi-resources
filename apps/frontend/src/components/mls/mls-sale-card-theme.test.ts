import { describe, expect, it } from 'vitest';
import {
  buildMlsSaleCardFallbackTheme,
  buildMlsSaleCardThemeFromRgb,
  extractDominantColorFromPixels,
} from './mls-sale-card-theme';

const HSL_PATTERN = /^hsl\(/;

describe('buildMlsSaleCardFallbackTheme', () => {
  it('returns a stable theme for a given seed', () => {
    expect(buildMlsSaleCardFallbackTheme('atlas.com')).toEqual(
      buildMlsSaleCardFallbackTheme('atlas.com'),
    );
  });

  it('varies the theme across different domains', () => {
    expect(buildMlsSaleCardFallbackTheme('atlas.com')).not.toEqual(
      buildMlsSaleCardFallbackTheme('drift.xyz'),
    );
  });
});

describe('buildMlsSaleCardThemeFromRgb', () => {
  it('produces accent colors in CSS hsl format', () => {
    const theme = buildMlsSaleCardThemeFromRgb({
      red: 31,
      green: 181,
      blue: 138,
    });

    expect(theme.accent).toMatch(HSL_PATTERN);
    expect(theme.accentStrong).toMatch(HSL_PATTERN);
    expect(theme.accentGlow).toContain('/');
  });
});

describe('extractDominantColorFromPixels', () => {
  it('prefers saturated mid-tone colors over transparent pixels', () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 0, 12, 141, 130, 255, 20, 170, 160, 255, 255, 255, 255, 255, 18,
      150, 142, 255,
    ]);

    expect(extractDominantColorFromPixels(pixels)).toEqual({
      red: 17,
      green: 154,
      blue: 144,
    });
  });

  it('returns null when only neutral pixels are available', () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255, 245, 245, 245, 255, 24, 24, 24, 255, 16, 16, 16, 255,
    ]);

    expect(extractDominantColorFromPixels(pixels)).toBeNull();
  });
});
