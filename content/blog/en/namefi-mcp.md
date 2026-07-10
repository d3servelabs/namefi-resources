---
title: "Namefi MCP Server: Domain Tools for AI Agents"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Every tool the Namefi MCP server exposes to AI agents: search, register, DNS, renewals, tokenization, plus the auth model and example workflows."
keywords: ["namefi mcp server", "mcp tools list", "namefi mcp capabilities", "mcp server domain management", "domain registrar mcp server", "namefi api key scopes", "dns mcp tools", "register domain mcp", "tokenize domain mcp", "x402 domain payment", "siwe authentication domains", "eip-712 domain signing", "outbound lead finding domains", "namefi openapi", "ai agent domain tools"]
relatedArticles:
  - /en/blog/claude-mcp-domains/
  - /en/blog/ai-agent-register/
  - /en/blog/wallet-checkout/
  - /en/blog/llms-txt/
  - /en/blog/mcp-quickstart/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/tokenized-domain/
  - /en/glossary/dnssec/
  - /en/glossary/ens/
---

Every [AI agent](/en/glossary/ai-agent/) that connects to the Namefi MCP server sees the same list of callable tools — one per operation the API defines, covering search, registration, DNS, domain-level configuration, outbound lead finding, and payment. This page is the catalog: every tool, what it does, what auth it needs, and three worked examples combining several tools into an actual workflow.

If you haven't connected an agent to Namefi yet, start with [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) for per-client setup, or [Buy a Domain with Claude: Namefi MCP Step-by-Step Guide](/en/blog/claude-mcp-domains/) for a full transcript. This page assumes the connection already exists.

## What the Namefi MCP server is

Namefi runs a single MCP server for its entire API, at `https://api.namefi.io/mcp`, over the Streamable HTTP transport. Instead of an agent hand-rolling REST calls from documentation pasted into a chat, it connects once and receives a typed tool for every operation the API defines — generated straight from Namefi's own OpenAPI 3 specification at [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json), so the MCP catalog and the REST API can't drift apart from each other.

A machine-readable discovery descriptor at [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) lets an agent find the server without a human pasting a URL into a config file by hand: it names the server `namefi-api`, reports `streamable-http` transport, and declares `apiKey`/`x-api-key` as the connection auth. Namefi, an [ICANN](/en/glossary/icann/)-accredited [registrar](/en/glossary/registrar/), also publishes the same operations as plain HTTPS endpoints at [namefi.io/llms.txt](https://namefi.io/llms.txt), for agents and scripts that don't speak MCP.

## The complete capability catalog

Below is every operation the API defines as of this writing, grouped the way Namefi's own reference groups them. The **Operation** column is the `operationId` from the OpenAPI spec — the name an MCP client's tool list is built from. The **Auth** column shows the simplest path (an API key covers nearly everything); the full auth model, including the alternatives to an API key, is in the next section.

### Search & discovery

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | Check whether one domain name is free to register | None |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | Screen a batch of candidate names in a single call | None |
| `getSuggestions` | `GET /v-next/search/suggestions` | Get algorithmic name suggestions related to a query | None |

### Registration & orders

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | Register a domain for 0–10 years. Accepts a `domainSetupOptions` object (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) and an optional `nftReceivingWallet` | API key |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | Register and apply an initial set of DNS records in the same call | API key |
| `getOrder` | `GET /v-next/orders/{orderId}` | Poll an order until it reaches a terminal status: `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED` | API key |

Registration is asynchronous — `registerDomain` returns an order `id` immediately, and the agent polls `getOrder` until it settles. The [Claude walkthrough](/en/blog/claude-mcp-domains/) and [multi-agent setup guide](/en/blog/ai-agent-register/) both show this pattern in full transcript form.

### DNS record management

Full CRUD, one record at a time or batched, plus a read that needs no authentication at all:

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | List every record in a zone | None |
| `createDnsRecord` | `POST /v-next/dns/records` | Create one record | API key |
| `updateDnsRecord` | `PUT /v-next/dns/record` | Update a record by ID | API key |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | Delete a record by ID | API key |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | Create many records in one call | API key |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | Update many records in one call | API key |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | Delete many records in one call | API key |

Supported [record types](/en/glossary/dns-record-types/): A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF. Two formatting rules trip up most first attempts: `zoneName` must not have a trailing dot, while `rdata` values for CNAME, MX, and NS records must.

### Domain-level toggles

These flip a whole feature on or off, distinct from a single DNS record:

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | Turn [domain parking](/en/glossary/domain-parking/) on or off | API key |
| `isDomainParked` | `GET /v-next/dns/parked` | Check whether a domain is currently parked | None |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | Turn [domain forwarding](/en/glossary/domain-forwarding/) on or off | API key |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | Turn automatic [ENS](/en/glossary/ens/) record publishing on or off | API key |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Turn Vercel Anycast DNS records on or off | API key |

Note that [DNSSEC](/en/glossary/dnssec/) is not one of these toggles — it's set at registration time, one of the `domainSetupOptions` fields on `registerDomain` above, not a separate endpoint an agent calls after the fact.

### Domain configuration

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | Check whether auto-renewal is on | API key |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | Turn auto-renewal on or off | API key |

When [auto-renewal](/en/glossary/domain-renewal/) is on, the domain renews automatically before expiration using the payment methods on the owner wallet — a standing authorization worth deciding deliberately per domain, not leaving on by default across a whole portfolio.

### Outbound lead finding

The newest surface, turning owned domains into a sales pipeline instead of a static asset list:

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | List domains the authenticated wallet owns | API key |
| `startOutboundRun` | `POST /v-next/outbound/runs` | Start an AI lead-finding run for one owned domain, with a `reasoningEffort` of `low`, `medium`, or `high` | API key |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | List past and active runs | API key |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | Poll a run's status: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, or `CANCELED` | API key |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | List ranked buyer leads, each with a rationale, discovered contacts, and any existing outreach draft | API key |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | Generate an outreach draft for one lead, or return the existing one at no extra generation cost | API key |

The response excludes internal ranking mechanics — score, model details, suppressed-lead status — so an agent summarizing results for a human only sees the public rationale, the contact found, and whether a draft exists.

### Payments & account

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | Check the NFSC (Namefi Service Credit) balance funding registrations | API key |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | Request free test NFSC credits (development environments only) | API key |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Register and pay in one stablecoin-signed HTTP 402 flow, no Namefi account | Wallet signature |
| — | `GET /x402/purchase/{purchaseId}` | Poll an x402 purchase's status | None |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | Register and pay via the MPP (Machine Payable Protocol) challenge-response flow | Wallet signature |

That covers every operation in scope for search, registration, DNS, domain configuration, outbound, and payment — each reachable as an MCP tool through the single server connection, or as a plain HTTPS call for agents that don't speak MCP. (Namefi's API also exposes a few account-management and EIP-712/SIWE helper operations outside this list; the full set is always current in the OpenAPI spec linked in Sources below.)

