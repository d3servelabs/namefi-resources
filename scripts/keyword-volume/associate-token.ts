#!/usr/bin/env bun
// Associate the Google Ads developer token with the Google Cloud project.
//
// This is the prerequisite everyone misses. Brand verification is scoped to
// "the brand verification status of Google Cloud projects associated with a
// developer token" — and the only thing that creates that association is one
// Google Ads API call carrying *both* the developer token and an OAuth
// credential issued by that project. Google's own doc is explicit that
//
//   - the call may target a test account or a production account,
//   - the developer token's access level does not matter, and
//   - **it does not matter whether the call succeeds or fails**.
//
// So this script is deliberately not a health check. A 403
// DEVELOPER_TOKEN_NOT_APPROVED is a completed association and is reported as
// success. The only real failure is a request that never reached Google at all:
// a refused token exchange, or a network error. Those two, and only those two,
// exit non-zero — because in those cases nothing was associated and running
// brand verification next would be premature.
//
// Usage:
//   bun scripts/keyword-volume/associate-token.ts --dry-run     # no credentials needed
//   secretctl run --with '^GOOGLE_ADS_.*$=&' -- \
//     bun scripts/keyword-volume/associate-token.ts
//
// Reads the same five env vars as the provider and logs none of them.
//
// Reference: developers.google.com/google-ads/api/docs/api-policy/brand-verification
//   ("Prerequisite: Associate your developer token to your Google Cloud Project")

import { API_VERSION, GoogleAdsProvider } from './googleads.ts';
import type { QuerySpec } from './provider.ts';

/** One innocuous keyword in one market. The content is irrelevant to association. */
const PROBE: QuerySpec = { query: 'domain name registration', locale: 'en', country: 'US' };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

/** Digits only: Google Ads rejects the dashed form of a customer id. */
function customerId(): string {
  const raw = arg('customer-id') ?? process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? '';
  return raw.replace(/\D/g, '');
}

async function main() {
  const dryRun = has('dry-run');
  const provider = new GoogleAdsProvider();
  const id = customerId() || (dryRun ? '0000000000' : '');
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${id}:generateKeywordIdeas`;
  const body = provider.buildRequest([PROBE], PROBE.locale, PROBE.country);

  if (dryRun) {
    console.log('POST ' + url);
    console.log('Authorization:    Bearer <access token, minted at run time from the refresh token>');
    console.log('developer-token:  <GOOGLE_ADS_DEVELOPER_TOKEN>');
    console.log(`login-customer-id: ${id}${customerId() ? '' : '   (placeholder — GOOGLE_ADS_LOGIN_CUSTOMER_ID unset)'}`);
    console.log('Content-Type:     application/json');
    console.log('');
    console.log(JSON.stringify(body, null, 2));
    console.log('');
    console.log('dry run — nothing was sent, so nothing was associated.');
    console.log('Re-run without --dry-run, under `secretctl run`, to make the call for real.');
    return;
  }

  if (!provider.configured()) {
    const missing = provider.envVars.filter((v) => !process.env[v]);
    console.error(`not configured: missing ${missing.join(', ')}`);
    console.error('');
    console.error("Run under: secretctl run --with '^GOOGLE_ADS_.*$=&' -- bun scripts/keyword-volume/associate-token.ts");
    console.error('If GOOGLE_ADS_REFRESH_TOKEN is the one missing, get it first with');
    console.error('  bun scripts/keyword-volume/get-refresh-token.ts');
    process.exit(1);
  }

  // Step 1 — the OAuth credential. Reuses the provider's exchange so there is
  // exactly one implementation of it. A failure here means no Google Ads
  // request is ever made, which means no association: a genuine failure.
  let accessToken: string;
  try {
    accessToken = await provider.accessToken();
  } catch (e) {
    console.error(`NOT ASSOCIATED — the OAuth token exchange failed: ${(e as Error).message}`);
    console.error('');
    console.error('No Google Ads request was made, so the developer token was not associated');
    console.error('with the project. Check that GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET');
    console.error('and GOOGLE_ADS_REFRESH_TOKEN all belong to the same OAuth client, then');
    console.error('re-run. Do not start brand verification until this call goes through.');
    process.exit(1);
  }

  // Step 2 — the call that performs the association.
  console.log(`POST ${url}`);
  console.log(`login-customer-id: ${id}`);
  console.log('');

  let res: Response;
  try {
    res = await globalThis.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'login-customer-id': id,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`NOT ASSOCIATED — the request never reached Google: ${(e as Error).message}`);
    process.exit(1);
  }

  const text = await res.text();
  console.log(`HTTP ${res.status} ${res.statusText}`);
  const requestId = res.headers.get('request-id');
  if (requestId) console.log(`request-id: ${requestId}`);
  console.log('');
  // Google's response body names the outcome — DEVELOPER_TOKEN_NOT_APPROVED,
  // USER_PERMISSION_DENIED, a keyword idea list — and carries none of our
  // credentials, so printing it is both safe and the proof a call landed.
  console.log(text.length > 4000 ? `${text.slice(0, 4000)}\n… (${text.length} bytes total, truncated)` : text);
  console.log('');

  if (res.ok) {
    console.log('ASSOCIATED — the call succeeded, so the developer token is now associated');
    console.log('with this Google Cloud project.');
  } else {
    console.log(`ASSOCIATED — HTTP ${res.status} is still a success for this purpose. Google's`);
    console.log('brand-verification doc states plainly that it does not matter whether the');
    console.log('call succeeds or fails; what matters is that a request carrying the');
    console.log('developer token and this project\'s OAuth credential reached Google Ads.');
    console.log('A rejection at this stage is expected while the token is Test level and');
    console.log('the account holds no data. This is not a bug to fix.');
  }

  console.log('');
  console.log('Next: brand verification. See scripts/keyword-volume/BRAND-VERIFICATION.md');
  console.log('  Cloud Console -> APIs & Services -> OAuth consent screen -> Branding');
}

main();
