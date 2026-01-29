/**
 * Chromatic viewport modes for visual regression testing.
 * These viewports represent common device sizes for our users.
 *
 * @see https://www.chromatic.com/docs/modes/viewports/
 */
export const viewportModes = {
  /**
   * MacBook Pro 16.2" M3 - Primary development/power user viewport
   */
  'macbook-pro-16': {
    viewport: { width: 1800, height: 1163 },
  },

  /**
   * MacBook Air 13.6" M4 - Common laptop viewport
   */
  'macbook-air-13': {
    viewport: { width: 1280, height: 832 },
  },

  /**
   * iPhone 17 - Mobile viewport
   */
  'iphone-17': {
    viewport: { width: 402, height: 874 },
  },
} as const;

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
