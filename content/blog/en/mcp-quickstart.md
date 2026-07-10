---
title: "Namefi MCP Quickstart: Claude Code, Cursor & Windsurf"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Per-editor MCP setup for Claude Code, Cursor, and Windsurf, then a 5-step quickstart from a new app to a live custom domain, without leaving the editor."
keywords: ["claude code mcp domain", "cursor mcp domain", "windsurf mcp domain", "in-editor domain registration", "coding agent domain registration", "register domain from editor", "mcp quickstart", "namefi mcp config", "vercel custom domain namefi", "cloudflare pages custom domain namefi", "deploy custom domain ai agent", "domain registration quickstart", "x-api-key mcp config", "point domain at deployment"]
relatedArticles:
  - /en/blog/ai-agent-register/
  - /en/blog/claude-mcp-domains/
  - /en/blog/namefi-mcp/
  - /en/blog/wallet-checkout/
  - /en/blog/vibe-coding-domain/
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
  - /en/glossary/nameserver/
  - /en/glossary/domain-renewal/
---

You're already in the editor. The app is scaffolded, the first deploy just went out to a platform subdomain, and the only thing left before you can point people at it is a real domain. This is the quickstart for doing that registration step without opening a browser tab, filling out a checkout form, or leaving the same [coding agent](/en/glossary/ai-agent/) session that built the app: exact [MCP](https://modelcontextprotocol.io) connection config for Claude Code, Cursor, and Windsurf, a condensed five-step flow, and — the part most domain guides skip — how to take the domain you just registered and actually point it at the deployment you just shipped.

