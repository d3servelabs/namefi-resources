import { expect, test, type Page } from '@playwright/test';

/**
 * CUJ-Owner.1 — Search → see availability/pricing/suggestions → add to cart.
 *
 * The first Critical User Journey e2e (epic #4780). It drives the real,
 * read-only retail entry flow against the dev environment (namefi.dev by
 * default) in a headless Chromium over the Chrome DevTools Protocol, and the
 * `cuj` Playwright project records a video walkthrough that doubles as living
 * documentation / preview material.
 *
 * Mocking policy (#4780): none needed. The whole journey — domain search →
 * availability/pricing → guest "add to cart" — is read-only and free. Nothing
 * here is irreversible, costs money, or is non-deterministic, so no mock (and
 * thus no mock justification) applies. Add-to-cart writes only to the
 * guest/local cart; there is no sign-in and no payment (checkout & pay is a
 * separate journey).
 *
 * Coverage: the `@CUJ-Owner.1` tag in the test title is what `check:cuj`
 * counts. The same id is also annotated — `@cuj ['CUJ-Owner.1']` — on the
 * three production functions this journey exercises: `runSearch`
 * (apps/frontend/src/hooks/use-search.ts), `handleAdd`
 * (apps/frontend/src/components/search/domain-card.tsx), and the shared
 * `addItem` (apps/frontend/src/hooks/use-cart.ts). See the marker convention
 * in packages/cuj/src/registry.ts.
 */

// The dev consent banner renders lazily and has shown as both "Accept All"/
// "Reject All" and the shorter "Accept"/"Reject"; dismiss whichever appears.
const dismissCookiePattern = /^(Accept all|Reject all|Accept|Reject)$/i;
const addToCartButtonPattern = /^Add to cart$/i;
const viewCartButtonPattern = /^View cart$/i;

/**
 * A fresh, near-certainly-unregistered `.my` so search reliably reports the
 * searched domain itself available with a price. A CI run id keeps it stable
 * per attempt; a base-36 timestamp keeps local runs unique. `.my` matches the
 * existing checkout smoke: it is supported on the dev registrar and cheap
 * (`.com` shows as "Unsupported" on namefi.dev, which would surface a
 * suggestion instead of the searched name).
 */
function uniqueAvailableDomain() {
  const override = process.env.NAMEFI_E2E_DOMAIN?.trim();
  if (override) return override.toLowerCase();

  const runId = process.env.GITHUB_RUN_ID?.trim();
  if (runId) {
    const runAttempt = process.env.GITHUB_RUN_ATTEMPT?.trim() || '1';
    return `namefi-e2e-${runId}-${runAttempt}.my`.toLowerCase();
  }

  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  return `namefi-e2e-${timestamp}.my`.toLowerCase();
}

async function dismissCookieBanner(page: Page) {
  const dismiss = page
    .getByRole('button', { name: dismissCookiePattern })
    .first();
  const appeared = await dismiss
    .waitFor({ state: 'visible', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) await dismiss.click().catch(() => undefined);
}

test.describe.configure({ retries: 0 });

test('@CUJ-Owner.1 searches a domain, sees availability and price, and adds it to the cart', async ({
  page,
}) => {
  const domain = uniqueAvailableDomain();

  // 1. Land on the home search (route '/') — the CUJ-Owner.1 entry point.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissCookieBanner(page);

  // 2. Search for the domain (drives `runSearch`). The home search box is a
  //    controlled input mounted client-side, so retry the fill until the value
  //    sticks — a fill that lands before React hydration gets reset to empty by
  //    the first controlled re-render, and the search then never runs.
  const searchInput = page.getByTestId('search.input.field');
  await expect(searchInput).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    await searchInput.fill(domain);
    await expect(searchInput).toHaveValue(domain, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByTestId('search.input.submit').click();

  // 3. See availability + pricing render on the result card.
  const price = page.getByTestId('search.result.price').first();
  await expect(price).toBeVisible({ timeout: 60_000 });

  // 4. Add the top result to the cart (drives `handleAdd` → shared `addItem`).
  //    Guest cart — no auth, no payment.
  const addToCart = page
    .getByRole('button', { name: addToCartButtonPattern })
    .first();
  await expect(addToCart).toBeVisible({ timeout: 60_000 });
  await expect(addToCart).toBeEnabled({ timeout: 60_000 });
  await addToCart.click();

  // 5. The card flips to "View cart" — confirmation the item is in the cart.
  await expect(
    page.getByRole('button', { name: viewCartButtonPattern }).first(),
  ).toBeVisible({ timeout: 30_000 });
});
