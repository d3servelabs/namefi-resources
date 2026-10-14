---
title: "How to Use the Namefi API: Keys, Requests, DNS and Payment"
date: '2026-10-14'
language: 'en'
tags: ['ai-agents', 'guide', 'faq']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/namefi-api-guide-og.jpg
description: "Get a Namefi API key, authenticate with x-api-key, search availability, register a domain, manage DNS records, and handle errors and payment."
keywords: ["namefi api", "namefi api key", "x-api-key", "domain registration api", "domain availability api", "dns records api", "namefi rest api", "register domain via api", "nfsc balance", "namefi api rate limit", "namefi openapi"]
relatedArticles:
  - /en/blog/namefi-mcp/
  - /en/blog/ai-agent-register/
  - /en/blog/mcp-vs-rest-api/
  - /en/blog/claude-mcp-domains/
  - /en/blog/wallet-checkout/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/blockchain-concepts/
relatedGlossary:
  - /en/glossary/dns-record-types/
  - /en/glossary/registrar/
  - /en/glossary/ai-agent/
  - /en/glossary/x402/
  - /en/glossary/dns/
---

**The Namefi API is a REST API at `https://api.namefi.io/v-next/`. You generate an API key, send it in an `x-api-key` header, and call endpoints to check availability, register a domain, and manage DNS records.** Availability search and reading a zone's DNS records need no key at all; everything that changes your account does. This guide walks the path in order, with `curl` for every step.

Everything below targets production, `api.namefi.io`. The endpoint list comes from Namefi's [published OpenAPI document](https://api.namefi.io/v-next/openapi/doc) (as of 2026-10-14); no endpoint, field, or limit in this guide comes from anywhere else.

## Step 1: Get an API key

