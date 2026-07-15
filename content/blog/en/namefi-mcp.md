---
title: "Namefi MCP Server: Domain Tools for AI Agents"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "The Namefi MCP server's current /v-next tool surface: search, registration, DNS, renewals, outbound workflows, OAuth and API-key authentication, plus separate x402 and MPP HTTP payment paths."
keywords: ["namefi mcp server", "mcp tools list", "namefi mcp capabilities", "mcp server domain management", "domain registrar mcp server", "Namefi MCP OAuth", "OAuth 2.1 PKCE MCP", "namefi api key scopes", "dns mcp tools", "register domain mcp", "tokenize domain mcp", "x402 domain payment", "siwe authentication domains", "eip-712 domain signing", "outbound lead finding domains", "namefi openapi", "ai agent domain tools"]
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

An [AI agent](/en/glossary/ai-agent/) that connects to the Namefi MCP server receives callable tools generated from the server's supported `/v-next` API surface, covering search, registration, DNS, domain configuration, account operations, and outbound lead finding. The x402 and MPP payment flows use separate HTTP endpoints; they are not MCP tools. This page catalogs the documented MCP surface, explains authentication, and gives three workflows.

If you haven't connected an agent to Namefi yet, start with [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) for per-client setup, or [Buy a Domain with Claude: Namefi MCP Step-by-Step Guide](/en/blog/claude-mcp-domains/) for a full transcript. This page assumes the connection already exists.

## What the Namefi MCP server is

Namefi runs a Streamable HTTP MCP server at `https://api.namefi.io/mcp`. Instead of an agent hand-rolling REST calls from documentation pasted into chat, it connects and receives typed tools for the supported `/v-next` operations generated from Namefi's OpenAPI 3 specification at [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json). Generation reduces manual drift, but the live tool list, OpenAPI document, discovery descriptor, and blog snapshot can still change at different times; inspect `tools/list` for the connection you are actually using.

