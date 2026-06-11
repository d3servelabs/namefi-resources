import {
  expect,
  test,
  type FrameLocator,
  type Locator,
  type Page,
} from '@playwright/test';

const skipAuthStorageKey = 'namefi-skip-auth';
const defaultMaxUsdCents = 5_000;
// Dedicated development receiving wallet entered manually by this smoke test.
// Keep it out of the skip-auth mock so checkout exercises the wallet form.
const receivingWalletAddress = '0xB5856d4598c919834913b8656ebc15a64d3C7836';
const stripeTestCard = {
  number:
    process.env.NAMEFI_E2E_STRIPE_CARD_NUMBER?.trim() || '4242424242424242',
  expiry: process.env.NAMEFI_E2E_STRIPE_CARD_EXPIRY?.trim() || '1234',
  cvc: process.env.NAMEFI_E2E_STRIPE_CARD_CVC?.trim() || '123',
  postalCode: process.env.NAMEFI_E2E_STRIPE_CARD_POSTAL_CODE?.trim() || '94107',
};

type CreatedOrder = {
  id: string;
  nftWalletAddress: string;
  items: Array<{
    normalizedDomainName: string;
    metadata?: {
      tldRegistrationRequirementAcknowledged?: boolean;
    };
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDefaultDomain() {
  const runId = process.env.GITHUB_RUN_ID?.trim();
  if (runId) {
    const runAttempt = process.env.GITHUB_RUN_ATTEMPT?.trim() || '1';
    // .gl keeps the smoke item inexpensive and has implicit policy coverage.
    return `namefi-e2e-${runId}-${runAttempt}.gl`;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  // Base-36 keeps local fallback domains compact while staying unique enough.
  const timestamp = Math.floor(now.getTime() / 1000).toString(36);
  return `namefi-e2e-${year}${month}${day}-${timestamp}.gl`;
}

function getDomainUnderTest() {
  return (
    process.env.NAMEFI_E2E_DOMAIN?.trim() || getDefaultDomain()
  ).toLowerCase();
}

function withSkipAuth(pathname: string) {
  const baseUrl = process.env.NAMEFI_DEV_BASE_URL ?? 'https://namefi.dev';
  const url = new URL(pathname, baseUrl);
  url.searchParams.set('skip_auth', '1');
  return url.toString();
}

function getMaxUsdCents() {
  const parsed = Number.parseInt(
    process.env.NAMEFI_E2E_MAX_USD_CENTS || '',
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultMaxUsdCents;
}

function parseUsdCents(value: string) {
  const dollars = Number.parseFloat(value.replaceAll(',', ''));
  if (!Number.isFinite(dollars)) {
    throw new Error(`Unable to parse USD amount: ${value}`);
  }
  return Math.round(dollars * 100);
}

async function expectCartTotalUnderCap(page: Page) {
  const maxUsdCents = getMaxUsdCents();
  const bodyText = await page.locator('body').innerText();
  const totalMatches = [
    ...bodyText.matchAll(
      /Total\s*(?:\n|\s)+(?:\$[\d,.]+\s*\/\s*)?\$([\d,.]+)\s+USD/gi,
    ),
  ];
  const totalMatch = totalMatches.at(-1);

  if (!totalMatch?.[1]) {
    throw new Error('Unable to find cart total before checkout.');
  }

  const totalUsdCents = parseUsdCents(totalMatch[1]);
  expect(totalUsdCents).toBeLessThanOrEqual(maxUsdCents);
}

async function enterReceivingWallet(page: Page) {
  const walletInput = page
    .getByPlaceholder(/Paste a wallet address or ENS name/i)
    .first();

  await expect(walletInput).toBeVisible({ timeout: 30_000 });
  await walletInput.fill(receivingWalletAddress);
  await expect(walletInput).toHaveValue(receivingWalletAddress);
  await acknowledgeUnlinkedWalletIfNeeded(page);
}

async function waitForFirstVisible(
  candidates: Array<[name: string, locator: Locator]>,
  timeoutMs: number,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    for (const [name, locator] of candidates) {
      if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
        return name;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Timed out waiting for one of: ${candidates
      .map(([name]) => name)
      .join(', ')}`,
  );
}

async function clearCartBeforeCheckout(page: Page) {
  await page.goto(withSkipAuth('/cart'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Auth Skipped')).toBeVisible({ timeout: 20_000 });
  await dismissCookieBanner(page);

  const emptyCart = page.getByText('Your cart is empty');
  const clearCartButton = page
    .getByRole('button', { name: /^Clear Cart$/ })
    .first();
  const cartState = await waitForFirstVisible(
    [
      ['empty cart', emptyCart],
      ['clear cart button', clearCartButton],
    ],
    60_000,
  );

  if (cartState === 'empty cart') {
    return;
  }

  await clearCartButton.click();

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^Clear Cart$/ }).click();
  await expect(emptyCart).toBeVisible({ timeout: 30_000 });
}

async function dismissCookieBanner(page: Page) {
  const cookieButtons = [
    page.getByRole('button', { name: /^Accept All$/i }),
    page.getByRole('button', { name: /^Reject All$/i }),
  ];

  for (const button of cookieButtons) {
    if (await button.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await button.click();
      return;
    }
  }
}

async function expectOnlyCartDomain(page: Page, domain: string) {
  await expect(page.getByText(domain, { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  const bodyText = await page.locator('body').innerText();
  const cartSection = bodyText.match(
    /In your cart(?<cartSection>[\s\S]*?)Payment Method/i,
  )?.groups?.cartSection;

  if (!cartSection) {
    throw new Error('Unable to find cart contents before checkout.');
  }

  const cartDomains = Array.from(
    new Set(
      [...cartSection.matchAll(/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\b/gi)]
        .map((match) => match[0]?.toLowerCase())
        .filter((candidate) => {
          const tld = candidate.split('.').at(-1);
          return Boolean(tld && /[a-z]/i.test(tld));
        }),
    ),
  );

  expect(
    cartDomains,
    `Expected checkout cart to contain only the E2E domain ${domain}.`,
  ).toEqual([domain]);
}

async function acknowledgeTldRequirements(page: Page) {
  const requirementLabels = page.locator('label').filter({
    hasText: /I understand and agree to the .* requirements/i,
  });
  const count = await requirementLabels.count();

  for (let index = 0; index < count; index += 1) {
    const label = requirementLabels.nth(index);
    if (!(await label.isVisible().catch(() => false))) {
      continue;
    }

    const checkbox = label.locator('[role="checkbox"]').first();
    if ((await checkbox.getAttribute('aria-checked')) !== 'true') {
      await checkbox.click();
    }
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }
}

async function assertTldRequirementsAcknowledged(page: Page) {
  const requirementLabels = page.locator('label').filter({
    hasText: /I understand and agree to the .* requirements/i,
  });
  const count = await requirementLabels.count();

  for (let index = 0; index < count; index += 1) {
    const label = requirementLabels.nth(index);
    if (!(await label.isVisible().catch(() => false))) {
      continue;
    }

    await expect(label.locator('[role="checkbox"]').first()).toHaveAttribute(
      'aria-checked',
      'true',
    );
  }
}

async function acknowledgeVisibleCheckboxLabel(
  page: Page,
  labelSelector: string,
  labelText: RegExp,
) {
  const label = page.locator(labelSelector).filter({ hasText: labelText });
  if (!(await label.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return;
  }

  const checkbox = label.locator('[role="checkbox"]').first();
  if ((await checkbox.getAttribute('aria-checked')) !== 'true') {
    await checkbox.click();
  }
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
}

async function acknowledgeUnlinkedWalletIfNeeded(page: Page) {
  await acknowledgeVisibleCheckboxLabel(
    page,
    'label[for="unlinked-wallet-confirm-checkbox"]',
    /I'm purchasing for a wallet not linked to this account/i,
  );
}

async function selectStripeCardTab(
  stripeFrame: FrameLocator,
  cardNumber: Locator,
) {
  if (await cardNumber.isVisible({ timeout: 1_000 }).catch(() => false)) {
    return;
  }

  await stripeFrame
    .locator('#card-tab, [data-testid="card"]')
    .click({ timeout: 15_000 })
    .catch(async () => {
      await stripeFrame.getByText('Card', { exact: true }).click({
        timeout: 15_000,
      });
    });

  await expect(cardNumber).toBeVisible({ timeout: 30_000 });
}

async function addStripeTestCard(page: Page) {
  await dismissCookieBanner(page);
  await page.getByRole('button', { name: /^Add or Select Card$/i }).click();

  const dialog = page.getByRole('dialog', {
    name: /Payment Method Details/i,
  });
  await expect(dialog).toBeVisible({ timeout: 30_000 });

  const stripeFrame = page
    .frameLocator('iframe[title="Secure payment input frame"]')
    .first();
  const cardNumber = stripeFrame
    .locator('input[name="number"], input[autocomplete="cc-number"]')
    .first();
  const expiry = stripeFrame
    .locator('input[name="expiry"], input[autocomplete="cc-exp"]')
    .first();
  const cvc = stripeFrame
    .locator('input[name="cvc"], input[autocomplete="cc-csc"]')
    .first();

  await selectStripeCardTab(stripeFrame, cardNumber);
  await cardNumber.fill(stripeTestCard.number);
  await expiry.fill(stripeTestCard.expiry);
  await cvc.fill(stripeTestCard.cvc);

  const postalCode = stripeFrame
    .locator(
      'input[autocomplete="postal-code"], input[placeholder*="ZIP"], input[placeholder*="Postal"]',
    )
    .first();
  if (await postalCode.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await postalCode.fill(stripeTestCard.postalCode);
  }

  await page
    .getByRole('button', { name: /^Use this Payment Method$/i })
    .click();
  await expect(dialog).toBeHidden({ timeout: 45_000 });
  await expect(
    page.getByRole('button', { name: /^Change Card$/i }),
  ).toBeVisible({ timeout: 10_000 });
}

function parseCreatedOrder(payload: unknown): CreatedOrder {
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected createOrderV2 response: root is not an array.');
  }

  const result = payload[0]?.result;
  if (!isRecord(result)) {
    throw new Error('Unexpected createOrderV2 response: missing result.');
  }

  const data = result.data;
  if (!isRecord(data)) {
    throw new Error('Unexpected createOrderV2 response: missing data.');
  }

  const order = data.json;
  if (!isRecord(order)) {
    throw new Error('Unexpected createOrderV2 response: missing order.');
  }

  const { id, nftWalletAddress, items } = order;
  if (
    typeof id !== 'string' ||
    typeof nftWalletAddress !== 'string' ||
    !Array.isArray(items)
  ) {
    throw new Error('Unexpected createOrderV2 response: invalid order fields.');
  }

  return {
    id,
    nftWalletAddress,
    items: items.map((item) => {
      if (!isRecord(item)) {
        throw new Error(
          'Unexpected createOrderV2 response: invalid order item.',
        );
      }

      if (typeof item.normalizedDomainName !== 'string') {
        throw new Error(
          'Unexpected createOrderV2 response: missing order item domain.',
        );
      }

      const metadata = isRecord(item.metadata) ? item.metadata : undefined;
      const acknowledged = metadata?.tldRegistrationRequirementAcknowledged;
      const parsedItem: CreatedOrder['items'][number] = {
        normalizedDomainName: String(item.normalizedDomainName),
      };

      if (typeof acknowledged === 'boolean') {
        parsedItem.metadata = {
          tldRegistrationRequirementAcknowledged: acknowledged,
        };
      }

      return parsedItem;
    }),
  };
}

async function submitOrderAndExpectCreated(
  page: Page,
  submitOrder: Locator,
  domain: string,
) {
  const createOrderResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/trpc/orders.createOrderV2'),
    { timeout: 90_000 },
  );

  await submitOrder.click();

  const response = await createOrderResponse;
  expect(response.ok()).toBe(true);

  const order = parseCreatedOrder(await response.json());
  expect(order.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(order.nftWalletAddress.toLowerCase()).toBe(
    receivingWalletAddress.toLowerCase(),
  );
  expect(order.items.map((item) => item.normalizedDomainName)).toEqual([
    domain,
  ]);
  expect(
    order.items.every(
      (item) => item.metadata?.tldRegistrationRequirementAcknowledged === true,
    ),
  ).toBe(true);

  return order;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, '1');
  }, skipAuthStorageKey);
});

test.describe.configure({ retries: 0 });

test('searches, adds to cart, adds a Stripe test card, and checks out @nightly', async ({
  page,
}) => {
  const domain = getDomainUnderTest();

  await clearCartBeforeCheckout(page);

  await page.goto(withSkipAuth('/'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Auth Skipped')).toBeVisible({ timeout: 20_000 });

  const searchInput = page.locator('input[name="search-input"]').first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(domain);
  await page.getByRole('button', { name: /^Search$/ }).click();

  const addToCart = page
    .getByRole('button', { name: /^Add to cart$/i })
    .first();
  await expect(addToCart).toBeVisible({ timeout: 60_000 });
  await expect(addToCart).toBeEnabled({ timeout: 60_000 });
  await addToCart.click();

  await expect(
    page.getByRole('button', { name: /^View cart$/i }).first(),
  ).toBeVisible({
    timeout: 30_000,
  });

  await page.goto(withSkipAuth('/cart'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('In your cart')).toBeVisible({ timeout: 60_000 });
  await expectOnlyCartDomain(page, domain);
  await acknowledgeTldRequirements(page);
  await expectCartTotalUnderCap(page);
  await enterReceivingWallet(page);
  await addStripeTestCard(page);
  await acknowledgeTldRequirements(page);
  await assertTldRequirementsAcknowledged(page);
  await acknowledgeUnlinkedWalletIfNeeded(page);

  const submitOrder = page.getByRole('button', { name: /^Submit Order$/i });
  await expect(submitOrder).toBeVisible({ timeout: 30_000 });
  await expect(submitOrder).toBeEnabled({ timeout: 60_000 });

  const order = await submitOrderAndExpectCreated(page, submitOrder, domain);
  await page
    .waitForURL(new RegExp(`/orders/${order.id}(?:[/?#]|$)`), {
      timeout: 15_000,
    })
    .catch(() => undefined);
});
