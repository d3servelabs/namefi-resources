# Google Ads API — OAuth2 credentials and brand verification

**Namefi** · runbook · written 2026-09-02

Google uses **brand verification to expedite the review of Basic Access
applications**. Our Basic Access application was submitted 2026-09-02; this is
the thing that can shorten the wait. It is worth doing today.

Everything below that touches a password, a consent screen or a publish button
is **yours to click**. The scripts prepare and prove; they never sign in.

---

## The ordering, and the prerequisite everyone misses

Brand verification is scoped to *"the brand verification status of Google Cloud
projects **associated with a developer token**."* The association is not a
setting anywhere in the Console. The only thing that creates it is **one Google
Ads API call carrying both the developer token and an OAuth credential issued by
that project** — and Google's doc is explicit that

- the call may target a test account or a production account,
- the developer token's access level does not matter, and
- **it does not matter whether the call succeeds or fails.**

So there is no useful order other than this one:

| # | step | who | how |
| --- | --- | --- | --- |
| 0 | pre-flight checks | you | [below](#0-pre-flight) |
| 1 | OAuth consent screen exists | **you (Console)** | [below](#1-consent-screen) |
| 2 | Audience: **External** + **In production** | **you (Console)** | [below](#2-audience) |
| 3 | OAuth client, type **Desktop app** | **you (Console)** | [below](#3-oauth-client) |
| 4 | one consent → refresh token | **you (browser)**, script catches it | `get-refresh-token.ts` |
| 5 | **associate the developer token with the project** | script | `associate-token.ts` |
| 6 | Branding → **Verify branding** → **Publish branding** | **you (Console)** | [below](#6-branding) |

**Step 5 must actually have run before step 6.**

Learned the hard way on 2026-09-03: **brand verification passes on its own with
no association whatsoever.** The Branding page will happily report *"Your
branding has been verified and is being shown to users"* while the developer
token and the project have never exchanged a single packet. They are two
independent gates — the green badge is a statement about your logo, homepage and
policy links, and it is **not** evidence that the Google Ads prerequisite is met.

What the association buys is the link Google Ads itself needs: it *"uses the
brand verification status of Google Cloud projects **associated with a developer
token**"*. With no association, there is no project for the Basic Access review
to look at, and a verified badge expedites nothing.

So confirm step 5 from the script's own output — an `ASSOCIATED —` line and an
HTTP status printed from a real response — and never from the Console's
verification badge, which cannot tell you anything about it.

Steps 2 and 3–5 are in this order for a reason beyond Google's page order.
An External app whose publishing status is still **Testing** is issued a
**refresh token that expires in 7 days** for any scope outside name/email/profile
— and `.../auth/adwords` is outside it. Flip the status to *In production* first
and the refresh token you mint in step 4 is durable. Do it in the other order and
you will be redoing step 4 next week.

---

## The values to enter

Verified against IANA's registrar-ids list. Use verbatim.

| field | value |
| --- | --- |
| App name | `Namefi` |
| Application home page | `https://namefi.io` |
| Terms of service link | `https://namefi.io/tos` |
| Privacy policy link | `https://namefi.io/privacy` — **only once it is live, see below** |
| Authorized domain | `namefi.io` |
| Developer contact | `dev-team@namefi.io` |
| User support email | `dev-team@namefi.io` if the dropdown offers it, otherwise `zzn@d3serve.xyz` |
| Legal entity | D3Serve Labs Inc. dba Namefi — ICANN-accredited registrar, IANA Registrar ID **4337** |

Two standing rules for anything typed into a Google form:

- **State what the tool does; do not volunteer commitments the form did not ask
  for.** Narrowing your own future use in a free-text box buys nothing and costs
  flexibility later.
- **Do not raise topics the form does not ask about.** Namefi is an
  ICANN-accredited domain registrar; that is the whole answer to "who are you".
  Where a form *does* ask something directly, answer it fully.

### Gate: the privacy policy must be **live**, not merged

There was no privacy policy page at all when this runbook was first written —
every conventional path 404'd, nothing appeared in the sitemap, and the ToS never
used the word. That has been fixed in
[namefi-astra#5779](https://github.com/d3servelabs/namefi-astra/pull/5779)
(the page, plus ToS §20 pointing at it) and
[#5783](https://github.com/d3servelabs/namefi-astra/pull/5783) (the footer link).

**Merged is not deployed, and brand verification reads the live URL.** Before
step 6, confirm it yourself:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -L https://namefi.io/privacy
```

**`200` or do not proceed.** A `404` here fails verification, and because
**branding cannot be edited while verification is in progress**, a premature
click costs a whole cycle rather than a retry. If it 404s, the astra app needs a
production release — merging to `main` does not deploy it. Never substitute a URL
that does not resolve just to get past the field.

---

## 0. Pre-flight

Already true, verified 2026-09-02 — no need to redo:

- Google Ads manager account (MCC) **350-597-6042** → as `login-customer-id`,
  digits only: `3505976042`
- Developer token obtained, currently **Test** level, held in the local secrets
  broker as `GOOGLE_ADS_DEVELOPER_TOKEN`
- Google Cloud project **`d3serve-labs`**, project number **86583255333**
- **`googleads.googleapis.com` is enabled** on that project
- `zzn@d3serve.xyz` owns both the MCC and the Cloud project, and is a Google
  Workspace account (`d3serve.xyz` MX points at Google) — which decides the
  branch you take in step 2

Two things to check yourself before you start:

1. **Does `https://namefi.io/privacy` return 200?** See the gate above — this is
   the one pre-flight check that has actually blocked in practice.
2. **Is `namefi.io` verified in Google Search Console under the account you will
   be signed in as?** Brand verification requires ownership of every authorized
   domain to be verified there. `namefi.io` does publish a
   `google-site-verification` TXT record, which is consistent with a verified
   domain property — but the record does not say *which* account holds it, so
   confirm in Search Console rather than assuming.
3. **What else lives in the `d3serve-labs` OAuth consent screen?** The consent
   screen and its branding are **per project, not per client**. If another app in
   this project already presents its own name to users, step 2 and step 6 change
   what those users see. Look at *APIs & Services → Credentials* first, and if
   there is another OAuth client with real users, use a separate Cloud project
   for the Google Ads work instead.

---

## 1. Consent screen {#1-consent-screen}

Google Cloud Console → select project **`d3serve-labs`** →
**APIs & Services → OAuth consent screen**.

If the project has never had one, the **Overview** tab shows a **Get started**
button. Click it, fill in App name, User support email, Audience and Developer
contact information from [the table above](#the-values-to-enter), and click
**Create**.

If it is already configured, this tab shows the existing app instead. Nothing to
do here; go to step 2.

---

## 2. Audience: External, In production {#2-audience}

**APIs & Services → OAuth consent screen → Audience.**

Google's brand-verification page is unusually blunt that this is required and
that it overrides advice elsewhere:

> You may note in other documentation and Google Cloud Console UI that brand
> verification is not required for an application if its User type is set to
> Internal or if Publishing status is Testing. However, for the purpose of
> reviewing the Basic Access application for the Google Ads API, this
> documentation supersedes any other guidance.

`zzn@d3serve.xyz` is a Workspace account, so expect the **Workspace branch**:

1. **User type** will read **Internal**. Click **Make external**.
2. In the dialog, select **Publishing status: In production**. Click **Confirm**.
3. If prompted **Push to Production?**, click **Confirm**.

(If the User type is already **External** with no *Make external* button — the
non-Workspace branch — you will instead see **Publishing status: Testing**.
Click **Publish app**, then **Confirm** at *Push to Production?*.)

Either way you are aiming at the same end state: **User type External,
Publishing status In production.**

Expect the consent screen in step 4 to warn *"Google hasn't verified this app"*.
That is normal for a production app that has not been through full OAuth app
verification, and it does not block you: **Advanced → Go to Namefi (unsafe)**.
You are the developer consenting to your own app.

---

## 3. OAuth client — Desktop app {#3-oauth-client}

**APIs & Services → Credentials → Create credentials → OAuth client ID →
Application type: Desktop app.** Name it something like `namefi-keyword-volume`.

Desktop app, not Web application: the helper in step 4 uses the loopback
redirect, which a desktop client allows on any `127.0.0.1` port without you
registering redirect URIs by hand.

Copy the client ID and client secret from the dialog straight into the store —
not into a file, a note, or a chat message:

```bash
secretctl set GOOGLE_ADS_CLIENT_ID
```

```bash
secretctl set GOOGLE_ADS_CLIENT_SECRET
```

Each reads one value from stdin (Ctrl-D to end) and stores it encrypted. Store
the manager account id too, so every later command needs only one injection:

```bash
printf '3505976042' | secretctl set GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

Confirm all four are present — this prints names only, never values:

```bash
secretctl ls
```

---

## 4. One consent → a refresh token

A refresh token is the one Google Ads credential that cannot be copied out of a
console: it exists only as the product of an interactive consent. You grant it
once; everything afterwards reuses it.

See what the helper will do, without credentials and without sending anything:

```bash
bun scripts/keyword-volume/get-refresh-token.ts --dry-run
```

Then the real run. This pipes the token from the helper straight into the
encrypted store — it never lands in a file, a log or your shell history:

```bash
secretctl run \
  --with '^GOOGLE_ADS_CLIENT_ID$=GOOGLE_ADS_CLIENT_ID' \
  --with '^GOOGLE_ADS_CLIENT_SECRET$=GOOGLE_ADS_CLIENT_SECRET' \
  -- bun scripts/keyword-volume/get-refresh-token.ts | secretctl set GOOGLE_ADS_REFRESH_TOKEN
```

It prints a consent URL and waits on `127.0.0.1`. **Open the URL yourself**,
signed in as `zzn@d3serve.xyz`, click through the unverified-app warning, and
grant. The helper catches the redirect, exchanges the code, and the token goes
into the store. The consent URL and every status line go to stderr; **stdout
carries the refresh token and nothing else**, which is what makes the pipe safe.

If the exchange reports *"returned no refresh token"*, the account has already
granted this client and Google reissued only an access token. Revoke it at
<https://myaccount.google.com/permissions> and run the command again.

---

## 5. Associate the developer token with the project

**This is the prerequisite. Do not skip it and do not do it after step 6.**

```bash
bun scripts/keyword-volume/associate-token.ts --dry-run
```

That prints the exact request — URL, header names with values redacted, JSON
body — and sends nothing. Then make the call for real:

```bash
secretctl run \
  --with '^GOOGLE_ADS_DEVELOPER_TOKEN$=GOOGLE_ADS_DEVELOPER_TOKEN' \
  --with '^GOOGLE_ADS_CLIENT_ID$=GOOGLE_ADS_CLIENT_ID' \
  --with '^GOOGLE_ADS_CLIENT_SECRET$=GOOGLE_ADS_CLIENT_SECRET' \
  --with '^GOOGLE_ADS_REFRESH_TOKEN$=GOOGLE_ADS_REFRESH_TOKEN' \
  --with '^GOOGLE_ADS_LOGIN_CUSTOMER_ID$=GOOGLE_ADS_LOGIN_CUSTOMER_ID' \
  -- bun scripts/keyword-volume/associate-token.ts
```

**Read the output before moving on.** You are looking for a real HTTP status and
a response body from `googleads.googleapis.com`, followed by a line beginning
`ASSOCIATED —`.

- **A non-2xx is a success here.** `403 DEVELOPER_TOKEN_NOT_APPROVED` is the
  expected answer while the token is Test level, and it associates the project
  exactly as a `200` would. The script says so and exits `0`.
- **The one real failure is a request that never reached the Google Ads API.** A
  refused OAuth token exchange, a network error, or a **non-JSON body** all print
  `NOT ASSOCIATED —` and exit `1`. Nothing was associated; fix it and run again.

### The trap: a 404 that looks like a rejection but is a routing miss

Hit on 2026-09-03. The first association run returned **HTTP 404**, and by the
rule above — any status is fine — that read as success. It was not. The body was
Google's generic HTML error page:

> The requested URL `/v21/customers/…:generateKeywordIdeas` was not found on this server.

**`v21` had been sunset.** The request was routed nowhere, the `developer-token`
header was never read, and nothing was associated. The tell is the body, not the
status: the Google Ads API answers **JSON** even when it rejects you, so an HTML
body means the API never saw the request. `associate-token.ts` now checks exactly
that and refuses to report `ASSOCIATED` without a JSON response.

Versions in service on 2026-09-03 were **v22–v25**, v25 newest and the one pinned
in `googleads.ts`; v21 and earlier are gone. When this breaks again — it will,
these sunset on a schedule — check
[sunset dates](https://developers.google.com/google-ads/api/docs/sunset-dates)
and bump `API_VERSION`.

What a genuine association looks like: **HTTP 403**, a `request-id` header, and a
JSON `GoogleAdsFailure` naming `DEVELOPER_TOKEN_NOT_APPROVED`. That is the API
itself, having read the token, telling you the token is Test level. It is the
expected, correct outcome here.

---

## 6. Branding → Verify → Publish {#6-branding}

**APIs & Services → OAuth consent screen → Branding.**

1. Fill in every branding field from [the table above](#the-values-to-enter) —
   app name, app logo if you have the Namefi mark handy, the home page, privacy
   policy and terms of service links, authorized domain `namefi.io`, and the
   developer contact. Click **Save**.
2. Saving enables **Verify branding**, top-right of the Branding page. Click it.
   *(This is your click. It is a publish-adjacent action on a real Google
   property and it is not one a script should make on your behalf.)*
3. Verification runs for a few minutes. Errors, if any, appear on the page along
   with what to fix. **Branding cannot be edited while verification is in
   progress** — so get the fields right before clicking, rather than planning to
   adjust mid-run.
4. When it completes successfully, click **Publish branding**.
5. The project now reads **Brand verified**.

---

## What this does and does not buy

**Does:** it expedites the pending Basic Access review, which is the entire point
of doing it today.

**Does not:** it does not grant Basic Access, and it does not make
`bun keywords:volume` return numbers. The developer token is still **Test**
level, and test accounts hold no real data, so keyword volume comes back empty
with a stated reason in every row's `note`. **That emptiness is the tool
behaving correctly, not a bug** — see the `null`-never-zero discipline in
[`README.md`](README.md). Real numbers arrive when Basic Access is granted.

Google may email `dev-team@namefi.io` asking for more detail on the application.
[`DESIGN.md`](DESIGN.md) is the document to answer from.

---

## Sources

- [Brand Verification — Google Ads API](https://developers.google.com/google-ads/api/docs/api-policy/brand-verification)
  — the prerequisite, the Console path, and the External/In-production requirement
- [Using OAuth 2.0 to Access Google APIs § Refresh token expiration](https://developers.google.com/identity/protocols/oauth2)
  — the 7-day expiry for a Testing-status external project
- [OAuth App Verification Help Center](https://support.google.com/cloud/answer/13463073)
  — brand verification as the lighter-weight process
- [Manage OAuth App Branding](https://support.google.com/cloud/answer/15549049)
  — branding fields, authorized domains, and the Search Console ownership requirement
