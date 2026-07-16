---
title: "Buy a Domain with Claude: Namefi MCP Step-by-Step Guide"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "Connect Claude to the Namefi MCP server and register a real domain from one conversation. Exact config, an annotated transcript, and troubleshooting."
keywords: ["namefi mcp", "claude mcp domain", "mcp server setup", "buy domain claude", "x-api-key", "step-by-step tutorial", "namefi mcp domain registration", "claude desktop register domain", "claude code buy domain", "namefi claude integration", "mcp domain registrar", "ai agent buy domain claude", "streamable http mcp"]
relatedArticles:
  - /en/blog/ai-agent-register/
  - /en/blog/cf-namecom-namefi/
  - /en/blog/ai-domain-platforms/
  - /en/blog/agent-native/
  - /en/blog/airo-vs-namefi/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/blockchain-concepts/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/dns-record-types/
  - /en/glossary/tokenized-domain/
  - /en/glossary/x402/
---

By the end of this guide you will have a real domain registered with [ICANN](/en/glossary/icann/), with its DNS pointed at whatever you're building, registered entirely from a conversation with Claude — no browser checkout, no cart, no CAPTCHA. This is the Namefi team's own setup guide for the [Namefi](https://namefi.io) MCP server — the human-readable walkthrough of the same API we publish for agents at [namefi.io/llms.txt](https://namefi.io/llms.txt) and [docs.namefi.io](https://docs.namefi.io). Where a detail isn't finalized or published yet, this guide says so explicitly rather than guessing.

Third-party walkthroughs of "register a domain with your [AI agent](/en/glossary/ai-agent/)" exist — [one popular example](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) demonstrates the pattern using a different MCP server built as a reseller on top of Cloudflare's Registrar API. The mechanics of MCP itself are the same idea across providers; this guide is specific to Namefi's own MCP server, its own authentication model, and its own [tokenized-domain](/en/glossary/tokenized-domain/) option, verified against Namefi's documentation rather than a third party's description of it.

## What is MCP, briefly

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard for connecting an AI application — Claude, in this case — to external tools and data sources: [a USB-C port for AI applications](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) is how the protocol's own documentation describes it — one standardized connector instead of a custom integration per tool. Connected to Namefi's MCP server, Claude gains a defined set of callable operations — checking availability, registering a domain, reading and writing DNS records — instead of reverse-engineering a REST API from documentation pasted into the chat.

## Prerequisites

- **An MCP-capable Claude client.** This guide covers Claude Code (command-line) with concrete, tested commands, and Claude Desktop / claude.ai (via Custom Connectors) with the documented general flow. Other MCP clients, like Cursor or Windsurf, connect to the same server; see the per-agent sections in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) for those, or the condensed [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/en/blog/mcp-quickstart/) if you just need the connection commands.
- **A Namefi API key**, generated at [namefi.io/api-key](https://namefi.io/api-key), *or* a crypto [wallet](/en/glossary/wallet/) if you'd rather pay per-transaction without an API key at all (see the wallet section near the end).
- **A funded NFSC balance** if you're registering on Namefi's production environment. NFSC (Namefi Service Credits) is the balance domain registration draws against; Namefi's docs describe topping it up through the Namefi dashboard in production, and requesting free test credits from a faucet endpoint in development environments.

## Step 1: Get a Namefi API key

The [API key](https://namefi.io/api-key) is the simplest authentication path, and it's the one this guide uses throughout: a single header covers every operation — registration, DNS record creation, updates, and deletes. One detail worth internalizing before you generate a key: **the key inherits the permissions of the wallet that generated it.** If you want to manage DNS for a domain you already own, generate the key from the wallet that owns that domain's NFT — a key generated from a different wallet won't have write access to a domain whose [registrant](/en/glossary/registrant/) is someone else.

Once generated, the key is a `nfk_`-prefixed string. You'll pass it as the `x-api-key` header on every write operation; read-only operations, like an availability check, don't require it at all.

## Step 2: Connect Claude to the Namefi MCP server

Namefi, an ICANN-accredited [registrar](/en/glossary/registrar/), runs a single MCP server for its entire API surface, at `https://api.namefi.io/mcp`, reachable over the Streamable HTTP transport. The server exposes every `/v-next` operation as a typed tool — search, registration, DNS, domain config, outbound — and its existence and connection details are themselves published as a discovery descriptor at [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), machine-readable so an agent can find the server without a human first pasting in the URL.

### Claude Code

Adding the server to Claude Code is one command:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

This matches [Claude Code's documented syntax](https://code.claude.com/docs/en/mcp) for adding a remote HTTP MCP server with a custom auth header — the general pattern is `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`. Run it once from your terminal (swap `YOUR_KEY` for the key from Step 1), and Claude Code writes the server into your project's or user's MCP configuration. By default the command registers the server for your current project only; add `--scope user` if you want it available across every project, or omit the key entirely and add it later if you only need read-only tools like availability search to start.

Confirm the connection with `claude mcp list`, which should show `namefi` as connected, and `/mcp` inside a Claude Code session to see the tool count Namefi's server exposes.

### Claude Desktop and claude.ai

Claude Desktop and claude.ai connect to remote MCP servers through **Custom Connectors**, documented at [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers): open Settings, go to Connectors, choose "Add custom connector," and enter the server URL — `https://api.namefi.io/mcp`. After you click Add, the flow prompts you to complete authentication; per Anthropic's documentation, this step "commonly involves OAuth, API keys, or username/password combinations" depending on what the specific server requires, with Claude presenting whatever prompt the server asks for.

<!-- TODO: confirm with team — the exact field Claude Desktop's Custom Connector auth screen presents for an x-api-key-style header; Anthropic's public docs describe the general authentication step without showing Namefi's server specifically --> If your Desktop connector setup doesn't surface an obvious place to enter the key, Claude Code is the verified path for now, and read-only tools (availability search) work over the connector with no key at all.

## Step 3: Fund your NFSC balance

Domain registration is a paid operation: it requires NFSC (Namefi Service Credits) on the paying wallet. In a development or test environment, a faucet (`POST /v-next/user/faucet`, or `client.user.requestNfscFaucet()` in the SDK) hands out free test credits, rate-limited per wallet. In production, NFSC is topped up through the Namefi dashboard. <!-- TODO: confirm with team — the exact production top-up flow: accepted payment methods and whether it's purchasable directly through chat or only through the dashboard UI --> You can check your current balance at any time — either by asking Claude ("what's my Namefi balance?") once connected, or directly against `GET /v-next/balance`.

## Step 4: The purchase conversation

With the MCP server connected and a funded balance, the rest of the flow happens in plain language. Here's an annotated version of what that conversation looks like, mapped to the underlying operation Namefi's API documentation names for each step.

**1. You ask Claude to check a name.**

> "Is `example.com` available to register?"

Claude calls the availability check (the `checkAvailability` operation, reachable directly at `GET /v-next/search/availability?domain=example.com`, no authentication needed). It reports back whether the name is free, and can screen a batch of candidates at once through the bulk-availability variant if you give it several names to compare.

**2. You confirm and register.**

> "Register it for one year and set up DNS to point `@` at 203.0.113.10."

Claude submits a registration order (`registerDomain`, `POST /v-next/orders/register-domain`) — or, if you asked for DNS records too, the combined `register-domain/records` variant, applying your requested [A record](/en/glossary/dns-record-types/) as soon as the order finishes. The request body takes a `normalizedDomainName` (lowercase, no trailing dot, any [TLD](/en/glossary/tld/) `search/availability` reported as registerable) and a `durationInYears` (0–10, default 1). An optional `nftReceivingWallet` controls tokenization — leave it out and the domain registers as an NFT on Base to the wallet tied to your API key. For registration orders, `domainSetupOptions` supports per-domain overrides such as `autoRenew` and `dnssec`. The shared request type also exposes `keepExistingNameservers`, but Namefi applies that field only to **domain-import** orders and ignores it for new registrations; an unregistered name has no existing [nameserver](/en/glossary/nameserver/) delegation to preserve.

**3. Claude polls until the order finishes.**

Registration is asynchronous. Claude (or you, watching status) polls `getOrder` (`GET /v-next/orders/{orderId}`) until the order reaches a terminal status: `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED`. A typical registration completes in a handful of poll cycles; Claude reports back once it does, rather than leaving you watching a spinner.

**4. You ask for more DNS records, if you didn't set them all up-front.**

> "Also add a CNAME for `www` pointing at `cname.vercel-dns.com.`, and a TXT record under `_verify` with this token."

Claude calls `createDnsRecord` (`POST /v-next/dns/records`) for each. Two formatting rules are worth knowing before you ask: `rdata` for [CNAME](/en/glossary/dns-record-types/) and similar record types must end in a trailing dot (`cname.vercel-dns.com.`), while `zoneName` — the domain itself — must not. Getting this backward is the single most common cause of a validation error in this flow.

**5. Optional: turn on auto-renewal.**

> "Turn on auto-renew for this domain."

Claude toggles [auto-renewal](/en/glossary/domain-renewal/) via `PUT /v-next/domain-config/auto-renew`. When this is enabled, the domain renews automatically before expiration using the payment methods available on the owner wallet — worth knowing before you turn it on, since it's a standing authorization, not a one-time confirmation.

## Step 5: Verify it resolves

[DNS propagation](/en/glossary/dns-propagation/) isn't instant, so give records a few minutes before checking. DNS reads require no authentication, so you (or Claude) can confirm what's live with `GET /v-next/dns/records?zoneName=example.com`, or a public DNS lookup tool. If you pointed the domain at a deployment platform, its own domain-verification step (checking for the TXT record it asked for) is a separate confirmation worth doing too.

## Paying with a wallet instead of an API key

Everything above uses the API-key path. Namefi also supports registering a domain with a crypto wallet and no Namefi account at all, via the [x402](/en/glossary/x402/) protocol: the buyer's wallet signs an EIP-3009 authorization, the API responds `402 Payment Required` with the price if none is attached, and settles registration once a valid payment arrives. That flow deserves its own guide rather than a footnote — see [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/), or the payment section of [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/), for the full detail.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401 UNAUTHORIZED` on any write call | API key invalid, expired, or generated from a wallet that doesn't own the domain | Generate a fresh key at [namefi.io/api-key](https://namefi.io/api-key) using the wallet that owns (or will own) the domain |
| `403 FORBIDDEN` | Key is valid, but the wallet it's tied to doesn't own this specific domain | Check ownership against your Namefi account before retrying |
| Registration order stuck in a non-terminal status | Normal — registration is asynchronous | Keep polling `getOrder`; Namefi's own examples poll every 5 seconds. Only treat it as stuck if it never reaches `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED` |
| DNS record create/update rejected with a validation error | `zoneName` has a trailing dot, or a CNAME/MX/NS `rdata` value is missing its trailing dot | `zoneName` = no trailing dot; FQDN-type `rdata` values = trailing dot required |
| Registration fails outright | Insufficient NFSC balance on the paying wallet | Check balance (`GET /v-next/balance`), top up via the faucet (test) or the Namefi dashboard (production) |
| Claude says it has no domain tools available | MCP server not connected, or connected without the header needed for write operations | Re-run `claude mcp add` with the `--header` flag, or check `/mcp` / `claude mcp list` for connection status |

## Frequently Asked Questions

### Do I need to know Namefi's REST API to use this, or can I just talk to Claude in plain language?
Plain language is enough for the whole flow above — "is this domain available," "register it," "point it at this IP" all work as direct requests. The endpoints and request fields in this guide are documented so you can verify what Claude is doing under the hood, or call them directly yourself if you're scripting instead of chatting.

### Does registering through Claude cost more than registering through Namefi's website?
This guide doesn't claim a price comparison one way or the other. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> Either way, registration draws against the same NFSC balance whether the request came from a browser, a script, or an MCP tool call.

### Is my domain automatically tokenized as an NFT when I register it this way?
Yes, by default. If you don't specify an `nftReceivingWallet` in the registration request, the domain registers as an NFT to the wallet tied to your API key, on Base. You can redirect it to a different wallet or chain at registration time.

### What happens if Claude's DNS record request has a typo — can it break my domain silently?
DNS writes go through Namefi's validation before they're applied, and malformed `rdata` (a missing trailing dot on a CNAME target, for instance) is rejected with an error rather than silently accepted — see the troubleshooting table above. Still, treat DNS changes to a live domain the way you'd treat any infrastructure change: review what Claude is about to submit before confirming.

### Can I use this same MCP server with Cursor or Windsurf instead of Claude?
Yes — Namefi's server speaks the same open MCP protocol regardless of which client connects, so the server side doesn't change. The client-side connection commands differ per editor; see the per-client config sections in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/), or the shorter [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/en/blog/mcp-quickstart/).

## Buy your next domain from a conversation

This is the exact setup Namefi supports today, not a hypothetical. Once the MCP server is connected, everything from searching a name to registering it, setting DNS, and (optionally) turning it into a wallet-held token happens without leaving the chat. The MCP server exposes more than registration — outbound lead-finding, batch DNS operations, domain configuration — all discoverable from the same connection once you're set up — see [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/) for the full tool catalog.

**[Generate a Namefi API key and connect Claude](https://namefi.io/api-key).**

## Sources and further reading

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP server URL, transport, authentication, registration and DNS endpoints — primary source for this guide)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx) (API key, EIP-712, and SIWE auth modes; per-operation auth requirements)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (worked registration and polling examples in SDK, fetch, cURL, and Python)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC faucet and balance-check endpoints)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` syntax, header auth, scope flags)
- Model Context Protocol — [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Custom Connectors flow for Claude Desktop and claude.ai)
- Model Context Protocol — [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (protocol overview)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (specification and rationale for the discovery file namefi.io/llms.txt follows)
- dev.to — [How to register a domain name with your AI agent, no human needed](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (third-party MCP tutorial built on a different, Cloudflare-backed registrar reseller)
