#!/usr/bin/env bun
// One-shot local OAuth2 consent helper for the Google Ads API.
//
// A refresh token is the one Google Ads credential that cannot be copied out of
// a console: it only exists as the product of an interactive consent. This runs
// that consent once, on the operator's own machine, and prints the resulting
// refresh token. Everything else in this directory then reuses it forever.
//
// Usage:
//   bun scripts/keyword-volume/get-refresh-token.ts --dry-run   # print the URL, bind the listener, exit
//   secretctl run --with '^GOOGLE_ADS_CLIENT_ID$=GOOGLE_ADS_CLIENT_ID' \
//     --with '^GOOGLE_ADS_CLIENT_SECRET$=GOOGLE_ADS_CLIENT_SECRET' -- \
//     bun scripts/keyword-volume/get-refresh-token.ts | secretctl set GOOGLE_ADS_REFRESH_TOKEN
//
// The refresh token goes to **stdout and nowhere else**. Every human-facing line
// — the consent URL, progress, errors — goes to stderr, which is what makes the
// pipe above safe: the secret travels from this process straight into the
// encrypted store without passing through a file, a log or a shell history line.
// Nothing here writes a credential to disk, and nothing prints the client
// secret, the authorization code or the access token at all.
//
// The flow is the loopback redirect for an installed ("Desktop app") client:
// a listener on 127.0.0.1 catches Google's redirect, so no hosted callback and
// no copy-pasting of codes. PKCE is used because the client secret of a desktop
// client is not, in fact, secret, and the proof key is what actually binds the
// authorization code to this process.

const SCOPE = 'https://www.googleapis.com/auth/adwords';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** A client id that cannot possibly resolve, so --dry-run needs no credentials. */
const DRY_RUN_CLIENT_ID = 'DRY-RUN-NO-CLIENT-ID.apps.googleusercontent.com';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

/** stderr, always — stdout is reserved for the one secret this script emits. */
const say = (line = '') => process.stderr.write(`${line}\n`);

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PKCE pair. The verifier never leaves this process until the code exchange. */
async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

function page(title: string, detail: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
      `<body style="font:16px/1.5 system-ui;margin:4rem auto;max-width:34rem;padding:0 1rem">` +
      `<h1 style="font-size:1.25rem">${title}</h1><p>${detail}</p></body>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function main() {
  const dryRun = has('dry-run');
  const clientId = arg('client-id') ?? process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const timeoutSeconds = Number(arg('timeout') ?? 300);

  if (!dryRun) {
    const missing = [
      !clientId && 'GOOGLE_ADS_CLIENT_ID (or --client-id)',
      !clientSecret && 'GOOGLE_ADS_CLIENT_SECRET',
    ].filter(Boolean);
    if (missing.length) {
      say(`missing ${missing.join(' and ')}.`);
      say('');
      say('Create the OAuth client first — Google Cloud Console -> APIs & Services ->');
      say('Credentials -> Create credentials -> OAuth client ID -> Application type');
      say('"Desktop app". Then store both values:');
      say('');
      say('  secretctl set GOOGLE_ADS_CLIENT_ID');
      say('  secretctl set GOOGLE_ADS_CLIENT_SECRET');
      say('');
      say('and re-run under `secretctl run`. Or try `--dry-run`, which needs neither.');
      process.exit(1);
    }
  }

  const state = crypto.randomUUID();
  const { verifier, challenge } = await pkce();

  // Bind before building the URL: the redirect_uri has to carry the real port,
  // and a desktop client may use any loopback port.
  let resolveCode: (value: { code?: string; error?: string }) => void;
  const caught = new Promise<{ code?: string; error?: string }>((r) => (resolveCode = r));

  const server = Bun.serve({
    port: Number(arg('port') ?? 0),
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname !== '/') return new Response('not found', { status: 404 });
      const returned = url.searchParams.get('state');
      if (returned !== state) {
        // A mismatched state is the one case where we must not touch the code.
        resolveCode({ error: 'state mismatch — ignoring this redirect' });
        return page('Rejected', 'That redirect did not come from the request this process started.');
      }
      const error = url.searchParams.get('error');
      if (error) {
        resolveCode({ error });
        return page('Consent declined', `Google returned <code>${error}</code>. Back to the terminal.`);
      }
      const code = url.searchParams.get('code');
      if (!code) {
        resolveCode({ error: 'redirect carried neither a code nor an error' });
        return page('Nothing to exchange', 'That redirect carried no authorization code.');
      }
      resolveCode({ code });
      return page('Consent granted', 'You can close this tab and return to the terminal.');
    },
  });

  const redirectUri = `http://127.0.0.1:${server.port}`;
  const consentUrl =
    `${AUTH_URL}?` +
    new URLSearchParams({
      client_id: clientId ?? DRY_RUN_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      // offline + consent is what makes Google return a refresh token at all,
      // and return one again on a re-run rather than only on first authorization.
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();

  say(`listening on ${redirectUri} for the redirect`);
  say('');
  say('Open this URL, signed in as the account that owns the manager account:');
  say('');
  say(consentUrl);
  say('');

  if (dryRun) {
    say(`dry run — listener bound and consent URL built${clientId ? '' : ' with a placeholder client id'}.`);
    say('Nothing was sent, no consent was requested, and no credential was read or written.');
    server.stop(true);
    return;
  }

  const timer = setTimeout(() => {
    resolveCode({ error: `no redirect arrived within ${timeoutSeconds}s` });
  }, timeoutSeconds * 1000);

  const result = await caught;
  clearTimeout(timer);
  // Give Bun a tick to flush the browser response before tearing the socket down.
  await new Promise((r) => setTimeout(r, 250));
  server.stop(true);

  if (result.error || !result.code) {
    say(`consent did not complete: ${result.error}`);
    process.exit(1);
  }

  const res = await globalThis.fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code: result.code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    // Google's error body names the cause (redirect_uri_mismatch, invalid_client,
    // …) and carries no credential of ours, so it is worth showing.
    say(`code exchange failed: HTTP ${res.status}`);
    say(await res.text());
    process.exit(1);
  }

  const body = (await res.json()) as { refresh_token?: string };
  if (!body.refresh_token) {
    say('exchange succeeded but returned no refresh token.');
    say('That happens when the account has already granted this client and Google');
    say('reissued only an access token. Revoke it at');
    say('https://myaccount.google.com/permissions and run this again.');
    process.exit(1);
  }

  // The only thing this program ever writes to stdout.
  process.stdout.write(`${body.refresh_token}\n`);

  say('refresh token written to stdout — it is NOT in this log and NOT on disk.');
  say('');
  say('If you did not pipe it into the store, do that now and keep it nowhere else:');
  say('');
  say('  secretctl set GOOGLE_ADS_REFRESH_TOKEN');
  say('');
  say('Next: associate the developer token with the Cloud project, which is the');
  say('prerequisite for brand verification —');
  say('');
  say('  secretctl run \\');
  for (const v of [
    'GOOGLE_ADS_DEVELOPER_TOKEN','GOOGLE_ADS_CLIENT_ID','GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN','GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  ]) say(`    --with '^${v}$=${v}' \\`);
  say('    -- bun scripts/keyword-volume/associate-token.ts');
}

main();
