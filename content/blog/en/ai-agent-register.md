---
title: "How to Register a Domain with Your AI Agent on Namefi"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "The canonical guide to registering a domain on Namefi with any AI agent — Claude, Codex, Cursor, and more — via MCP, REST, or wallet checkout."
keywords: ["register domain ai agent", "namefi tutorial", "claude domain registration", "codex domain registration", "cursor mcp domain", "windsurf mcp domain", "gemini cli mcp domain", "agent domain how-to", "x-api-key", "mcp server", "wallet checkout", "namefi mcp domain registration", "ai agent buy domain namefi", "domain registration mcp tutorial"]
relatedArticles:
  - /en/blog/claude-mcp-domains/
  - /en/blog/cf-namecom-namefi/
  - /en/blog/ai-domain-platforms/
  - /en/blog/agent-native/
  - /en/blog/airo-vs-namefi/
  # TODO(link-when-published): /en/blog/namefi-mcp/ /en/blog/mcp-quickstart/ /en/blog/wallet-checkout/ /en/blog/llms-txt/ /en/blog/nl-domain-purchase/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/blockchain-concepts/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/wallet/
  - /en/glossary/x402/
  - /en/glossary/tokenized-domain/
---

This is the one page to bookmark if you want an [AI agent](/en/glossary/ai-agent/) — any AI agent, not one specific vendor's — to register a real domain for you on [Namefi](https://namefi.io), an [ICANN](/en/glossary/icann/)-accredited [registrar](/en/glossary/registrar/). It covers the mechanics that don't change no matter which client you're typing into, then gives you exact, individually verified setup steps for the six agents people actually use today: Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf, and Gemini CLI. If your agent isn't on that list, the guide closes with a raw REST path that works with anything that can make an HTTP request, because Namefi's entire API surface is also published as plain text for exactly that purpose.

