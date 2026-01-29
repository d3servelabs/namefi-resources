import type { Preview } from '@storybook/nextjs-vite';
import '@/app/globals.css';
import { defaultChromaticModes, storybookViewports } from './modes';

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
      viewports: storybookViewports,
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
