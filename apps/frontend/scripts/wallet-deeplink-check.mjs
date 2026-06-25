/**
 * Headless-Chrome (CDP) behavioral test for mobile wallet deep-linking.
 *
 * Asserts: when a wallet is selected on a MOBILE user-agent, the WalletConnect
 * deep link (`<scheme>://…wc?uri=…` or `https://…/wc?uri=…`) is delivered via
 * `window.location.href` (same-frame navigation) — NOT via `window.open`.
 *   - delivered via window.open  → FAIL  (the broken behavior: AppKit/Privy default)
 *   - delivered via location.href → PASS  (Uniswap's approach / our fix)
 *
 * Detection (validated empirically):
 *   - window.open is hooked (addInitScript) → records + suppresses any wc open.
 *   - location.href/assign to a wc URL surfaces as CDP `Page.frameRequestedNavigation`
 *     (works for custom schemes AND http universal links).
 *
 * Validated baseline: syntheticOpen → FAIL, syntheticHref → PASS, Uniswap → PASS.
 *
 * Usage:
 *   node scripts/wallet-deeplink-check.mjs <preset> <driver> <url>
 *     preset: ios | android | mobile   (the three UA classes Uniswap branches on)
 *     driver: syntheticOpen | syntheticHref | uniswap | namefiChooser | namefiPrivy
 */
import { chromium, devices } from '@playwright/test';

const WC_RE = /wc\?uri=/i;
const LOG_RE = /deeplink|wallet|wc\?uri|location\.href|metamask|uniswap/i;
const URI_RE = /uri=[^&]+/;
const SIDEBAR_RE = [/toggle sidebar/i, /open sidebar/i, /menu/i];