This guide is written and maintained by the Namefi team, so the Namefi side of every step is first-party: it walks through, in human-readable form, the same API we publish for agents at [namefi.io/llms.txt](https://namefi.io/llms.txt) and [docs.namefi.io](https://docs.namefi.io). Each agent vendor's setup was verified against that vendor's own current documentation on this guide's publish date; where a vendor's docs don't give a clean answer, that's flagged explicitly rather than filled in with a guess.

If you already know you're using Claude and want the full annotated walkthrough with a real transcript, [Buy a Domain with Claude: Namefi MCP Step-by-Step Guide](/en/blog/claude-mcp-domains/) goes deeper than the condensed Claude sections here. This page is the hub; that one, and the other links scattered through it, are the spokes.

## What "registering a domain with an AI agent" actually means

Two things have to be true for an agent to register a domain on your behalf without you filling out a form yourself. First, the agent needs a way to *discover and call* Namefi's API — that's the [Model Context Protocol](https://modelcontextprotocol.io) (MCP), an open standard that lets an AI client connect to an external tool server and see a defined list of callable operations, or a plain HTTP request if the agent is scripted rather than conversational. Second, the agent needs *authorization to spend* — an API key tied to a funded balance, or a crypto [wallet](/en/glossary/wallet/) that can sign a payment on the spot. Everything in this guide is one of those two pieces.

Namefi runs a single MCP server for its whole API, at `https://api.namefi.io/mcp`, over the Streamable HTTP transport. An agent — or the person configuring one — can discover it without ever reading this page: we publish a machine-readable descriptor at [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) that names the server `namefi-api` and lists its transport as `streamable-http`. Every client below connects to that same URL; what differs is only how each client's configuration file or command line asks you to point at it.

## The universal five-step flow

This is the sequence underneath every agent-specific section further down. Once you understand it here, the per-agent instructions are just "how do I do step 2 in this particular tool."

1. **Get credentials.** Generate an [API key](https://namefi.io/api-key) — a `nfk_`-prefixed string that works for every operation: registration, DNS record creation, updates, and deletes. The key inherits the permissions of the wallet that generated it, so generate it from the wallet that should own the domain. If you'd rather not hold a Namefi API key at all, skip to the wallet-payment path below — it needs no account.
2. **Connect your agent to the MCP server.** Point your client at `https://api.namefi.io/mcp` with the `x-api-key` header carrying your key. The exact syntax is client-specific — see your agent's section below.
3. **Search and price.** Ask in plain language whether a name is available. This calls the `checkAvailability` operation (`GET /v-next/search/availability?domain=…`), which needs no authentication at all, or its bulk variant for screening several candidates at once.
4. **Register, then poll.** Confirm and the agent submits `registerDomain` (`POST /v-next/orders/register-domain`), or the combined `register-domain/records` variant if you want DNS set in the same call. Registration is asynchronous — the request body takes a `normalizedDomainName` and a `durationInYears`, and the `register-domain/records` endpoint additionally accepts a `records` array (`name`, `type`, `rdata`, `ttl` per record) so DNS gets written the moment the order finishes. The agent (or you) polls `getOrder` (`GET /v-next/orders/{orderId}`) until it reaches a terminal status: `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED`.
5. **Configure DNS and verify.** Add or adjust [DNS records](/en/glossary/dns-record-types/) through `createDnsRecord` (`POST /v-next/dns/records`), point the [nameserver](/en/glossary/nameserver/)-level delegation if needed, and give [DNS propagation](/en/glossary/dns-propagation/) a few minutes before confirming the domain resolves.

The registration request also accepts a `domainSetupOptions` object with per-domain overrides — `autoPark`, `autoEns`, `autoRenew`, `dnssec`, and `keepExistingNameservers` (the last one tells Namefi to leave the domain's existing nameserver delegation untouched instead of repointing it, useful if you're registering a domain that's meant to keep resolving somewhere else immediately). An optional `nftReceivingWallet` field controls where the domain's ownership token lands — leave it out and the domain registers as an NFT on Base to the wallet tied to your API key.

## Per-agent setup matrix

| Agent | Connection method | Where the config lives | Custom auth header supported | Verified against |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, Streamable HTTP | `claude mcp add` CLI command (writes to `~/.claude.json` or `.mcp.json`) | Yes — `--header` flag | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), verified 2026-07-10 |
| Claude Desktop / claude.ai | MCP, Streamable HTTP via Custom Connector | Settings → Connectors → Add custom connector | Server-driven auth prompt (OAuth, API key, or credentials, per what the server asks for) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), verified 2026-07-10 |
| OpenAI Codex CLI | MCP, Streamable HTTP | `~/.codex/config.toml`, `[mcp_servers.<name>]` table | Yes — `http_headers` (static) or `env_http_headers` (from environment variables) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (the current redirect target of `developers.openai.com/codex/mcp`), verified 2026-07-10 |
| Cursor | MCP, Streamable HTTP | `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global) | Yes — `headers` object, with `${env:VAR}` interpolation | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), verified 2026-07-10 |
| Windsurf (Cascade) | MCP, Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | Yes — `headers` object on a `serverUrl` entry, with `${env:VAR}` interpolation | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (as of this guide's publish date, that URL redirects to `docs.devin.ai/desktop/cascade/mcp` — see the Windsurf section below), verified 2026-07-10 |
| Gemini CLI | MCP, Streamable HTTP | `~/.gemini/settings.json` (user) or `.gemini/settings.json` (project) | Yes — `headers` object on an `httpUrl` entry | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), verified 2026-07-10 |
| Any other MCP client | MCP, Streamable HTTP | Whatever config format that client documents | Depends on the client — Namefi's server side doesn't change | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| Any script or non-MCP agent | Raw REST | N/A — direct HTTPS calls | Yes — `x-api-key` header on every write call | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

Every row above connects to the identical server and identical set of operations. The only thing that changes per agent is the syntax for telling that particular client "here's a remote MCP server, and here's the header to send with it."

**The same test prompt, every time.** After connecting each agent below, run this exact prompt so you can compare results client to client:

> "Check whether `example.com` is available to register on Namefi, and tell me which tool or operation you called to find that out. Don't register anything yet."

This is a read-only call — `checkAvailability` needs no authentication — so it's safe to run against a freshly connected agent even before you've funded anything, and it immediately tells you whether the connection and the tool list are working.

## Claude Desktop and claude.ai

Claude Desktop and claude.ai connect to remote MCP servers through **Custom Connectors**. Open Settings, go to Connectors, choose "Add custom connector," and enter `https://api.namefi.io/mcp` as the server URL. After you click Add, Claude prompts you to complete authentication — Anthropic's documentation describes this step as commonly involving "OAuth, API keys, or username/password combinations," with the exact prompt determined by what the connected server requires.

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> If your Desktop setup doesn't surface an obvious place to paste the key, Claude Code (next) is the verified path for write operations today, and read-only tools like availability search work over the connector with no key at all. The full walkthrough, including what the connector flow looks like once connected, is in [Buy a Domain with Claude: Namefi MCP Step-by-Step Guide](/en/blog/claude-mcp-domains/).

## Claude Code

Claude Code's own documentation gives an exact, general syntax for adding a remote HTTP MCP server with a custom header:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Run that once from a terminal with your real key swapped in. By default this writes the server at **local** scope — available only to you, in your current project (older Claude Code versions called this scope "project"). Add `--scope user` if you want the connection available across every project on your machine, or `--scope project` to share it with everyone on the project via a committed `.mcp.json` file. Confirm the connection with `claude mcp list`, and check the live tool count inside a session with `/mcp`.

## OpenAI Codex CLI

Codex CLI stores MCP configuration in a TOML file, by default `~/.codex/config.toml` (or a project-scoped `.codex/config.toml` for trusted projects). Each server gets its own table, and the transport is inferred from which keys are present: a `command` key means a local stdio server, a `url` key means Streamable HTTP. Codex's docs are specific that the table name must be `mcp_servers` with an underscore — `mcp-servers` or similar variants are silently ignored.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

That form pulls the key from an environment variable named `NAMEFI_API_KEY` rather than writing it into the file — set it in your shell before running Codex. If you'd rather hardcode it (not recommended for a file you might commit), the equivalent static form is `http_headers = { "x-api-key" = "YOUR_KEY" }`. Codex also documents a `bearer_token_env_var` field specifically for `Authorization: Bearer …`-style auth, but Namefi's `x-api-key` header needs the general-purpose `http_headers` / `env_http_headers` fields instead, not the bearer-specific one.

## Cursor

Cursor reads MCP server definitions from `mcp.json` — a project-scoped copy at `.cursor/mcp.json` in your repo root, or a global copy at `~/.cursor/mcp.json` that applies everywhere. Cursor's docs give the remote-server shape directly, including header-based auth and environment-variable interpolation so the key itself doesn't have to live in the file:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` resolves to whatever that environment variable holds at connection time.<!-- link-when-published: /en/blog/mcp-quickstart/ -->

## Windsurf (Cascade)

Windsurf's MCP integration — branded **Cascade** inside the product — reads its server list from `~/.codeium/windsurf/mcp_config.json`. Remote HTTP servers use a `serverUrl` field (not `command`), alongside the same kind of `headers` object and `${env:VAR}` interpolation as Cursor:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

One thing worth flagging plainly: as of this guide's publish date, `docs.windsurf.com/windsurf/cascade/mcp` redirects to `docs.devin.ai/desktop/cascade/mcp`. Windsurf's documentation now lives under Cognition's Devin product-docs domain, and the page itself refers to both "Windsurf" and "Cascade" alongside "Devin Desktop." The configuration format above is what that current page documents; if you're on an older Windsurf build, the field names should match, but verify against whichever docs URL your version's in-app help links to.

## Gemini CLI

Gemini CLI reads MCP servers from `settings.json` — a user-level copy at `~/.gemini/settings.json`, or a project-level copy at `.gemini/settings.json` that only applies inside that project. The remote-server shape uses `httpUrl` rather than `url`:

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Gemini CLI's docs also document a `timeout` field (in milliseconds, default 600,000) if a specific tool call needs longer than usual — registration polling shouldn't need it, since the client only waits on each individual call, not on the whole poll loop.

## Any other MCP-capable agent

If your agent supports MCP but isn't one of the six above, the server side is identical no matter which client connects: point it at `https://api.namefi.io/mcp` over Streamable HTTP, with `x-api-key: YOUR_KEY` as a custom header. Check your client's own documentation for its specific config file or command syntax — the discovery descriptor at [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) exists precisely so an agent (or a person configuring one) can find the server's URL, transport, and auth requirements without a human pasting them in by hand.

One pattern worth knowing about if your client only supports **local (stdio) MCP servers** and not remote HTTP or SSE directly: the community `mcp-remote` package bridges a remote Streamable HTTP server into a local process your client can launch normally, forwarding whatever headers you configure. It's not something this guide can verify against Namefi's own docs since it's a third-party bridge, not a Namefi-published path — treat it as a fallback if your specific client genuinely has no native remote-HTTP support, not as the default choice. <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## No MCP at all: the raw REST path

Every operation described above is also a plain HTTPS endpoint, documented endpoint-by-endpoint at [namefi.io/llms.txt](https://namefi.io/llms.txt) and in full at [docs.namefi.io](https://docs.namefi.io). An agent framework that can make HTTP calls but doesn't speak MCP — a custom script, a different agent runtime, a CI job — can drive the same flow directly:

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt is a plain-text convention — a machine-readable index a site publishes at its root specifically so an AI agent can discover what an API does without crawling rendered documentation pages. Namefi's file is short enough to read directly at [namefi.io/llms.txt](https://namefi.io/llms.txt) if you want the full version instead of the compressed summary above.<!-- link-when-published: /en/blog/llms-txt/ -->

## Paying: API key vs wallet checkout

Everything in the sections above assumes an API key billed against a funded NFSC (Namefi Service Credit) balance — check it anytime at `GET /v-next/balance` (`x-api-key` required), top it up via a faucet endpoint in development environments, or through the Namefi dashboard in production. <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi also supports registering a domain with a crypto wallet and **no Namefi account at all**, through the [x402](/en/glossary/x402/) protocol: an agent's wallet signs an EIP-3009 authorization, the API responds with an HTTP 402 listing the price if none was attached yet, and the registration settles once a valid signed payment arrives — typically in a [stablecoin](/en/glossary/stablecoin/) like USDC. There's also a related MPP (Machine Payable Protocol) challenge-response variant, and a manual EIP-712 signing path for wallets that aren't using either shortcut. This wallet-first path matters for exactly the agents this guide is about: it removes the account-creation step entirely, so an autonomous process never has to hold — or leak — an API key at all.<!-- link-when-published: /en/blog/wallet-checkout/ -->

## Guardrails before you give an agent purchase power

An agent that can register a domain can also spend money and rewrite DNS on a live property, so a few decisions are worth making deliberately rather than by default:

- **Scope the API key to the minimum wallet.** A key inherits the permissions of the wallet that generated it — generate it from the wallet meant to own new registrations, not a wallet holding assets you don't want an agent's key exposed to.
- **Cap what the agent can spend.** An NFSC balance is itself a spend cap: fund it with only as much as you're comfortable an agent using unattended, rather than a large standing balance.
- **Decide where a human stays in the loop.** Read-only operations like availability search need no authentication and carry no risk; the moment a call submits `registerDomain`, toggles auto-renew, or writes a DNS record on a domain already serving traffic, that's the point to require an explicit confirmation rather than letting the agent proceed autonomously.
- **Review DNS writes before confirming them,** the same way you'd review any infrastructure change. Namefi's validation rejects malformed records rather than silently accepting them (see the troubleshooting table below), but validation catches formatting errors, not a value that's syntactically fine and wrong.

[What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/) lays out a fuller checklist — discoverability, machine-readable errors, and payment paths that don't assume a human is holding a credit card — for evaluating any registrar's agent-facing surface, Namefi's included.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401 UNAUTHORIZED` on any write call | API key invalid, expired, or generated from a wallet that doesn't own the target domain | Generate a fresh key at [namefi.io/api-key](https://namefi.io/api-key) from the wallet that owns (or will own) the domain |
| `403 FORBIDDEN` | Key is valid, but its wallet doesn't own this specific domain | Check ownership before retrying |
| Codex ignores your `[mcp_servers.namefi]` entry | Table name typo — Codex requires the underscore form `mcp_servers`, not `mcp-servers` | Fix the table header in `config.toml` |
| Cursor or Windsurf shows the server as disconnected | `headers` object malformed, or `${env:VAR}` referencing an unset variable | Check the JSON is valid and the referenced environment variable is actually exported in the shell that launched the editor |
| Gemini CLI can't find the config | Edited the wrong `settings.json` — user-level and project-level files are separate | Confirm whether you meant `~/.gemini/settings.json` or `.gemini/settings.json` in the current project |
| Registration order stuck in a non-terminal status | Normal — registration is asynchronous | Keep polling `getOrder`; only treat it as stuck if it never reaches `SUCCEEDED`, `FAILED`, `CANCELLED`, or `PARTIALLY_COMPLETED` |
| DNS record create/update rejected with a validation error | `zoneName` has a trailing dot, or a CNAME/MX/NS `rdata` value is missing its required trailing dot | `zoneName` = no trailing dot; FQDN-type `rdata` values = trailing dot required |
| Registration fails outright | Insufficient NFSC balance on the paying wallet | Check `GET /v-next/balance`, top up via the faucet (dev) or dashboard (production) |
| Agent says it has no domain tools available | MCP server not connected, or connected without the header needed for write operations | Re-check your client's config file or re-run its "add server" command with the header included |

## Frequently Asked Questions

### Do I need to pick one agent and stick with it?
No. The MCP server and every REST endpoint are identical regardless of which client connects — you can run the setup for Claude Code today and Cursor tomorrow against the same API key and the same NFSC balance, with no migration step.

### Which of these agents is "best" for registering a domain?
There isn't a meaningful capability difference for this task, because every client is calling the same server-side operations. The differences are entirely in each client's own MCP config syntax, which is exactly why this guide gives each one its own section and the same test prompt — run it once per client and compare the transcripts yourself.

### What if my agent doesn't support MCP at all?
Use the raw REST path above. Every operation an MCP tool call reaches is also a documented HTTPS endpoint, and `namefi.io/llms.txt` is specifically designed as a plain-text entry point an agent (or the person configuring it) can read without a browser.

### Is my domain automatically tokenized when I register this way?
Yes, by default. If you don't specify an `nftReceivingWallet` in the registration request, the domain registers as an NFT to the wallet tied to your API key, on Base. You can redirect it to a different wallet at registration time.

### Can an agent register a domain without me holding an API key at all?
Yes — the wallet-signed x402 checkout path needs no Namefi account or API key, only a funded wallet. The payment section above covers the essentials of that flow.<!-- link-when-published: /en/blog/wallet-checkout/ -->

### Does registering through an agent cost more than registering through Namefi's website?
This guide doesn't claim a price comparison either way. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> Either way, every path draws against the same NFSC balance whether the request came from a browser, a script, or an agent's tool call.

## Start with whichever agent you already have open

You don't need six clients installed to use this guide — you need exactly one, plus a Namefi API key or a funded wallet. Pick the section above that matches whatever you're already talking to, run the setup, and try the test prompt. From there, the rest of this page's flow — search, register, configure DNS — happens in the same conversation.

**[Generate a Namefi API key](https://namefi.io/api-key)** or go deeper with the [Claude walkthrough with a full transcript](/en/blog/claude-mcp-domains/) and the [head-to-head comparison of the agent-native registrars](/en/blog/cf-namecom-namefi/).<!-- link-when-published: /en/blog/namefi-mcp/ /en/blog/mcp-quickstart/ /en/blog/wallet-checkout/ /en/blog/llms-txt/ -->

## Sources and further reading

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP server URL, transport, authentication, registration/DNS endpoint reference, `domainSetupOptions` fields — primary source for every Namefi-specific claim in this guide)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, and EIP-712 wallet-payment flows)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor: server name, URL, transport, auth type)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx) (API key, EIP-712, and SIWE auth modes; per-operation auth requirements)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (registration request fields, polling flow, order status values)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC balance and faucet endpoints)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` syntax, `--header`, `--scope` flags)
- Model Context Protocol — [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Claude Desktop / claude.ai Custom Connectors flow)
- OpenAI — [learn.chatgpt.com: Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (`config.toml` `[mcp_servers.<name>]` table, `url`, `http_headers`, `env_http_headers`, `bearer_token_env_var` fields)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` remote-server format, `headers`, `${env:VAR}` interpolation, project vs global config locations)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirects to [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) as of this guide's publish date; `mcp_config.json` format, `serverUrl`, `headers`)
- Google — [geminicli.com: MCP servers with the Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) (`settings.json` format, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (specification and rationale for the discovery convention `namefi.io/llms.txt` follows)
