/**
 * Viewport definitions for Chromatic and Storybook.
 * Single source of truth for all viewport sizes.
 *
 * @see https://www.chromatic.com/docs/modes/viewports/
 */
const viewportDefinitions = {
  'macbook-pro-16': {
    name: 'MacBook Pro 16.2" M3',
    width: 1800,
    height: 1163,
  },
  'macbook-air-13': {
    name: 'MacBook Air 13.6" M4',
    width: 1280,
    height: 832,
  },
  'iphone-17': {
    name: 'iPhone 17',
    width: 402,
    height: 874,
  },
} as const;

type ViewportKey = keyof typeof viewportDefinitions;

/**
 * Chromatic viewport modes for visual regression testing.
 * These viewports represent common device sizes for our users.
 */
export const viewportModes = Object.fromEntries(
  Object.entries(viewportDefinitions).map(([key, { width, height }]) => [
    key,
    { viewport: { width, height } },
  ]),
) as { [K in ViewportKey]: { viewport: { width: number; height: number } } };

/**
 * Storybook viewport addon configuration.
 * Derived from viewportDefinitions for consistency.
 */
export const storybookViewports = Object.fromEntries(
  Object.entries(viewportDefinitions).map(([key, { name, width, height }]) => [
    key,
    { name, styles: { width: `${width}px`, height: `${height}px` } },
  ]),
) as {
  [K in ViewportKey]: {
    name: string;
    styles: { width: string; height: string };
  };
};

/**
 * Default modes applied to all stories for Chromatic snapshots.
 * Each mode generates a separate snapshot with independent baselines.
 */
export const defaultChromaticModes = {
  desktop: viewportModes['macbook-air-13'],
  mobile: viewportModes['iphone-17'],
} as const;

/**
 * Extended modes including all viewport sizes.
 * Use for comprehensive testing of responsive layouts.
 */
export const allChromaticModes = {
  'macbook-pro-16': viewportModes['macbook-pro-16'],
  'macbook-air-13': viewportModes['macbook-air-13'],
  'iphone-17': viewportModes['iphone-17'],
} as const;