## The auth model: three paths in, one wallet behind all of them

Every write operation above checks the same thing — does the caller control the wallet that owns, or will own, the domain — by one of three paths. Which applies depends on the operation, not a single account-level setting.

**API key (`x-api-key`).** The simplest option, and the one every worked example in this cluster uses. Generate one at [namefi.io/api-key](https://namefi.io/api-key); it works for every operation above, including DNS writes, parking, and registration, because the key inherits the permissions of the wallet that generated it — pass it as a plain HTTP header, no SDK required.

**EIP-712 typed-data signature.** For programmatic use without a stored key, sign each request with an Ethereum [wallet](/en/glossary/wallet/): headers `x-namefi-signer`, `x-namefi-signature`, and `x-namefi-eip712-type` wrap the payload in an envelope with a timestamp and single-use nonce that expires after 300 seconds — the mode operations like `toggleDomainParking`, `createDnsRecord`, and `registerDomain` require without an API key. The domain and type definitions come from live endpoints (`GET /v-next/eip712/domain`, `/eip712/types`) rather than a hardcoded constant, since Namefi's docs note they can change. Smart-contract wallets can't sign directly, so an approved externally-owned account signs on the contract's behalf, with `x-namefi-erc1271-account` or `x-namefi-eip7702-account` naming which contract is authorizing the request.

**SIWE (Sign-In with Ethereum).** A session token (`x-namefi-siwe-token`) for protected reads that don't need a fresh signature per call, like listing owned domains or orders — fetch a nonce, get the message to sign, sign it with `personal_sign`, verify it, then reuse the token.

A handful of operations need no authentication — `checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked`, and the EIP-712 metadata endpoints — because they're read-only and expose nothing a domain's public DNS wouldn't already show a browser.

Layered on top is payment. `registerDomainX402` settles a purchase via the [x402 protocol](https://x402.org): the buyer's wallet signs an EIP-3009 `transferWithAuthorization` for a [stablecoin](/en/glossary/stablecoin/) like USDC, no Namefi account involved. `registerDomainMPP` reaches the same outcome via a signed challenge-response instead. Both let an agent skip account creation and pay per transaction — [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/) covers that path end to end.

## Tokenization runs through the catalog, not beside it

`registerDomain` mints the domain as an [NFT](/en/glossary/nft/) — an [ERC-721](/en/glossary/erc-721/) token, [the standard interface](https://eips.ethereum.org/EIPS/eip-721) most marketplaces and wallets already read — on Base by default, to the wallet tied to the caller's API key. `nftReceivingWallet` redirects that to a different wallet or chain at registration time, and everything downstream — DNS writes, parking, auto-renewal, outbound lead-finding — checks that same on-chain ownership record rather than a separate account database. A [tokenized domain](/en/glossary/tokenized-domain/) traded on a marketplace like [OpenSea](https://opensea.io) carries its DNS control and ERC-721 ownership as one object, not two systems to keep in sync by hand.

## Three agents, three ways to use the same toolset

**A builder registers a domain and ships DNS in one conversation.** `checkAvailability` confirms the name is free, `registerDomain` submits it with `domainSetupOptions` set for `autoRenew` and `dnssec`, and once the order reaches `SUCCEEDED`, `batchCreateDnsRecords` writes the CNAME and TXT records a deployment platform's verification step is waiting on. The [Namefi MCP quickstart for coding agents](/en/blog/mcp-quickstart/) walks through this sequence inside an editor.

**A domain trader manages a portfolio.** `getUserDomains` pulls current holdings, `checkBulkAvailability` screens new candidates in one call, and `registerDomain` picks up the ones worth acquiring. For names being resold, `toggleDomainParking` puts up a landing page and `isDomainParked` confirms it's live; across the portfolio, `getAutoRenew` and `toggleAutoRenew` decide which names are worth a standing renewal authorization and which are speculative enough to let lapse.

**A business runs outbound lead-finding on names it already owns.** `getUserDomains` identifies an unused domain, `startOutboundRun` kicks off research, and `getOutboundRun` polls until it reaches `SUCCEEDED`. `listOutboundLeads` returns ranked businesses whose profile suggests they'd want that name, and `prepareOutboundOutreach` drafts an email per lead — generated once, then returned free on repeat calls.

## Before an agent runs any of this unattended

Namefi's own outbound documentation flags four operations as **consequential** — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — because each spends balance or takes an externally visible action. Read-only tools like `checkAvailability` carry no risk to run autonomously; anything that writes an order, a DNS record on a live domain, or an outreach draft is worth a confirmation step. [What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/) has a fuller checklist for evaluating any registrar's agent-facing surface this way.

## Keeping this catalog current

This table mirrors Namefi's live OpenAPI specification as of the publish date above, not a fixed roadmap — new operations land in [namefi.io/llms.txt](https://namefi.io/llms.txt) and [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) before they land in any blog post's table.

## Frequently Asked Questions

### Do I need an API key just to check whether a name is available?
No. `checkAvailability`, `checkBulkAvailability`, and `getSuggestions` require no authentication, so they work against a freshly connected agent before funding anything.

### Can an agent use this whole catalog without me ever holding a Namefi API key?
Yes. `registerDomainX402` and `registerDomainMPP` both settle a registration through a wallet signature with no Namefi account, and EIP-712 signing covers the rest of the write operations directly from a wallet.

### Is a domain automatically tokenized when I register it through any of these paths?
Yes, by default, across every registration path. If `nftReceivingWallet` isn't specified, the domain registers as an ERC-721 NFT to the wallet tied to the caller's API key, on Base.

### Which operations should a human confirm before an autonomous agent runs them?
At minimum, the four Namefi's docs mark as consequential — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — plus any DNS write on a domain already serving live traffic.

## Connect your agent to the full catalog

Every tool above is live behind one connection: `https://api.namefi.io/mcp`. If you haven't set that up yet, [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) covers exact configuration for six different clients, and [llms.txt for Domains](/en/blog/llms-txt/) explains the discovery layer underneath it.

**[Generate a Namefi API key](https://namefi.io/api-key)** and point your agent at the server — the tools above are what it will find waiting.

## Sources and further reading

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP server URL, transport, authentication, core operation reference — primary source for this catalog)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (single-file reference inlining Web3 payments and outbound lead-finding)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712, and SIWE flows in detail)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor: server name, URL, transport, auth type)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (machine-readable OpenAPI 3 spec — source of every `operationId` and endpoint in the capability catalog above)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (API key, EIP-712, and SIWE auth modes; per-operation auth requirements; ERC-1271/EIP-7702 delegation)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (registration request fields, polling flow, order status values)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC balance and faucet endpoints)
- Model Context Protocol — [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (protocol overview)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (specification and rationale for the discovery convention Namefi's file follows)
- x402.org — [x402 protocol](https://x402.org) (HTTP 402-based stablecoin payment standard underlying `registerDomainX402`)
- Ethereum Improvement Proposals — [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (the token standard Namefi's domain NFTs implement)