This guide covers three editors on purpose. If you're on OpenAI Codex, Gemini CLI, or Claude Desktop instead, [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) is the canonical hub with a verified setup for all six clients plus the raw REST path for anything that isn't MCP-native. Everything here connects to the same [Namefi](https://namefi.io) MCP server that hub documents, so nothing below contradicts it — this page is just the condensed, developer-tool-first cut through it, with a deployment step the hub doesn't cover.

## Why register the domain inside the editor

"Go register a domain" is a context switch with an unusually high cost for a five-minute task: leave the editor, open a registrar's site, run a name search, sit through an upsell funnel for privacy protection and email hosting you didn't ask for, pay, then come back and figure out what DNS records to add.

The alternative is to let the same agent that scaffolded the project and wired up the deploy handle the last mile too: check the name, register it, and wire the DNS, all as tool calls inside the conversation you're already having. [Cloudflare markets a version of this same idea for its own Registrar API](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context) — proof this isn't a niche preference but a workflow more than one registrar is building toward. The comparison section near the end covers the Cloudflare angle specifically; Namefi's version adds a [tokenized-domain](/en/glossary/tokenized-domain/) option and a wallet-signed payment path with no account at all, covered in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/).

## Set up the connection: three editors, three config files

All three editors below connect to the same endpoint, `https://api.namefi.io/mcp`, over Streamable HTTP, with your Namefi [API key](https://namefi.io/api-key) sent as an `x-api-key` header. What changes per editor is only the file format and the command that writes it.

### Claude Code

Claude Code's own documentation gives a direct CLI command for adding a remote HTTP server with a custom header:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Run it once from a terminal in your project, with your real key swapped in. By default it writes the server at **local** scope — available to you, in this project only. Add `--scope user` to make it available across every project on your machine instead, and confirm it connected with `claude mcp list`.

### Cursor

Cursor reads MCP servers from `mcp.json` — a project copy at `.cursor/mcp.json`, or a global copy at `~/.cursor/mcp.json`. Its documented remote-server shape supports header-based auth with environment-variable interpolation, so the key itself doesn't have to live in the file:

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

`${env:NAMEFI_API_KEY}` resolves from whatever that variable holds in the shell that launched Cursor — export it before opening the editor.

### Windsurf (Cascade)

Windsurf's MCP integration — branded Cascade — reads `~/.codeium/windsurf/mcp_config.json`. Remote servers there use a `serverUrl` field rather than `url`, with the same `headers` and `${env:VAR}` pattern as Cursor:

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

One thing worth flagging: as of this guide's publish date, `docs.windsurf.com/windsurf/cascade/mcp` redirects to `docs.devin.ai/desktop/cascade/mcp` — Windsurf's docs now live under Cognition's Devin product-docs domain, and the config format above is what that current page documents. If you're on an older build, verify field names against whichever docs link your version's in-app help points to.

## The five-step quickstart: new app to live DNS

Once one of the connections above is live, the rest of the flow is the same regardless of which editor you're in.

1. **Get an API key** from [namefi.io/api-key](https://namefi.io/api-key), generated from the wallet that should own the new domain.
2. **Connect** using the config for your editor above, then sanity-check it: ask "check whether `<yourapp>.com` is available on Namefi, and tell me which tool you called." That's a read-only `checkAvailability` call, so it works before you've funded anything.
3. **Register.** Confirm a name and duration in plain language — "register it for one year." The agent submits `registerDomain` and polls the order until it reaches `SUCCEEDED` (or a terminal failure state); a typical registration finishes in a handful of poll cycles.
4. **Point it at your deploy.** This is the step the next section covers in detail — add the DNS records your hosting platform asks for, through the same conversation.
5. **Verify it resolves.** [DNS propagation](/en/glossary/dns-propagation/) isn't instant, so give it a few minutes, then confirm with a public DNS lookup or by just loading the domain in a browser.

## Point the fresh domain at what you just deployed

This is the part a generic "how to register a domain" guide never gets to, because it happens after registration, on the hosting platform's side — but it's the actual point of doing this inside the editor: your agent already knows which platform it deployed to and can wire the DNS in the same breath as the registration.

### Vercel

Vercel's own domain docs walk through the flow from **Settings → Domains** in your project dashboard: add the domain, and Vercel tells you which record to create depending on whether it's an apex domain or a subdomain. For an **apex domain** (`yourapp.com`), Vercel asks for an **A record** pointing at its serving IP; for a **subdomain** (`www.yourapp.com`), it asks for a **CNAME**, and — worth knowing before you copy an example from an older guide — [Vercel's docs are explicit that this CNAME target is unique per project](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record), shown to you in the dashboard rather than a single fixed hostname every project shares.

With that value in hand, the DNS side is one more agent request:

> "Add an A record for `@` pointing to `76.76.21.21`, and a CNAME for `www` pointing to the CNAME target Vercel gave me."

That calls `createDnsRecord` twice — once per record — the same [DNS record](/en/glossary/dns-record-types/) tool used for any DNS write on Namefi. The trailing-dot rule applies here same as anywhere: `rdata` for a CNAME target needs a trailing dot, the `zoneName` (your domain) doesn't.

### Cloudflare Pages

If your deploy target is Cloudflare Pages instead, and your domain's DNS isn't already managed on Cloudflare, [Cloudflare's own custom-domains documentation](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) asks for a single **CNAME** record pointing at your project's `.pages.dev` subdomain — no A record needed, since Pages serves everything through that CNAME target. The Cloudflare dashboard step (Workers & Pages → your project → Custom domains → Set up a domain) has to happen first; only then does the CNAME target resolve correctly.

> "Add a CNAME for `app` pointing to `my-project.pages.dev.`"

Same tool call, same trailing-dot rule on the target, different platform.

<!-- TODO: verify — Vercel and Cloudflare Pages exact steps for issuing/renewing the TLS certificate on a newly attached custom domain, to state confidently whether it's automatic on both or needs a manual trigger -->

## How this compares to Cloudflare's in-editor registration

Cloudflare is the other registrar actively marketing an in-editor angle, worth naming directly. Its Registrar API, [reported in beta as of April 2026](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/), also integrates with MCP-capable editors including Cursor and Claude Code, letting an agent search, price, and register a domain synchronously without leaving its current context — the same core idea this guide walks through for Namefi. The same report notes that, at beta, Cloudflare's API doesn't yet cover post-registration management like transfers and renewals, planned for later in 2026.

Namefi's MCP server covers the full lifecycle today — registration, DNS, [auto-renew](/en/glossary/domain-renewal/) — plus two things Cloudflare's path doesn't have: the domain registers as a [tokenized-domain](/en/glossary/tokenized-domain/) NFT by default (redirectable to any wallet), and it supports a wallet-signed checkout with no Namefi account at all, detailed in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/). Both are building toward the same "don't leave the editor" workflow; which fits depends on whether you want a standard registration or one that's also an on-chain asset.

## Frequently Asked Questions

### Does this cover Codex or Gemini CLI too?
Not here — this guide is deliberately scoped to Claude Code, Cursor, and Windsurf. [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) has the same exact, verified config for Codex CLI, Gemini CLI, and Claude Desktop.

### Do I need a Namefi account before I can try this?
No. A read-only availability check needs no authentication, so you can connect any editor above and run the test prompt in step 2 before generating an API key or funding anything.

### What if my deployment platform isn't Vercel or Cloudflare Pages?
The pattern holds everywhere: your platform's dashboard tells you which DNS record type it needs — almost always an A record for an apex domain, a CNAME for a subdomain — and you hand that value to your agent to write via `createDnsRecord`.

### Is the domain automatically tokenized when I register it this way?
Yes, by default — the domain registers as an NFT on Base, to the wallet tied to your API key, unless you specify a different `nftReceivingWallet` in the request. See [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) if that's new to you.

### Can I skip the API key entirely?
Yes, with a caveat: Namefi's wallet-signed [x402](/en/glossary/x402/) checkout path lets a funded wallet pay for a registration with no account or API key at all. It needs its own explanation, covered in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/).

## Ship the name with the app

The domain is infrastructure, same as the deploy target and the database — there's no real reason it should be the one piece of shipping an app that still requires leaving your tools and filling out a web form. Connect one of the three configs above, run the five-step flow, and the domain goes live pointed at the same deployment your agent just built, without a single browser tab.

**[Generate a Namefi API key](https://namefi.io/api-key)** and try the availability-check prompt in whichever editor you already have open, or read the [full Claude Code walkthrough with an annotated transcript](/en/blog/claude-mcp-domains/) if you want to see every step spelled out.

## Sources and further reading

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP server URL, transport, authentication, registration/DNS endpoint reference — primary source for every Namefi-specific claim in this guide)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (registration request fields, polling flow, order status values)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` syntax, `--header`, `--scope` flags)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` remote-server format, `headers`, `${env:VAR}` interpolation, project vs global config locations)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirects to [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) as of this guide's publish date; `mcp_config.json` format, `serverUrl`, `headers`)
- Vercel — [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (apex-domain A record, per-project CNAME target for subdomains, nameserver method)
- Vercel — [Domains Overview](https://vercel.com/docs/domains#:~:text=76.76.21.21) (the `76.76.21.21` serving IP used for apex A records)
- Cloudflare — [Custom domains for Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (CNAME-to-`.pages.dev` flow for domains not managed on Cloudflare)
- webhosting.today — [AI Agents Can Now Register Domains, No Human Required](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (Cloudflare Registrar API beta report: editor integrations, beta limitations)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (protocol overview)
