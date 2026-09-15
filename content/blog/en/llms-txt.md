---
title: "What Is llms.txt? Format, Examples, and How It Works"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "Learn what llms.txt does, how its format works, and how it differs from robots.txt and MCP, with a real domain API example."
keywords: ["llms txt", "what is llms.txt", "llms.txt example", "llms.txt vs robots.txt", "how to create llms.txt"]
relatedArticles:
  - /en/blog/ai-agent-register/
  - /en/blog/claude-mcp-domains/
  - /en/blog/namefi-mcp/
  - /en/blog/mcp-quickstart/
  - /en/blog/agent-native/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/epp/
  - /en/glossary/dns/
  - /en/glossary/seo/
---

**`llms.txt` is a proposed Markdown format that gives AI agents a concise guide to a website and links to useful source material.** It helps a reader find documentation; it does not execute API calls or grant access. The [current proposal](#ref-llms-format) supports both `/llms.txt` and files within a subpath, such as `/docs/llms.txt`.

This article explains the format, shows how to create a small example, and walks through [Namefi's public API guide](https://namefi.io/llms.txt). The domain example shows how documentation can point an [AI agent](/en/glossary/ai-agent/) toward a [registrar](/en/glossary/registrar/)'s API or [Model Context Protocol](/en/glossary/mcp/) tools.

## Why provide a guide for agents?

A documentation page often mixes its useful instructions with menus, advertising, and scripts. A short index helps an agent choose which page to read next. It still needs accurate linked material and a client capable of retrieving it.

The [August 2026 revision](#ref-llms-v2) clarifies discovery: HTML links or HTTP `Link` headers can identify a page's Markdown alternative and its applicable `llms.txt`. A file covers pages below its path; the most specific applicable file takes precedence. Agents are expected to follow relevant links, rather than expand every linked page into one prompt.

## llms.txt vs robots.txt

`robots.txt` tells cooperating crawlers which URLs they may crawl. `llms.txt` supplies a reading guide. Neither is an access-control mechanism: keep private content behind authentication.

Crawling also differs from indexing. [Google explains](#ref-robots) that a blocked URL can still appear in search results if other pages link to it. A `robots.txt` restriction does not mean “never index this page.” Publishing an `llms.txt` file, meanwhile, is not evidence that a search engine will read it or improve a page's ranking.

## Format and a minimal llms.txt example

The [format](#ref-llms-format) uses an H1 project name, an optional summary and notes, then H2 sections containing links. The H1 is the only required section. Here is an illustrative file, using placeholder URLs:

```markdown
# Example Documentation

> Documentation for the Example project.

## Guides

- [Getting started](https://example.com/docs/start.md): Setup instructions.

## Optional

- [Release notes](https://example.com/docs/releases.md): Older changes.
```

In v2, **Optional is a convention for secondary links**, not a directive that requires software to exclude them. The [change notes](#ref-llms-v2) explicitly remove its earlier mechanical meaning.

To create your own file, replace the placeholders with public documentation you maintain, publish it at the appropriate path, and check that every link opens. Give an agent the file and a real question, then check whether it finds the right source. Update the guide when your documentation changes.

## Walking through namefi.io/llms.txt

The file changes as Namefi's API and authentication options evolve. The table below is an abridged snapshot checked on **2026-07-14**; agents should fetch the [current live file](https://namefi.io/llms.txt) before acting.

| Section (as it appears in the file) | What it says | Why it's shaped that way |
| --- | --- | --- |
| H1 + blockquote | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | An H1 title followed by an optional summary, giving the reader an immediate orientation. |
| MCP pointer, inline in the summary | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | Puts the fastest path — a live protocol connection — ahead of the plain-text one, in the first three lines. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | One line, no prose — an agent constructing raw HTTP calls needs exactly this. |
| `## Agent policy (mandatory)` | Prefer MCP when the client can connect it; use REST or `curl` only when MCP is unavailable, installation fails, or the user explicitly requests raw HTTP | Keeps capable agents on the typed MCP path while preserving an explicit REST fallback. |
| `## MCP Server (for AI agents)` | Connect to `https://api.namefi.io/mcp`; read-only tools need no authentication; use OAuth 2.1 + PKCE when no API key is available, or send an existing key in `x-api-key` | Documents both the browser-authorized OAuth path and the API-key path instead of assuming every agent already has a stored secret. |
| `## Authentication` | API keys work through `x-api-key`; every `/v-next` endpoint also accepts an OAuth bearer token. The file documents device authorization for headless clients, authorization code + PKCE for redirect-capable apps, dynamic client registration, access-token lifetime, and rotating refresh tokens | Authentication is no longer API-key-only, and direct REST callers can use OAuth without MCP. |
| `## Buy a domain (MCP-first happy path)` and REST fallback | Connect MCP, search, register, and poll with typed tools; if MCP is unavailable, use the documented three-step `curl` sequence | Separates the preferred tool path from the raw-HTTP fallback without removing either. |
| `## DNS Record Management` | A table of eleven endpoints (`GET`/`POST`/`PUT`/`DELETE` on `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding`, etc.) with method, path, auth, and one-line description | Reference data — many similar endpoints — goes in a table rather than eleven paragraphs. |
| Troubleshooting note | "**UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet… **Record validation errors:** Check that `zoneName` has no trailing dot, `rdata` for CNAME/MX/NS types has a trailing dot…" | Anticipates the failure modes an agent is most likely to hit first, as cause-and-fix rather than a generic status table. |
| `## Optional` | Links to the TypeScript SDK docs, the `@namefi/api-client` npm package, a machine-readable OpenAPI 3 spec, the outbound-agent guide, and a GitHub repo of signer-neutral helper scripts | Secondary links by convention; v2 no longer assigns the heading mechanical exclusion behavior. |

The file closes by pointing to `namefi.io/llms-full.txt`, the same content inlined into one document, including the Web3 payment flows and outbound guide the root file only links to. That expansion is a Namefi publishing choice. The v2 proposal expects agents to follow relevant links and no longer specifies context-expansion tooling.

## The companion files: web3 and MCP discovery

The root file links out to siblings for parts of the API that don't belong in a general-purpose entry point. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) documents payment paths a wallet-holding agent needs instead of an API key: an [x402](/en/glossary/x402/) flow where `GET /x402/domain/{domainName}` returns `402 Payment Required` with pricing until a signed `X-PAYMENT` header is attached, an MPP (Machine Payable Protocol) challenge-response variant signed via the `mppx` CLI, and a manual EIP-712 signing path covering smart-contract wallets. The file states plainly that x402 registration needs "No Namefi account or EIP-712 signing required — the buyer's wallet signs an EIP-3009 `transferWithAuthorization`." An agent using the ordinary MCP, OAuth, or API-key path does not need to load that wallet-payment guide.

The MCP side has its own discovery file, separate from `llms.txt` entirely: [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), a JSON descriptor rather than Markdown. This abridged snapshot was checked on **2026-07-14**:

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "description": "Preferred interface for Namefi...",
      "version": "next",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "websiteUrl": "https://namefi.io",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key",
        "description": "Read-only tools need no auth; prefer OAuth when no API key is available."
      },
      "oauth": {
        "type": "oauth2",
        "protectedResourceMetadata": "https://api.namefi.io/.well-known/oauth-protected-resource",
        "authorizationServerMetadata": "https://api.namefi.io/.well-known/oauth-authorization-server",
        "grantTypes": ["authorization_code", "refresh_token", "device_code"],
        "codeChallengeMethods": ["S256"],
        "dynamicClientRegistration": true
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

That descriptor lives under `.well-known/`, the same convention `/.well-known/security.txt` uses for machine-discoverable metadata — a narrower, JSON-typed sibling to `llms.txt`'s Markdown-prose approach. It advertises both API-key and OAuth discovery metadata, including PKCE and dynamic client registration, and its `documentation` field points back at `llms.txt`.

## What's included, what's left out, and why

A few choices look deliberate. The mandatory agent policy and MCP setup come before the REST recipes, so a capable client discovers the typed tool interface first. Runnable `curl` examples remain as a fallback for clients that cannot connect MCP or for users who explicitly ask for raw HTTP. The root file links out rather than including everything, while `llms-full.txt` inlines the companion material. The `## Optional` section links a full OpenAPI 3 spec alongside the Markdown, and wallet-based payment — x402, MPP, EIP-712 — stays in its own file.

## llms.txt and MCP: discovery versus connection

It's worth being precise about what each piece does. `llms.txt` is a document — an agent fetches it once and knows what the API is and where the deeper resources live; it's inert text until something acts on what it says. [MCP](https://modelcontextprotocol.io), in the protocol's own description, is "an open-source standard for connecting AI applications to external systems" — a protocol through which a compatible client discovers and invokes callable tools.

Namefi's file demonstrates the relationship directly: `llms.txt` tells an agent an MCP server exists at `api.namefi.io/mcp` and gives it the `claude mcp add` command to connect. Read the file, learn there's a live tool interface, connect, act. An agent that skips straight to MCP can still find the server through `.well-known/mcp/servers.json` — but that descriptor's `documentation` field points back at `llms.txt`, so the two rarely operate in true isolation.

## Guidance for other API vendors

Publishing a working `llms.txt` doesn't require rebuilding your documentation:

1. **Front-load the H1, summary, and fastest connection method** — a small-context agent may never read past the first few lines.
2. **Lead with the fastest supported connection, then show a runnable fallback.** If you offer MCP, document the typed path first; preserve concrete HTTP examples for clients that cannot connect it.
3. **Split by size, not by team structure.** A short root file plus a fuller expansion, and separate files for concerns like payments, keeps the common path short.
4. **Document actual failure modes**, not just status codes — why a call returns 401 versus 403 matters more than the numbers.
5. **Use `## Optional` for secondary links if useful**, without relying on automatic exclusion.
6. **Publish an MCP discovery descriptor alongside llms.txt if you run an MCP server** — include current authentication and OAuth-discovery metadata, not only the server URL.

## Frequently Asked Questions

### What is llms.txt?

A proposed Markdown guide for agents, published at a site root or within a subpath. See the format and example above; v2 also explains how pages can advertise the guide that applies to them.

### How is llms.txt different from robots.txt?

`robots.txt` governs cooperative crawling; `llms.txt` guides reading. A crawl restriction does not necessarily prevent indexing, and neither file replaces authentication.

### Does llms.txt replace MCP?

No. `llms.txt` is a document an agent reads once to understand what an API does; MCP is a protocol a compatible client uses to discover and call tools. Namefi publishes both, and `llms.txt` is what tells an agent the MCP server exists in the first place.

### What's in Namefi's llms.txt file?

The base URL, a mandatory MCP-first agent policy, MCP installation examples, API-key and OAuth authentication, a typed domain-registration path plus REST fallback, DNS and domain-configuration endpoints, troubleshooting, and an "Optional" section linking the SDK, OpenAPI spec, and companion files.

### Can I read llms.txt myself, without an AI agent?

Yes — it's plain Markdown, legible to a person as well as a model. [namefi.io/llms.txt](https://namefi.io/llms.txt) reads like a terse API quick-reference; the same clarity that helps a human skim also helps a model parse it correctly.

## Sources and further reading

- <span id="ref-llms-format"></span>Jeremy Howard — [The /llms.txt file, v2](https://llmstxt.org/#format), “Proposal” and “Format” — fetched 2026-09-15.
- <span id="ref-llms-v2"></span>Jeremy Howard — [v2 changes](https://llmstxt.org/changes.html#v2-august-2026), discovery, path scope, and Optional semantics — fetched 2026-09-15.
- <span id="ref-robots"></span>Google Search Central — [Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro#understand-the-limitations-of-a-robotstxt-file), crawling versus indexing and access control — fetched 2026-09-15.
- robotstxt.org — [About /robots.txt: "In a nutshell"](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [What is the Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (primary source for every annotated excerpt in this article)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, and EIP-712 wallet-payment flows)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (single-file expansion inlining the Web3 and outbound companion files)
- IETF — [RFC 8615, Well-Known Uniform Resource Identifiers (the `.well-known/` convention)](https://datatracker.ietf.org/doc/html/rfc8615)

## Read the file yourself

The fastest way to understand `llms.txt` is to open one. [namefi.io/llms.txt](https://namefi.io/llms.txt) is public, unauthenticated, and short enough to read in the time it took to read this article — a concrete example to compare with the format above. For what the MCP tools behind it actually do, see [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/); to connect from an editor, the [MCP Quickstart](/en/blog/mcp-quickstart/); to watch an agent run the whole flow, [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/).
