import type { Preview } from '@storybook/nextjs-vite';

// Park + shared UI design tokens (brand-primary, background, etc.). Imported
// here so every story renders with the real Tailwind theme. The package CSS is
// imported JS-side (resolved via the exports map) because Storybook's Vite does
// not resolve the nested bare-specifier `@import` from the app globals.
import '@namefi-astra/ui/styles/globals.css';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;
