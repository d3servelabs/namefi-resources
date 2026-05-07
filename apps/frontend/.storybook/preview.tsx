import type { Preview } from '@storybook/nextjs-vite';
import isChromatic from 'chromatic/isChromatic';
import { MotionConfig } from 'motion/react';
import React from 'react';
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
      pauseAnimationAtEnd: false,
    },
  },

  /**
   * Global decorator to disable Framer Motion (motion/react) JS animations
   * during Chromatic snapshots. This ensures consistent snapshots by preventing
   * non-deterministic CSS transform values from in-progress animations.
   * Animations remain enabled for local Storybook development.
   */
  decorators: [
    (Story) => (
      <MotionConfig reducedMotion={isChromatic() ? 'always' : 'never'}>
        <Story />
      </MotionConfig>
    ),
  ],
};

export default preview;
