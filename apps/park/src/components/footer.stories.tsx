import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Footer } from './footer';

/**
 * The park `Footer` mirrors the main `apps/frontend` footer (sections, links and
 * the `llms.txt` note), adapted to the standalone park app: hardcoded English
 * (no i18n), absolute URLs resolved against `frontendBaseUrl`, the park cookie
 * consent hook, and a build-version stamp.
 *
 * `useOrigin` reads `window.location.hostname`, so under Storybook (localhost)
 * the footer resolves as a first-party origin — it shows the Namefi logotype and
 * the first-party-only links (Partners, Education Hub). On a parked third-party
 * domain those are hidden. The Topics (pillars) and Series columns mirror the
 * Namefi Resources taxonomy and show on every origin.
 */
const meta = {
  title: 'Park/Classic/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  args: {
    frontendBaseUrl: 'https://namefi.io',
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First-party (Astra) footer — Namefi logotype and the full link set. */
export const Default: Story = {};

/**
 * Parked partner domain — pass a `pbnApex` so the logo falls back to the
 * "Powered by Namefi" mark. (Link visibility still follows the real origin.)
 */
export const PoweredByNamefi: Story = {
  args: {
    pbnApex: '0x.city',
  },
};
