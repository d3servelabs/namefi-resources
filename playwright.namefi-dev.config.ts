import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();

export default defineConfig({
  testDir: './tests/e2e',
  // This suite is the nightly checkout smoke. CUJ walkthrough specs live in the
  // same dir but run under playwright.cuj.config.ts (video: 'on'); keep them out
  // of here — they don't sign in and would collide with the checkout domain.
  grep: /@nightly/,
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  outputDir: 'test-results/namefi-dev',
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report/namefi-dev', open: 'never' }],
    ['junit', { outputFile: 'test-results/namefi-dev/junit.xml' }],
    ['json', { outputFile: 'test-results/namefi-dev/results.json' }],
  ],
  use: {
    baseURL: process.env.NAMEFI_DEV_BASE_URL ?? 'https://namefi.dev',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {}),
      },
    },
  ],
});