A machine-readable discovery descriptor at [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) names the server `namefi-api`, reports `streamable-http` transport, and documents both `x-api-key` and OAuth 2.1 authorization-code authentication with PKCE, protected-resource discovery, refresh tokens, device flow, and dynamic client registration. Namefi, an [ICANN](/en/glossary/icann/)-accredited [registrar](/en/glossary/registrar/), also publishes plain HTTPS endpoints at [namefi.io/llms.txt](https://namefi.io/llms.txt) for agents and scripts that do not speak MCP. That file explicitly identifies `/x402/...` and `/mpp/...` as separate HTTP payment endpoints, not MCP tools.

## The complete capability catalog

Below is a dated snapshot of the documented `/v-next` operation groups. The **Operation** column is the OpenAPI `operationId` from which an MCP tool name is built. The **Auth** column shows the REST-level API-key path; an MCP client can instead authenticate its session with an OAuth bearer token. Rows labeled public REST do not imply an anonymous MCP connection: an unauthenticated `initialize` request returned `401 Unauthorized` when verified on **July 14, 2026**.

### Search & discovery

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | Check whether one domain name is free to register | Public REST; authenticated MCP session currently required |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | Screen a batch of candidate names in a single call | Public REST; authenticated MCP session currently required |
| `getSuggestions` | `GET /v-next/search/suggestions` | Get algorithmic name suggestions related to a query | Public REST; authenticated MCP session currently required |

### Registration & orders

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | Register a domain for 0–10 years. Accepts a `domainSetupOptions` object (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) and an optional `nftReceivingWallet` | API key |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | Register and apply an initial set of DNS records in the same call | API key |
| `getOrder` | `GET /v-next/orders/{orderId}` | Poll an order until it reaches a terminal status: `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED` | API key |

Registration is asynchronous — `registerDomain` returns an order `id` immediately, and the agent polls `getOrder` until it settles. The [Claude walkthrough](/en/blog/claude-mcp-domains/) and [multi-agent setup guide](/en/blog/ai-agent-register/) both show this pattern in full transcript form.

### DNS record management

Full CRUD, one record at a time or batched. The REST read is documented as public, while the live MCP endpoint currently requires the session itself to authenticate:

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | List every record in a zone | Public REST; authenticated MCP session currently required |
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
| `isDomainParked` | `GET /v-next/dns/parked` | Check whether a domain is currently parked | Public REST; authenticated MCP session currently required |
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

### Account tools available through `/v-next`

| Operation | Endpoint | What it does | Auth |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | Check the NFSC (Namefi Service Credit) balance funding registrations | API key |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | Request free test NFSC credits (development environments only) | API key |

The sections above are a dated snapshot of the documented `/v-next` operations that the MCP server can expose. The live `tools/list` response is authoritative for a connected client; the OpenAPI document linked below is authoritative for plain REST operations and may include helpers outside this editorial catalog.

### Outside MCP: x402 and MPP payment endpoints

Namefi also publishes wallet-paid registration flows as plain HTTP endpoints. They can be called by an agent with a general HTTP client, but they do not appear merely because the agent connected to the Namefi MCP server.

| HTTP endpoint | What it does | Auth |
| --- | --- | --- |
| `GET /x402/domain/{domainName}` | Begin a stablecoin-paid registration using the x402 HTTP 402 flow | Wallet payment authorization |
| `GET /x402/purchase/{purchaseId}` | Poll an x402 purchase's status | Follow the live endpoint's current requirements |
| `GET /mpp/domain/{domainName}` | Begin a registration using the MPP challenge-response flow | Wallet payment authorization |

## Authentication: MCP connection auth and REST request auth are different layers

An MCP client must first authenticate the server connection. The current discovery descriptor advertises OAuth 2.1 bearer tokens, with authorization code plus PKCE, protected-resource and authorization-server metadata, refresh tokens, device flow, and dynamic client registration. Compatible clients can therefore connect with the MCP URL and complete an OAuth flow without storing a Namefi API key in their configuration.

**API key (`x-api-key`).** For explicit header-based or automated setups, generate a key at [namefi.io/api-key](https://namefi.io/api-key) and pass it as an HTTP header. A key is sensitive: keep it out of committed MCP configuration and scope its use to the permissions Namefi grants it.

The descriptor also says certain read-only tools need no authentication. However, an unauthenticated MCP `initialize` request returned `401 Unauthorized` when verified on **July 14, 2026**. Because initialization comes before any tool call, treat the live MCP connection as authentication-required until the implementation and descriptor agree.

For direct REST calls, Namefi documents additional request-level authentication modes. These are not a promise that an MCP client will automatically obtain a wallet signature for every tool call:

**EIP-712 typed-data signature.** For programmatic use without a stored key, sign each request with an Ethereum [wallet](/en/glossary/wallet/): headers `x-namefi-signer`, `x-namefi-signature`, and `x-namefi-eip712-type` wrap the payload in an envelope with a timestamp and single-use nonce that expires after 300 seconds — the mode operations like `toggleDomainParking`, `createDnsRecord`, and `registerDomain` require without an API key. The domain and type definitions come from live endpoints (`GET /v-next/eip712/domain`, `/eip712/types`) rather than a hardcoded constant, since Namefi's docs note they can change. Smart-contract wallets can't sign directly, so an approved externally-owned account signs on the contract's behalf, with `x-namefi-erc1271-account` or `x-namefi-eip7702-account` naming which contract is authorizing the request.

**SIWE (Sign-In with Ethereum).** A session token (`x-namefi-siwe-token`) for protected REST reads that do not need a fresh signature per call, such as listing owned domains or orders — fetch a nonce, get the message to sign, sign it with `personal_sign`, verify it, then reuse the token.

The x402 and MPP flows add payment authorization to their separate HTTP endpoints; they are not alternate authentication methods for an unauthenticated MCP connection. [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/) covers those HTTP flows end to end.

## Tokenization runs through the catalog, not beside it

`registerDomain` can mint the domain as an [NFT](/en/glossary/nft/) — an [ERC-721](/en/glossary/erc-721/) token, [the standard interface](https://eips.ethereum.org/EIPS/eip-721) many wallets and marketplaces can display — on Namefi's supported chain to the designated receiving wallet. `nftReceivingWallet` selects that wallet; it does not select an arbitrary chain. The token represents on-chain control within Namefi's system, while registrar, registry, ICANN policy, Namefi's agreements, and court orders remain separate layers. Marketplace display and trading support also depend on the platform and collection configuration.

## Three agents, three ways to use the same toolset

**A builder registers a domain and ships DNS in one conversation.** `checkAvailability` confirms the name is free, `registerDomain` submits it with `domainSetupOptions` set for `autoRenew` and `dnssec`, and once the order reaches `SUCCEEDED`, `batchCreateDnsRecords` writes the CNAME and TXT records a deployment platform's verification step is waiting on. The [Namefi MCP quickstart for coding agents](/en/blog/mcp-quickstart/) walks through this sequence inside an editor.

**A domain trader manages a portfolio.** `getUserDomains` pulls current holdings, `checkBulkAvailability` screens new candidates in one call, and `registerDomain` picks up the ones worth acquiring. For names being resold, `toggleDomainParking` puts up a landing page and `isDomainParked` confirms it's live; across the portfolio, `getAutoRenew` and `toggleAutoRenew` decide which names are worth a standing renewal authorization and which are speculative enough to let lapse.

**A business runs outbound lead-finding on names it already owns.** `getUserDomains` identifies an unused domain, `startOutboundRun` kicks off research, and `getOutboundRun` polls until it reaches `SUCCEEDED`. `listOutboundLeads` returns ranked businesses whose profile suggests they'd want that name, and `prepareOutboundOutreach` drafts an email per lead — generated once, then returned free on repeat calls.

## Before an agent runs any of this unattended

Namefi's own outbound documentation flags four operations as **consequential** — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — because each spends balance or takes an externally visible action. A read-only call such as `checkAvailability` does not spend funds, but the current MCP session still needs authentication and its output can influence later actions. Anything that writes an order, changes DNS on a live domain, or creates externally directed outreach deserves an explicit confirmation step. [What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/) has a fuller checklist for evaluating any registrar's agent-facing surface this way.

## Keeping this catalog current

This table mirrors Namefi's live OpenAPI specification as of the publish date above, not a fixed roadmap — new operations land in [namefi.io/llms.txt](https://namefi.io/llms.txt) and [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) before they land in any blog post's table.

## Frequently Asked Questions

### Do I need an API key just to check whether a name is available?
Not necessarily. A compatible MCP client can authenticate with OAuth instead of a static API key. The underlying availability REST operations are documented as public, but the live MCP endpoint required authentication to initialize when checked on July 14, 2026. Availability checks do not require funding.

### Can an agent use this whole catalog without me ever holding a Namefi API key?
It can use OAuth for the MCP connection, without storing a Namefi API key. For direct REST integration, EIP-712 and SIWE cover supported request types. The x402 and MPP registration flows are separate HTTP endpoints, not MCP tools or substitutes for MCP connection authentication, so inspect the current documentation for the particular operation you need.

### Is a domain automatically tokenized when I register it through any of these paths?
For the documented `/v-next` `registerDomain` flow, Namefi mints the domain token to the designated receiving wallet on its supported chain. This catalog does not establish identical defaults for every separate registration and payment path, so inspect the current documentation for the path you are calling rather than assuming an API-key wallet or a particular chain.

### Which operations should a human confirm before an autonomous agent runs them?
At minimum, the four Namefi's docs mark as consequential — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — plus any DNS write on a domain already serving live traffic.

## Connect your agent to the current catalog

The MCP tools generated from the supported `/v-next` surface are available through `https://api.namefi.io/mcp`; x402 and MPP remain separate HTTP endpoints. Because the catalog can change, inspect the connected server's `tools/list` rather than treating this article as a permanent schema. If you have not connected yet, [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) covers configuration for six clients, and [llms.txt for Domains](/en/blog/llms-txt/) explains the discovery layer underneath it.

Connect with OAuth in a compatible client, or **[generate a Namefi API key](https://namefi.io/api-key)** for an explicit header-based setup, then inspect the live tool list.

## Sources and further reading

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP server URL, transport, authentication, core operation reference — primary source for this catalog)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (single-file reference inlining Web3 payments and outbound lead-finding)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712, and SIWE flows in detail)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor: server name, URL, transport, OAuth metadata, API-key authentication, and the read-only auth claim that differed from live `initialize` behavior on July 14, 2026)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (machine-readable OpenAPI 3 spec — source of every `operationId` and endpoint in the capability catalog above)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (API key, EIP-712, and SIWE auth modes; per-operation auth requirements; ERC-1271/EIP-7702 delegation)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (registration request fields, polling flow, order status values)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC balance and faucet endpoints)
- Model Context Protocol — [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (protocol overview)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (specification and rationale for the discovery convention Namefi's file follows)
- x402.org — [x402 protocol](https://x402.org) (HTTP 402-based stablecoin payment standard used by Namefi's separate `/x402/...` endpoints)
- Ethereum Improvement Proposals — [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (the token standard Namefi's domain NFTs implement)
