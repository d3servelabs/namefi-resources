import type { Preview } from '@storybook/nextjs-vite';
import '@/app/globals.css';
import { defaultChromaticModes, viewportModes } from './modes';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    /**
     * Storybook viewport addon configuration.
     * Provides viewport switching in the Storybook UI.
     */
    viewport: {
      viewports: {
        'macbook-pro-16': {
          name: 'MacBook Pro 16.2" M3',
          styles: { width: '1800px', height: '1163px' },
        },
        'macbook-air-13': {
          name: 'MacBook Air 13.6" M4',
          styles: { width: '1280px', height: '832px' },
        },
        'iphone-17': {
          name: 'iPhone 17',
          styles: { width: '402px', height: '874px' },
        },
      },
      defaultViewport: 'macbook-air-13',
    },

    /**
     * Chromatic visual regression testing configuration.
     * Snapshots are taken at each mode's viewport size.
     *
     * @see https://www.chromatic.com/docs/modes/viewports/
     */
    chromatic: {
      modes: defaultChromaticModes,
    },
  },
};

export default preview;
