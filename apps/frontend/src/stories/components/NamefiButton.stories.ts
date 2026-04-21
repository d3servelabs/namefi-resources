import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Base/NamefiButton',
  component: NamefiButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: 'radio',
      options: [
        'Link',
        'Default',
        'Destructive',
        'Outline',
        'Secondary',
        'Ghost',
      ],
      mapping: {
        Link: 'link',
        Default: 'default',
        Destructive: 'destructive',
        Outline: 'outline',
        Secondary: 'secondary',
        Ghost: 'ghost',
      },
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  args: { onClick: fn(), variant: 'default' },
} satisfies Meta<typeof NamefiButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};