1. Sign in to Namefi and open [namefi.io/api-key](https://namefi.io/api-key). The page is the API-keys tab of your profile, so it needs a signed-in session.
2. Generate a key. Namefi's agent instructions show keys with an `nfk_` prefix ([llms.txt](https://namefi.io/llms.txt)).
3. Put it in an environment variable instead of pasting it into commands:

```bash
export NAMEFI_API_KEY="paste-your-key-here"
```

Treat the key like a password: keep it out of source control, shell history you share, and screenshots. If a key leaks, generate a replacement and stop using the old one.

**One rule that surprises people:** an API key inherits the permissions of the wallet that generated it. To change DNS for a domain, generate the key from the wallet that owns that domain's NFT ([Namefi docs: Authentication](https://docs.namefi.io/docs/02-authentication)). A key created from a different wallet will authenticate but will not be allowed to write to that domain.

## Step 2: Authenticate and make a first request

Send the key in the `x-api-key` header. The OpenAPI document declares this as its `apiKeyAuth` scheme, alongside an alternative `bearerAuth` scheme (an OAuth access token sent as `Authorization: Bearer ...`).

The first request that proves your key works is the balance check:

```bash
curl https://api.namefi.io/v-next/balance \
  -H "x-api-key: $NAMEFI_API_KEY"
```

Per the OpenAPI document, a successful response lists balances per chain (`chainId`, `chainName`, `walletAddress`, `rawBalance`, `balanceInUsd`, `balanceInUsdCents`) plus `totalBalanceInUsd` and `totalBalanceInUsdCents`.

The failure side is easy to see live. Calling `/balance` without a valid key returns HTTP 401 with this JSON shape, and the `message` tells you exactly what to do:

```json
{
  "defined": false,
  "code": "UNAUTHORIZED",
  "status": 401,
  "message": "No valid authentication provided. To authenticate: get an API key at https://namefi.io/api-key and send it as the x-api-key header, or use OAuth ..."
}
```

Two other authentication options exist, and you usually do not need them:

- **OAuth bearer token.** Every `/v-next` endpoint also accepts an OAuth access token, and Namefi documents a device flow for headless tools ([llms.txt](https://namefi.io/llms.txt)). Use it when you do not want a long-lived key stored anywhere.
- **Wallet signatures (EIP-712 and SIWE).** These are for programmatic use without a stored key. The OpenAPI document shows most write endpoints accepting either a plain body or a signed envelope (`payloadType`, `payload`, `timestamp`, `nonce`). With an API key you send the plain body, and the docs say the key handles signing transparently. [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/) explains how the layers differ.

## Step 3: Search availability (no key needed)

Availability search is open: Namefi's [llms.txt](https://namefi.io/llms.txt) calls the REST search endpoint open, and an unauthenticated call works live. `GET /search/availability` takes one required query parameter, `domain`:

```bash
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"
```

For many names at once, use `GET /search/bulk-availability` with repeated `domains[]` parameters:

```bash
curl "https://api.namefi.io/v-next/search/bulk-availability?domains[]=example.com&domains[]=example.org"
```

Both return, per domain, `availability` (boolean), `pricingDetails`, `registrarKey`, `durationValidationInYears` (`min`, `max`, and sometimes `increment`), `importable`, `supported`, and `currentOwner` when taken. For a name nobody had registered, a live response on 2026-10-14 looked like this (trimmed):

```json
{
  "domain": "namefi-api-guide-test-93817.com",
  "availability": true,
  "pricingDetails": {
    "registrationPrice": { "type": "PER_YEAR", "price": { "amount": 10.88, "currency": "USD" } }
  },
  "durationValidationInYears": { "min": 1, "max": 10 }
}
```

Do not hard-code that price; it varies by TLD and changes. Read it from the response each time. Two shapes exist, per the [Namefi pricing docs](https://docs.namefi.io/docs/03-getting-started/07-pricing): `PER_YEAR` (multiply `amount` by the number of years) and `MULTI_YEAR` (a map keyed by year count, where only listed durations are valid). All amounts are USD.

If a name is malformed, the API answers HTTP 422 with code `INPUT_VALIDATION_FAILED` and a message quoting the pattern it expected. For ideas rather than a specific name, `GET /search/suggestions` takes a required `query` plus optional `parentDomain`, `page`, and `pageSize`.

## Step 4: Register a domain

Registration is `POST /orders/register-domain`. The only required field is `normalizedDomainName`, which must be lowercase with no trailing dot:

```bash
curl -X POST https://api.namefi.io/v-next/orders/register-domain \
  -H "x-api-key: $NAMEFI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName":"example.com","durationInYears":1}'
```

Optional fields, from the OpenAPI schema:

- `durationInYears`: integer from 0 to 10, default 1. Check `durationValidationInYears` from the availability response first, because the valid range is per domain.
- `nftReceivingWallet`: `{ "walletAddress": "0x...", "chainId": 8453 }`. Where the domain's NFT goes; by default the buyer's wallet on Base.
- `domainSetupOptions`: per-domain overrides (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `nameservers`, `keepExistingNameservers`).

**Registration is asynchronous.** The response is an order with an `id`. Poll `GET /orders/{orderId}` until `order.status` reaches a terminal value. The OpenAPI document lists six statuses: `CREATED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, and `PARTIALLY_COMPLETED`; the last four are terminal. The docs suggest polling every five seconds ([Namefi docs: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain)), but mind the rate limit below.

```bash
curl https://api.namefi.io/v-next/orders/ORDER_ID \
  -H "x-api-key: $NAMEFI_API_KEY"
```

To seed DNS in the same call, use `POST /orders/register-domain/records`: the same body plus a `records` array of `{name, type, rdata, ttl}` objects, applied after the order finishes. One caution: the OpenAPI document gives a `ttl` default of 30 seconds there, so set `ttl` explicitly.

## Step 5: Manage DNS records

Reading a zone needs no key. Writing needs the key, and the key must come from the domain's owning wallet (see Step 1).

```bash
# Read all records in a zone (no key needed)
curl "https://api.namefi.io/v-next/dns/records?zoneName=example.com"

# Create a record
curl -X POST https://api.namefi.io/v-next/dns/records \
  -H "x-api-key: $NAMEFI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"zoneName":"example.com","type":"A","name":"@","rdata":"203.0.113.10","ttl":300}'
```

An unauthenticated read works live: it returns a JSON array of record objects, each with an `id`, `zoneName`, `name`, `type`, `ttl`, `rdata`, and some metadata. You need that `id` for updates and deletes.

| Operation | Endpoint | Body |
| --- | --- | --- |
| Create one | `POST /dns/records` | `zoneName`, `type`, `rdata` required; `name`, `ttl` optional |
| Update one | `PUT /dns/record` | `id`, `zoneName` required; `type`, `name`, `rdata`, `ttl` to change |
| Delete one | `DELETE /dns/record` | `id`, `zoneName` |
| Batch create | `POST /dns/records/batch` | `zoneName`, `records[]` each with `type`, `name`, `ttl`, `rdata` |
| Batch update | `PUT /dns/records/batch` | `zoneName`, `records[]` each with `id` |
| Batch delete | `DELETE /dns/records/batch` | `zoneName`, `recordsIds[]` |

Conventions that come from the [Namefi DNS reference in llms.txt](https://namefi.io/llms.txt): use `@` as `name` for the apex, write fully qualified targets in lowercase with a trailing dot (`cname.vercel-dns.com.`), and give `ttl` in seconds. The supported types are A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, and SPF; the OpenAPI enum also includes ANAME. [DNS record types](/en/glossary/dns-record-types/) explains what each is for. Batch operations are scoped to one `zoneName` per request.

Related toggles live under `/dns` too: forwarding (`PUT /dns/forwarding`), automatic ENS records (`PUT /dns/auto-ens`), and parking (`PUT /dns/park`). Auto-renewal is `PUT /domain-config/auto-renew` with `{"normalizedDomainName": "...", "enableAutoRenew": true}`.

## Step 6: Understand errors and rate limits

Errors share one JSON envelope: `defined`, `code`, `status`, `message`, and sometimes `data`. Read `message` before anything else; Namefi writes it to say what to do next.

| HTTP status | Seen as | What to do |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` (verified live) | Missing or invalid credentials. Check the `x-api-key` header and that the key is still active. |
| 402 | `PAYMENT_REQUIRED` (in the spec) | Neither NFSC nor a saved card covers the price. The error carries links to top up or add a card. |
| 422 | `INPUT_VALIDATION_FAILED` (verified live) | A field failed validation, for example a domain name that does not match the allowed pattern. |
| 429 | Too Many Requests (from the docs) | Wait for the `Retry-After` header, then retry. |

The OpenAPI document also declares 400, 403, 404, 406, 408, 409, 412, and 500 responses without describing their bodies, so handle them generically.

**Rate limit:** 60 requests per minute per account, one rolling 60-second window shared across the whole `v-next` surface, per the [Namefi rate-limit docs](https://docs.namefi.io/docs/03-getting-started/06-rate-limits). Every response carries `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers. A polling loop at five-second intervals uses 12 of your 60 calls per minute, so batch DNS changes instead of sending them one at a time.

## Step 7: Pay with NFSC or a saved card, or use a wallet

Registration is paid, and the order does not run until payment is covered. For `POST /orders/register-domain`, the OpenAPI description says payment comes from your **NFSC balance first**, and any remainder is charged to the **credit card saved on your Namefi profile**. Card charges are at least $1.00; when the shortfall is smaller, the card is charged $1.00 and correspondingly less NFSC is used. The order response's `payments` array shows the planned split, and the legs are charged asynchronously after the order is created.

- **Units:** `GET /balance` reports in USD and in integer USD cents (`balanceInUsdCents`), and order amounts use `amountInUSDCents`. Prefer the cent fields in code, and convert to dollars only for display.
- **Top up:** In production, Namefi's docs say to top up NFSC from the Namefi dashboard ([Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance)). `POST /user/faucet` requests NFSC **test** tokens on Sepolia, rate limited per user and wallet, and does not fund production spending.
- **What NFSC stands for:** Namefi Service Credits, the prepaid balance shown in your Namefi account ([llms.txt](https://namefi.io/llms.txt)).

If you would rather not hold a balance, there are wallet-pay endpoints, `GET /x402/domain/{normalizedDomainName}` and `GET /mpp/domain/{normalizedDomainName}`, that settle each registration with a crypto payment. They are separate HTTP flows, not MCP tools. [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/) covers them end to end, and the [x402 glossary entry](/en/glossary/x402/) explains the protocol.

## When to use MCP or the CLI instead

The REST API is the right choice for scripts, CI jobs, cron tasks, and any runtime that cannot speak MCP. Two other doors open onto the same operations:

- **MCP server.** `https://api.namefi.io/mcp` exposes the API as typed tools for an [AI agent](/en/glossary/ai-agent/); [namefi.io/mcp](https://namefi.io/mcp) says it offers 50 tools generated from the API. It accepts the same `x-api-key` header, or OAuth with no stored key. Namefi's own agent instructions tell agents to prefer MCP when the client supports it and to treat REST as a fallback, with search as the one open exception. Start with [Namefi MCP Quickstart](/en/blog/mcp-quickstart/) or the [Claude walkthrough](/en/blog/claude-mcp-domains/), and read [MCP vs REST API vs CLI](/en/blog/mcp-vs-rest-api/) to decide.
- **The `namefi` CLI.** [namefi.io/cli](https://namefi.io/cli) describes a single binary for dynamic DNS, listing the domains you own (`namefi domains list`), and port forwarding. It signs in with a browser login (`namefi login`), a device flow for headless hosts, or an API key. Its documented jobs are dynamic DNS, listing your portfolio, and port forwarding; the CLI page does not describe registration.

## Frequently Asked Questions

### Do I need an API key to check whether a domain is available?

No. Namefi's llms.txt calls the REST search endpoint open, and on 2026-10-14 an unauthenticated availability call, and a bulk one, returned pricing. You need a key once you register, change DNS, or read account data such as your balance.

### Which header carries the API key?

`x-api-key`. The OpenAPI document declares it as the `apiKeyAuth` scheme, and the unauthenticated 401 response names the same header. An OAuth access token goes in `Authorization: Bearer` instead.

### Why does my key work but DNS writes are rejected?

Most likely the key was generated from a different wallet than the one that owns the domain. A key inherits its wallet's permissions, so generate the key from the owning wallet and retry.

### How much does a registration cost, and in what currency?

It depends on the TLD and duration. Read `pricingDetails` from the availability response; all amounts are in USD ([pricing docs](https://docs.namefi.io/docs/03-getting-started/07-pricing)). The API takes the cost from your NFSC balance first and any remainder from your saved card.

### Is registration instant?

No. The registration call returns an order, and the order finishes asynchronously. Poll `GET /orders/{orderId}` until the status is `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED`.

### What is the rate limit?

60 requests per minute per account, across all `v-next` endpoints combined. Watch the `RateLimit-Remaining` header and honor `Retry-After` on a 429.

### Can I test without spending real money?

Namefi documents a faucet, `POST /user/faucet`, that requests NFSC test tokens on Sepolia, but it is described as a test facility, not a way to fund production. Check availability and read-only calls need no funds at all.

### Should my AI agent use REST, MCP, or the CLI?

For an agent, prefer MCP when the client supports it: typed tools, and OAuth sign-in without a stored key. Use REST for scripts and CI. Use the CLI for dynamic DNS and listing your domains from a terminal.

## Sources and further reading

All pages fetched on 2026-10-14 unless noted.

- Namefi — [OpenAPI document, `api.namefi.io/v-next/openapi/doc`](https://api.namefi.io/v-next/openapi/doc) (every endpoint, parameter, field, order status, and the `apiKeyAuth` / `bearerAuth` schemes cited above)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (authentication, register and DNS curl recipes, record conventions, agent policy on MCP versus REST)
- Namefi — [namefi.io/api-key](https://namefi.io/api-key) (API-key page; sign-in required, so its contents were not inspected)
- Namefi — [namefi.io/mcp](https://namefi.io/mcp) (MCP endpoint, tool count, authentication options)
- Namefi — [namefi.io/cli](https://namefi.io/cli) (CLI install, login, and commands)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication#:~:text=The%20API%20key%20inherits%20permissions%20from%20the%20wallet%20that%20generated%20it) (API key inherits wallet permissions; auth methods)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain) (payment order, polling)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance) (faucet, production top-up)
- Namefi — [docs.namefi.io: Rate limits](https://docs.namefi.io/docs/03-getting-started/06-rate-limits) (60 requests per minute, headers, 429 handling)
- Namefi — [docs.namefi.io: Pricing model](https://docs.namefi.io/docs/03-getting-started/07-pricing) (PER_YEAR and MULTI_YEAR, USD)
- Live calls to `api.namefi.io/v-next` on 2026-10-14: unauthenticated availability, bulk availability, DNS read, `/balance` (401), `/orders/register-domain` (401), and a malformed domain (422).