const PRESETS = {
  ios: devices['iPhone 13'],
  android: devices['Pixel 7'],
  mobile: {
    userAgent:
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
};

const [, , preset = 'ios', driver = 'uniswap', url] = process.argv;
if (!url) {
  console.error(
    'usage: node wallet-deeplink-check.mjs <ios|android|mobile> <driver> <url>',
  );
  process.exit(2);
}

const isWc = (u) => typeof u === 'string' && WC_RE.test(u);
const noop = () => null;

async function clickFirst(page, texts, { timeout = 5000 } = {}) {
  const deadline = Date.now() + timeout;
  do {
    for (const t of texts) {
      const loc = page.getByText(t, { exact: false });
      const n = await loc.count().catch(() => 0);
      for (let i = 0; i < n; i++) {
        const el = loc.nth(i);
        if (await el.isVisible().catch(() => false)) {
          await el.click({ timeout: 3000 }).catch(noop);
          return t;
        }
      }
    }
    await page.waitForTimeout(400);
  } while (Date.now() < deadline);
  return null;
}

// Our app hides primary nav (incl. Sign In) behind a hamburger on mobile.
async function openSidebar(page) {
  for (const name of SIDEBAR_RE) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible().catch(() => false)) {
      await b.click({ timeout: 4000 }).catch(noop);
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

const drivers = {
  // Deterministic self-tests of the harness verdict logic (no live site).
  async syntheticOpen(page) {
    await page.evaluate(() => {
      window.__wcOpen = window.__wcOpen || [];
      window.open = (u) => {
        window.__wcOpen.push(String(u));
        return null;
      };
      window.open('metamask://wc?uri=SYNTHETIC'); // must be classified FAIL(window.open)
    });
    await page.waitForTimeout(400);
    return { synthetic: 'window.open' };
  },
  async syntheticHref(page) {
    await page.evaluate(() => {
      window.location.href = 'metamask://wc?uri=SYNTHETIC'; // must be classified PASS(location.href)
    });
    await page.waitForTimeout(600);
    return { synthetic: 'location.href' };
  },
  async uniswap(page) {
    // Connect entry = navbar "Get started" (testid navbar-connect-wallet).
    let c = 'navbar-connect-wallet';
    try {
      await page
        .getByTestId('navbar-connect-wallet')
        .first()
        .click({ timeout: 12000 });
    } catch {
      c = await clickFirst(page, ['Get started'], { timeout: 12000 });
    }
    await page.waitForTimeout(2500);
    // "Uniswap Mobile" = the uniswapWalletConnect connector → fires
    // `window.location.href = uniswap://wc?uri=` on mobile (the PASS reference).
    const w = await clickFirst(page, ['Uniswap Mobile', 'Uniswap Wallet']);
    await page.waitForTimeout(6000); // wait for display_uri (relay) → deeplink
    return { connect: c, wallet: w };
  },
  async namefiChooser(page) {
    // Our PR: Sign In → chooser one-tap featured-wallet row "MetaMask"
    // (useAppKitWallet().connect('metamask') → deep link).
    await clickFirst(page, ['Accept'], { timeout: 3000 }); // cookie consent
    await openSidebar(page);
    const s = await clickFirst(page, ['Sign In', 'Sign in'], {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);
    const w = await clickFirst(page, ['MetaMask'], { timeout: 8000 });
    await page.waitForTimeout(6000);
    return { signIn: s, wallet: w };
  },
  async namefiPrivy(page) {
    // Our prod (Privy stack). Privy renders its wallet modal in an auth.privy.io
    // iframe, so the wallet button is generally not reachable from the main frame
    // headlessly — kept for completeness.
    await clickFirst(page, ['Accept'], { timeout: 3000 });
    await openSidebar(page);
    const s = await clickFirst(
      page,
      ['Sign-in with Ethereum', 'Sign In', 'Sign in'],
      { timeout: 10000 },
    );
    await page.waitForTimeout(2500);
    const w = await clickFirst(page, [
      'MetaMask',
      'Continue with a wallet',
      'Wallet',
      'Connect',
    ]);
    await page.waitForTimeout(6000);
    return { signIn: s, wallet: w };
  },
};

const browser = await chromium.launch({ headless: true });
// WIDE=1 keeps the MOBILE user-agent (so AppKit still fires the mobile deeplink,
// which is UA-gated) but uses a desktop-layout viewport, so apps that hide nav
// behind a hamburger on a narrow screen expose it for the driver.
const wide = process.env.WIDE
  ? { viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false }
  : {};
const context = await browser.newContext({ ...PRESETS[preset], ...wide });
const page = await context.newPage();

await page.addInitScript(() => {
  window.__wcOpen = [];
  window.open = (u) => {
    try {
      window.__wcOpen.push(String(u));
    } catch (e) {
      void e;
    }
    return null; // suppress so it can't become a navigation we'd miscount
  };
  // Set the deeplink-debug flag the app reads, so the [wallet-deeplink] reroute
  // log is emitted and can be asserted on.
  window.__WALLET_DEEPLINK_DEBUG = true;
});

const viaNav = [];
const logs = [];
const cdp = await context.newCDPSession(page);
await cdp.send('Page.enable');
const recordNav = (e) => {
  if (isWc(e.url)) viaNav.push(e.url);
};
cdp.on('Page.frameRequestedNavigation', recordNav);
cdp.on('Page.frameScheduledNavigation', recordNav);
page.on('console', (m) => {
  const t = m.text();
  if (LOG_RE.test(t)) logs.push(t);
});

let driverResult = null;
let navOk = true;
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  driverResult = await drivers[driver](page);
} catch (e) {
  navOk = false;
  logs.push(`DRIVER_ERROR: ${String(e).slice(0, 160)}`);
}

await page.screenshot({ path: `/tmp/wdl-${driver}-${preset}.png` }).catch(noop);
const viaOpen = (
  await page.evaluate(() => window.__wcOpen || []).catch(() => [])
).filter(isWc);

const dedupe = (a) => [...new Set(a.map((u) => u.replace(URI_RE, 'uri=…')))];
const openD = dedupe(viaOpen);
const navD = dedupe(viaNav);
const verdict =
  openD.length > 0
    ? 'FAIL(window.open)'
    : navD.length > 0
      ? 'PASS(location.href)'
      : 'INCONCLUSIVE(no deeplink fired)';

console.log(
  JSON.stringify(
    {
      target: {
        preset,
        driver,
        url,
        ua: PRESETS[preset].userAgent?.slice(0, 48),
      },
      driverResult,
      navOk,
      viaWindowOpen: openD,
      viaLocationHref: navD,
      logs: logs.slice(0, 12),
      VERDICT: verdict,
    },
    null,
    2,
  ),
);
await browser.close();
process.exit(verdict.startsWith('PASS') ? 0 : 1);
