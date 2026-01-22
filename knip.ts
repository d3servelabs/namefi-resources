import type { KnipConfig } from 'knip';

/**
 * Known dependencies that are used but not detected by knip's static analysis.
 * Each entry includes a comment explaining why the dependency is needed.
 *
 * To add a new dependency:
 * 1. Add it to the appropriate category below
 * 2. Include a brief explanation of why it's used
 *
 * To remove a dependency:
 * 1. Remove it from this list
 * 2. Run `bun run knip` to verify it's no longer needed
 */
const knownUsedDependencies: Record<string, string[]> = {
  // Tailwind CSS v4 and related packages - used via @tailwindcss/postcss in postcss.config.mjs
  tailwind: [
    'tailwindcss',
    '@tailwindcss/forms',
    '@tailwindcss/typography',
    'tw-animate-css',
  ],

  // Build tools and bundlers - used in package.json overrides or scripts
  buildTools: [
    'webpack', // Used as override for dependency resolution
    '@ast-grep/cli', // Used for code analysis via sgr scripts
    'playwright', // Used for E2E testing
    'tsup', // Used for building packages
    'tsx', // Used for running TypeScript files directly
  ],

  // React and related packages - peer dependencies or used implicitly
  react: [
    'react-dom', // Required peer dependency for React apps
    'react-error-boundary', // Used in error handling components
    '@suspensive/react-query', // Used for React Query suspense integration
  ],

  // PostCSS - used via postcss.config.mjs
  postcss: [
    'postcss', // Used by Tailwind CSS v4
  ],

  // Remark plugins - used in MDX processing
  remark: [
    'remark-frontmatter',
    'remark-gfm',
    'remark-mdx-frontmatter',
    'remark-reading-time',
  ],

  // EPP client dependencies - used in the EPP protocol implementation
  eppClient: [
    '@date-fns/tz',
    '@date-fns/utc',
    'axios',
    'bottleneck',
    'change-case',
    'commander',
    'date-fns',
    'dotenv',
    'iso-countries-lookup',
    'libxmljs',
    'libxslt',
    'limiter',
    'p-map',
    'p-props',
    'parse-domain',
    'pino',
    'pino-opentelemetry-transport',
    'pino-pretty',
    'pluralize',
    'ramda',
    'superjson',
    'tldts',
    'unique-names-generator',
  ],

  // Backend dependencies - used in backend services
  backend: [
    '@react-email/render', // Used for rendering email templates
    'hono-pino-logger', // Used for Hono logging middleware
    'limiter', // Used for rate limiting
    'pino-opentelemetry-transport', // Used for OpenTelemetry logging
  ],

  // Indexer dependencies - used in the blockchain indexer
  indexer: [
    '@ponder/utils',
    'drizzle-orm',
    'jose',
    'nodemailer',
    'ramda',
    'undici',
  ],

  // Park app dependencies
  park: ['@radix-ui/react-label', 'punycode', 'react-hook-form'],

  // API docs dependencies
  apiDocs: [
    'shiki', // Used for syntax highlighting
    'json-schema-typed',
    'openapi-types',
  ],

  // Dev dependencies used in development/testing
  devDependencies: [
    '@react-email/preview-server',
    '@types/bcryptjs',
    'neonctl',
    '@types/gtag.js',
    'shadcn',
    '@types/libxslt',
    '@types/pluralize',
    '@types/ramda',
    'vite-tsconfig-paths',
  ],

  // Storage package dependencies
  storage: ['@namefi-astra/env', 'zod'],

  // Registrars package dependencies
  registrars: ['axios-logger'],
};

// Flatten all known dependencies into a single array and deduplicate
// Note: Some dependencies appear in multiple categories (e.g., ramda, limiter, pino-opentelemetry-transport)
// because they are used by multiple packages independently. Deduplication ensures a clean final list.
const ignoreDependencies = [
  ...new Set(Object.values(knownUsedDependencies).flat()),
];

const config: KnipConfig = {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/out/**',
    '**/coverage/**',
    'apps/indexer/generated/**',
    'apps/backend/.react-email/**',
  ],
  ignoreDependencies: ['postcss-load-config', ...ignoreDependencies],
  ignoreBinaries: ['tsc', 'tsx', 'act', 'temporal'],
  typescript: {
    config: [
      'tsconfig.json',
      'apps/*/tsconfig.json',
      'packages/*/tsconfig.json',
      'tooling/*/tsconfig.json',
    ],
  },
};

// biome-ignore lint/style/noDefaultExport: knip requires default export for configuration
export default config;
