import { defineConfig, devices } from '@playwright/test';

/**
 * Dedicated Playwright project for Critical User Journey (CUJ) e2e specs
 * (epic #4780). Kept separate from the broad `namefi-dev` smoke suite so CUJ
 * runs can always record a video walkthrough (`video: 'on'`) — the video
 * doubles as living documentation / preview material — without slowing the
 * rest of the suite, and so CI can upload one named video artifact per journey.
 *
 * Only specs whose title carries an `@CUJ-<Area>.<n>` tag run here (`grep`),
 * which is exactly the tag `check:cuj` counts for coverage.
 *
 * Drives headless Chromium over the Chrome DevTools Protocol against the dev
 * environment. Override the target with NAMEFI_DEV_BASE_URL and the browser
 * binary with PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
 */
const isCi = Boolean(process.env.CI);
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();

export default defineConfig({
  testDir: './tests/e2e',
  // Run only CUJ-tagged specs in this project.
  grep: /@CUJ-[A-Za-z][A-Za-z0-9]*\.\d+/,
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  outputDir: 'test-results/cuj',
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report/cuj', open: 'never' }],
    ['junit', { outputFile: 'test-results/cuj/junit.xml' }],
    ['json', { outputFile: 'test-results/cuj/results.json' }],
  ],
  use: {
    baseURL: process.env.NAMEFI_DEV_BASE_URL ?? 'https://namefi.dev',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    // Always capture for the walkthrough — this project exists to record it.
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on',
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
