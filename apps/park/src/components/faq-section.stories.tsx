import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ParkFaqSection } from './faq-section';

const meta = {
  title: 'Park/Classic/ParkFaqSection',
  component: ParkFaqSection,
  parameters: { layout: 'fullscreen' },
  args: {
    items: [
      {
        question: 'What is 30003.click?',
        answer:
          '30003.click is a parked domain powered by Namefi, with ownership details, marketplace links, and domain highlights available from this page.',
      },
      {
        question: 'How can I buy 30003.click?',
        answer:
          'Use the marketplace links on this page to review or buy 30003.click on Namefi or supported marketplaces.',
      },
      {
        question: 'Who powers this parked domain page?',
        answer:
          'This parked domain page is powered by Namefi, a domain platform for discovering, managing, and trading domains.',
      },
    ],
  },
} satisfies Meta<typeof ParkFaqSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
