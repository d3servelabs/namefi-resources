---
title: "llms.txt for Domains: An API Any AI Agent Can Read"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "A walkthrough of namefi.io/llms.txt: how a plain-text file lets any AI agent discover and use a registrar's full API, and how it pairs with MCP."
keywords: ["llms.txt", "llms.txt example", "what is llms.txt", "AI-readable API docs", "API discoverability", "robots.txt for AI", "llms.txt vs MCP", "namefi.io/llms.txt", "machine-readable API reference", "agent-native API", "structured docs for LLMs", "plain-text API discovery", "MCP discovery descriptor", "AI agent domain registration"]
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

Every [registrar](/en/glossary/registrar/) with an [API](/en/glossary/epp/) has documentation somewhere: a docs site, a reference page, maybe an OpenAPI spec behind a login wall. That's been enough for two decades, because the reader was a human developer who could click around and skim past the navigation chrome to find the one paragraph that mattered. An [AI agent](/en/glossary/ai-agent/) reading the same site at inference time doesn't get that luxury — fixed context budget, no patience for a JavaScript-rendered docs portal, one shot to figure out what an API does before it gives up or hallucinates an endpoint that doesn't exist.

`llms.txt` is the fix for that problem, and Namefi publishes one at [namefi.io/llms.txt](https://namefi.io/llms.txt). This post covers what the convention is, why it exists, what our own file contains section by section, where it deliberately stops, and how it fits alongside the [Model Context Protocol](https://modelcontextprotocol.io) (MCP) rather than competing with it. It's also, by design, an example of the thing it describes: a public API vendor explaining its own machine-readable discovery file in plain prose.

## Why agents can't just crawl your docs site

The rationale for `llms.txt` isn't speculative — it's stated directly in the proposal. [Jeremy Howard's original write-up](https://llmstxt.org) opens with the constraint that motivated it: "Large language models increasingly rely on website information, but face a critical limitation: context windows are too small to handle most websites in their entirety. Converting complex HTML pages with navigation, ads, and JavaScript into LLM-friendly plain text is both difficult and imprecise."

That's two problems stacked together. A real docs site — nav, changelog, marketing copy, cookie banner — is mostly noise relative to the handful of paragraphs an agent needs for one task. And a lot of that noise lives behind JavaScript a headless fetch never executes, so what an agent's HTTP client sees isn't even the page a human sees. `llms.txt` sidesteps both: a single plain-text Markdown file, meant to be read whole rather than crawled and reduced.

## The `robots.txt` analogy, and where it breaks down

The comparison to [`robots.txt`](https://www.robotstxt.org) is the fastest way to place `llms.txt` for anyone who knows web infrastructure, and it's fair as far as it goes. `robots.txt` exists to give instructions to web crawlers — in the site's own words, "Web site owners use the /robots.txt file to give instructions about their site to web robots; this is called *The Robots Exclusion Protocol*." Both files sit at a predictable root path, both are plain text, both address automated readers rather than humans.

Where the analogy breaks is intent. `robots.txt` is almost entirely a **negative** instruction — `Disallow: /some-path` tells a crawler what *not* to touch. `llms.txt` is **positive**: here's what this site is, here's where the parts worth reading live. Less a fence, more a table of contents for a reader who can't skim the whole book. The two are complementary, and Namefi's site runs both.

## What the spec actually asks for

`llms.txt` isn't free-form; the proposal defines a specific Markdown structure, in order: an optional byte-order mark, a required H1 with the site name, a blockquote summary, zero or more unheaded detail sections, and zero or more H2-delimited "file list" sections of `[name](url): notes` links. One H2 heading carries special meaning: a section named **Optional** signals "the URLs here can be skipped if you need a shorter context." Namefi's file uses that exact heading, doing exactly what the spec describes.

## Walking through namefi.io/llms.txt

Here's the live file, annotated section by section — what's actually in it, quoted directly, and why each piece is shaped the way it is for an agent reading it cold.

| Section (as it appears in the file) | What it says | Why it's shaped that way |
| --- | --- | --- |
| H1 + blockquote | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | The required opening the spec calls for — one line an agent can act on even if it reads nothing else. |
| MCP pointer, inline in the summary | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | Puts the fastest path — a live protocol connection — ahead of the plain-text one, in the first three lines. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | One line, no prose — an agent constructing raw HTTP calls needs exactly this. |
| `## MCP Server (for AI agents)` | "Prefer MCP if your client supports it… Add in Claude Code: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`" | States a preference and backs it with one copy-pasteable command instead of a paragraph. |
| `## Authentication` | "Generate a key at https://namefi.io/api-key… Works for **all operations**… **Direct HTTP usage (recommended for AI agents):** Pass the header directly — no SDK required" | Tells the reader plainly that no SDK, OAuth dance, or browser session is required to authenticate a write call. |
| `## Domain Registration` | A three-step `curl` sequence: check availability, submit `POST /v-next/orders/register-domain`, poll `GET /v-next/orders/{orderId}` to a terminal status | The core transaction as runnable commands, not a prose description of a request/response shape. |
| `## DNS Record Management` | A table of eleven endpoints (`GET`/`POST`/`PUT`/`DELETE` on `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding`, etc.) with method, path, auth, and one-line description | Reference data — many similar endpoints — goes in a table rather than eleven paragraphs. |
| Troubleshooting note | "**UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet… **Record validation errors:** Check that `zoneName` has no trailing dot, `rdata` for CNAME/MX/NS types has a trailing dot…" | Anticipates the failure modes an agent is most likely to hit first, as cause-and-fix rather than a generic status table. |
| `## Optional` | Links to the TypeScript SDK docs, the `@namefi/api-client` npm package, a machine-readable OpenAPI 3 spec, the outbound-agent guide, and a GitHub repo of signer-neutral helper scripts | The spec's own "skip this if you need a shorter context" section — deeper resources, not prerequisites for the core flow above. |

The file closes by pointing to `namefi.io/llms-full.txt`, the same content inlined into one document, including the Web3 payment flows and outbound guide the root file only links to. That split mirrors the spec's own two-tier pattern: keep the entry point short enough to fit comfortably in context, and let an agent that needs more follow one link.

## The companion files: web3 and MCP discovery

The root file links out to siblings for parts of the API that don't belong in a general-purpose entry point. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) documents payment paths a wallet-holding agent needs instead of an API key: an [x402](/en/glossary/x402/) flow where `GET /x402/domain/{domainName}` returns `402 Payment Required` with pricing until a signed `X-PAYMENT` header is attached, an MPP (Machine Payable Protocol) challenge-response variant signed via the `mppx` CLI, and a manual EIP-712 signing path covering smart-contract wallets. The file states plainly that x402 registration needs "No Namefi account or EIP-712 signing required — the buyer's wallet signs an EIP-3009 `transferWithAuthorization`." An agent that only needs an API key never has to load any of it.

The MCP side has its own discovery file, separate from `llms.txt` entirely: [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), a small JSON descriptor rather than Markdown:

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

That descriptor lives under `.well-known/`, the same convention `/.well-known/security.txt` uses for machine-discoverable metadata — a narrower, JSON-typed sibling to `llms.txt`'s Markdown-prose approach. Its last field points back at `llms.txt`, so an agent that finds the MCP server first still has a path to the plain-text explanation of what those tools do.

## What's included, what's left out, and why

A few choices look deliberate. Nearly every operation is a runnable `curl` invocation rather than a paragraph describing a request schema — a file written for something that executes code, not something that writes its own summary. The root file links out rather than including everything, and `llms-full.txt` inlines what it only references — the spec's own size-management pattern, applied literally. The `## Optional` section links a full OpenAPI 3 spec alongside the Markdown, so a tool wanting a strictly typed schema has one without cluttering the primary read path. And wallet-based payment — x402, MPP, EIP-712 — lives in its own file, keeping API-key auth and a registration as the first thing any agent reads.

<!-- TODO: confirm with team — whether there's a target token/character budget the root llms.txt is written against, and how the split between llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt is revisited as the API grows -->

## llms.txt and MCP: discovery versus connection

It's worth being precise about what each piece does. `llms.txt` is a document — an agent fetches it once and knows what the API is and where the deeper resources live; it's inert text until something acts on what it says. [MCP](https://modelcontextprotocol.io), in the protocol's own description, is "an open-source standard for connecting AI applications to external systems" — a live session a client opens to a server, over which it lists and invokes callable tools.

Namefi's file demonstrates the relationship directly: `llms.txt` tells an agent an MCP server exists at `api.namefi.io/mcp` and gives it the `claude mcp add` command to connect. Read the file, learn there's a live tool interface, connect, act. An agent that skips straight to MCP can still find the server through `.well-known/mcp/servers.json` — but that descriptor's `documentation` field points back at `llms.txt`, so the two rarely operate in true isolation.

## Guidance for other API vendors

Publishing a working `llms.txt` doesn't require rebuilding your documentation:

1. **Front-load the H1, summary, and fastest connection method** — a small-context agent may never read past the first few lines.
2. **Show runnable requests, not schema prose.** A `curl` command with real field names beats a paragraph describing a JSON body.
3. **Split by size, not by team structure.** A short root file plus a fuller expansion, and separate files for concerns like payments, keeps the common path short.
4. **Document actual failure modes**, not just status codes — why a call returns 401 versus 403 matters more than the numbers.
5. **Use the `## Optional` heading for anything skippable**, per the spec's own convention.
6. **Publish an MCP discovery descriptor alongside llms.txt if you run an MCP server** — one answers "what is this," the other "how do I connect."

## Frequently Asked Questions

### What is llms.txt?

A proposed convention — not a formal IETF or W3C standard — for publishing a plain-text Markdown file at a website's root that tells an AI agent what the site or API is and where to find more detail. It defines a specific order: an H1 title, a blockquote summary, optional detail paragraphs, and H2-delimited link lists, with an "Optional" heading reserved for skippable material.

### How is llms.txt different from robots.txt?

`robots.txt` is a negative instruction to web crawlers — what not to index, under the Robots Exclusion Protocol. `llms.txt` is positive — what a site is and what's worth reading. They serve different automated readers and typically coexist on the same site.

### Does llms.txt replace MCP?

No. `llms.txt` is a document an agent reads once to understand what an API does; MCP is a live protocol connection its client opens to actually call that API's operations. Namefi publishes both, and `llms.txt` is what tells an agent the MCP server exists in the first place.

### What's in Namefi's llms.txt file?

The base URL, an MCP server pointer, an API-key authentication section, a three-step domain-registration flow with runnable `curl` examples, a DNS record management endpoint table, domain-configuration endpoints, a troubleshooting section, and an "Optional" section linking the SDK, the OpenAPI spec, and companion files for wallet payments and outbound workflows.

### Can I read llms.txt myself, without an AI agent?

Yes — it's plain Markdown, legible to a person as well as a model. [namefi.io/llms.txt](https://namefi.io/llms.txt) reads like a terse API quick-reference; the same clarity that helps a human skim also helps a model parse it correctly.

## Sources and further reading

- llmstxt.org — [The /llms.txt file: background, proposal, and format spec](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [About /robots.txt: "In a nutshell"](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [What is the Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (primary source for every annotated excerpt in this article)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, and EIP-712 wallet-payment flows)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (single-file expansion inlining the Web3 and outbound companion files)
- IETF — [RFC 8615, Well-Known Uniform Resource Identifiers (the `.well-known/` convention)](https://datatracker.ietf.org/doc/html/rfc8615)

## Read the file yourself

The fastest way to understand `llms.txt` is to open one. [namefi.io/llms.txt](https://namefi.io/llms.txt) is public, unauthenticated, and short enough to read in the time it took to read this article — the same file every AI agent connecting to Namefi reads first. For what the MCP tools behind it actually do, see [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/); to connect from an editor, the [MCP Quickstart](/en/blog/mcp-quickstart/); to watch an agent run the whole flow, [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/).
