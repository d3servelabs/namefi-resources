/** @type {import('postcss-load-config').Config} */
const config = {
  // Object form (not the array form) so the same config works for Next, Vite,
  // and Storybook's Next framework. Matches apps/frontend/postcss.config.mjs.
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
