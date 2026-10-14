---
title: "How to Use Namefi in OpenAI Codex: Search, Register and Manage DNS"
date: '2026-10-14'
language: 'en'
tags: ['ai-agents', 'domains', 'guide', 'faq']
authors: ['namefiteam']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/codex-mcp-domains-og.jpg
description: "Connect OpenAI Codex (CLI, IDE extension, desktop app) to Namefi over MCP, then search, register and manage DNS for a domain. Exact config and fixes."
keywords: ["namefi codex", "codex mcp domain", "openai codex mcp server", "codex config.toml mcp_servers", "codex register domain", "codex cli buy domain", "codex mcp add streamable http", "codex plugin marketplace namefi", "namefi mcp codex setup", "ai agent register domain codex", "codex dns records", "x-api-key codex", "codex mcp oauth login"]
relatedArticles:
  - /en/blog/claude-mcp-domains/
  - /en/blog/ai-agent-register/
  - /en/blog/mcp-quickstart/
  - /en/blog/namefi-mcp/
  - /en/blog/namefi-webmcp/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/blockchain-concepts/
relatedGlossary:
  - /en/glossary/mcp/
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/dns-record-types/
  - /en/glossary/x402/
---

By the end of this guide, [OpenAI Codex](https://learn.chatgpt.com/docs/codex/cli) will be connected to [Namefi](https://namefi.io), an [ICANN](/en/glossary/icann/)-accredited [registrar](/en/glossary/registrar/), and you will have searched for a domain, registered it, and pointed its DNS at your project without leaving your terminal or editor. It is the Codex edition of the [Claude walkthrough](/en/blog/claude-mcp-domains/): same Namefi server, same flow, but with Codex's own config file, commands and quirks.

Two paths get you there, and this guide covers both. The **plugin path** installs Namefi's first-party Codex plugin, which bundles the connection plus guided workflows. The **config path** adds the server by hand, which is the one that also works in the Codex IDE extension. Each step below says which path it belongs to. Every Codex command and config key in this guide was checked against OpenAI's current documentation, and the configuration was loaded by a real Codex CLI (version 0.154.0). The one thing we could not do is record a live registration transcript, so the conversation section shows prompts and what to check, not captured output. Where something is unverified, it says so.

## What you are connecting

Codex can call external tools through the [Model Context Protocol](/en/glossary/mcp/) (MCP). OpenAI's docs say the ChatGPT desktop app, the Codex CLI and the IDE extension all support MCP servers and [share MCP configuration for the same Codex host](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli#:~:text=share%20MCP%20configuration%20for%20the%20same%20Codex%20host). Configure a server once and you can switch between those clients without redoing setup.

Namefi runs one hosted MCP server at `https://api.namefi.io/mcp`, over Streamable HTTP, which exposes the Namefi API as typed tools: [Namefi's MCP page](https://namefi.io/mcp) lists availability search, registration and payment, DNS records, portfolio and orders, and balance. Codex lists "Streamable HTTP servers" as a supported MCP transport, so no adapter is needed. For the tool catalog itself, see [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/).

## Prerequisites

- **Codex.** The CLI, the IDE extension, or Codex in the ChatGPT desktop app. The plugin path needs the CLI or the desktop app: OpenAI's plugin docs say the [IDE extension doesn't support plugins](https://learn.chatgpt.com/docs/plugins.md). The config path works in all three.
- **A Namefi sign-in or API key.** [Every Namefi MCP request is authenticated](https://namefi.io/mcp), including read-only ones; there is no anonymous tier. You can sign in with OAuth in a browser, or send an API key from [namefi.io/api-key](https://namefi.io/api-key) (sign-in required).
- **A way to pay.** Registration spends NFSC (Namefi Service Credits) on the paying wallet, per [Namefi's agent instructions](https://namefi.io/llms.txt). Step 4 covers funding.

## Step 1: Pick how Codex will authenticate

There are two credentials, and the choice decides your config.

**OAuth (browser sign-in).** Connect with no key. When Namefi's server answers with an HTTP 401, [your client discovers the sign-in flow](https://namefi.io/llms.txt) (OAuth 2.1 with PKCE and dynamic client registration), a browser window opens, you approve, and the client retries with the token. No secret is stored in a file. Codex documents [OAuth for Streamable HTTP servers](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli#:~:text=OAuth%20authentication%2C%20including%20Client%20ID%20Metadata%20Documents) and a `codex mcp login <server-name>` command. This is the better default on a laptop, and the only comfortable option for GUI apps that do not inherit your shell's environment variables.

**API key.** Namefi's [`x-api-key` header](https://namefi.io/llms.txt) carries a key you generate at [namefi.io/api-key](https://namefi.io/api-key). This suits unattended and headless runs. Two facts about the key matter before you create one:

- It inherits a wallet's permissions. Namefi's docs say the key [must be generated from the wallet that owns the domain](https://namefi.io/llms.txt) for write operations like DNS changes.
- It can spend money. The notice on Namefi's key-creation flow reads: ["Anyone with this key can buy domains on your account"](https://namefi.io/api-key), with purchases using your NFSC balance first and any remainder charged to the card saved in your payment methods. Treat the key like a card number: keep it out of repositories, shell history and chat transcripts.

## Step 2: Connect Codex to Namefi

### Path A: the Namefi plugin (CLI and desktop app)

Namefi publishes a Codex plugin in [d3servelabs/namefi-codex-plugins](https://github.com/d3servelabs/namefi-codex-plugins). Its README gives two commands:

```bash
codex plugin marketplace add d3servelabs/namefi-codex-plugins
codex plugin add namefi@namefi
```

The first registers the repository as a plugin marketplace (OpenAI's CLI docs say `marketplace add` [accepts GitHub shorthand such as `owner/repo`](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli#:~:text=accepts%20GitHub%20shorthand%20such%20as%20%60owner%2Frepo%60)). The second installs the plugin named `namefi` from the marketplace named `namefi`. Per the README, the marketplace entry requires sign-in at install time, so Codex walks you through authentication then. The plugin bundles the same hosted MCP server plus skills for domains, dynamic DNS and HTTPS routing, and the README says its domain skill requires you to confirm the exact name, duration and price before a paid registration.

Two caveats from the README: the plugin is not yet a published listing in the public OpenAI Plugins Directory, so you install it from the repository as above; and the plugin does not apply to the IDE extension. OpenAI's plugin docs also say to start a new session after installing before the bundled tools appear. You can browse installed plugins inside the CLI with `/plugins`.

### Path B: add the server yourself (CLI, IDE extension, desktop app)

OpenAI's docs say Codex stores MCP configuration in `config.toml`, by default `~/.codex/config.toml`, with `.codex/config.toml` for project-scoped servers in trusted projects. Each server is a `[mcp_servers.<server-name>]` table, and a Streamable HTTP server needs `url`.

**With OAuth**, one command does it. `codex mcp add` takes `--url` for a [streamable HTTP server](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli):

```bash
codex mcp add namefi --url https://api.namefi.io/mcp
```

That writes exactly this to `~/.codex/config.toml`, which we confirmed by running it against a throwaway `CODEX_HOME`:

```toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
```

If Codex does not open the browser by itself, run `codex mcp login namefi` and approve the sign-in. The command waits for you to finish in the browser, so run it where you can see the window.

**With an API key**, edit the file instead, and read the key from an environment variable so it never lands in the file. Codex's docs describe `env_http_headers` as a [map of header names to environment variable names](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli#:~:text=env_http_headers), with values pulled from the environment:

```toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
default_tools_approval_mode = "prompt"
```

Then export the variable in the shell that launches Codex, taking the value from your secret manager rather than typing it into a command you will keep in history:

```bash
export NAMEFI_API_KEY="<value from your secret manager>"
```

Do not use `bearer_token_env_var` for this. Codex documents it for the `Authorization: Bearer` header, and Namefi's key travels in `x-api-key`, so it needs the general `env_http_headers` (or static `http_headers`) field instead.

The `default_tools_approval_mode` line is optional, but worth having for a server that can spend money. OpenAI documents it as the default approval behavior for a server's tools, with values `auto`, `prompt`, `writes` and `approve`; `prompt` makes Codex ask before tool calls. `writes` prompts only for tools not marked read-only, and Namefi's plugin repo notes its server's tools [did not yet set read-only hints](https://github.com/d3servelabs/namefi-codex-plugins/blob/main/SUBMISSION.md) when that file was written, so `writes` may not distinguish searches from purchases. Prefer `prompt`.

A project-scoped `.codex/config.toml` is committed-file territory: put only the `url` and the variable *name* there, never a key. The IDE extension and desktop app read the same configuration. Because a GUI app launched from your dock or start menu may not see variables exported in a terminal profile, OAuth is the safer choice for them (this is a general desktop-launch behavior, not something Namefi or OpenAI documents specifically).

## Step 3: Confirm the connection

Check Codex sees the server before spending anything:

```bash
codex mcp list
codex mcp get namefi
```

For the API-key config above, `codex mcp get namefi` printed:

```text
namefi
  enabled: true
  transport: streamable_http
  url: https://api.namefi.io/mcp
  bearer_token_env_var: -
  http_headers: -
  env_http_headers: x-api-key=NAMEFI_API_KEY
  http_headers_helper: -
  default_tools_approval_mode: prompt
  remove: codex mcp remove namefi
```

That proves Codex parsed the config, not that Namefi accepted your credential. For the live check, start a session with `codex` and run `/mcp`, which OpenAI's docs say shows your active MCP servers, then ask a read-only question:

> "Using the Namefi tools, check whether `example.com` is available to register. Tell me which tool you called. Don't register anything."

If the server answers with a result and names a Namefi tool, you are connected. If you get a 401, jump to the [troubleshooting table](#troubleshooting).

## Step 4: Fund your account

Registration is a paid operation. [Namefi's agent instructions](https://namefi.io/llms.txt) say it spends NFSC on the paying wallet; the key-creation notice above adds that any shortfall can fall through to a saved card. Namefi's MCP page lists [card, NFSC, x402 and MPP](https://namefi.io/mcp) as payment routes, but its agent instructions say x402 and MPP are separate HTTP endpoints, not MCP tools. So from Codex you pay with NFSC or a saved card; the wallet-signing routes are covered in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/).

- **Production:** top up NFSC and manage cards from Namefi's Payment Methods page (linked in the site's account section at [namefi.io](https://namefi.io)). We did not verify a price, a minimum top-up or an NFSC-to-USD rate for this guide, so check the amount on screen before you confirm anything.
- **Testing:** Namefi's docs describe an NFSC faucet for test balances, `POST /v-next/user/faucet`, in [Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx). It is for sandbox environments, not production.

If a payment is blocked, the error body from Namefi already carries the URL to send you to (a top-up or add-card link), [per Namefi's agent instructions](https://namefi.io/llms.txt). Open that link rather than asking Codex to improvise one.

## Step 5: The conversation

With the server connected and funds in place, the rest is plain language. These prompts are a template, not a recorded transcript; the behavior in each step comes from Namefi's documented API.

**1. Search.**

> "Check whether `acme-widgets.com` and `acmewidgets.io` are available on Namefi, and show me the price for each."

Namefi's tools cover one name or many, with pricing. Ask for the price every time, and compare it against the amount you expect before moving on.

**2. Register, with a hard stop for your approval.**

> "Register `acme-widgets.com` for 1 year. Before you submit the order, show me the exact domain, the duration and the total price with its currency, and wait for me to say yes."

Namefi's registration request takes a `normalizedDomainName` (lowercase, no trailing dot) and a `durationInYears` from 0 to 10, defaulting to 1, plus an optional wallet that receives the domain's ownership NFT, which [defaults to the buyer's wallet on Base](https://namefi.io/llms.txt). With the plugin, its domain skill asks for the same confirmation by design. With the manual config, your prompt and the `prompt` approval mode are the safeguard.

**3. Wait for the order.**

> "Check the order status until it finishes and tell me the final status."

Registration is [asynchronous](https://namefi.io/llms.txt): the registration call returns an order, and the order is polled until it reaches a terminal status. Codex should report back once it is done instead of declaring success after the first call.

**4. Add DNS records.**

> "Add an A record for `@` pointing to `203.0.113.10` with a TTL of 300 seconds, and a CNAME for `www` pointing to `cname.vercel-dns.com.`"

Two formatting rules from Namefi's [record format](https://namefi.io/llms.txt): the zone name is the bare domain with no trailing dot, while FQDN values like a CNAME target are lowercase with a trailing dot. Namefi's `ttl` is in seconds. Our guide to [DNS record types](/en/glossary/dns-record-types/) explains the record types if you need them.

**5. Optionally, set up dynamic DNS.** The plugin includes workflows for pointing a hostname at a machine without a static IP, and Namefi's [command-line tool](https://namefi.io/cli) does the same job as a background service. That is a separate topic from registration, so we only mention it here.

## Step 6: Verify it resolves

[DNS propagation](/en/glossary/dns-propagation/) takes time, so give new records a few minutes. Ask Codex to list the records back, or check from your own terminal, independently of Codex:

```bash
dig +short A acme-widgets.com
dig +short CNAME www.acme-widgets.com
```

If you use a deployment platform, finish its own domain-verification step too. Reading records through Namefi's API needs no authentication per its docs, but through the MCP server, expect to be signed in.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| HTTP 401 from the Namefi server, with no tools listed | No credential reached the server. Namefi returns 401 with a `how_to_fix` block and a sign-in challenge when [no credentials are sent](https://namefi.io/llms.txt) | Run `codex mcp login namefi` for OAuth, or confirm `NAMEFI_API_KEY` is exported in the process that launched Codex |
| 401 only in the IDE extension or desktop app | The variable was exported in a terminal the GUI app did not inherit (general OS behavior) | Launch the app from a shell that has the variable, or switch to OAuth |
| 401 with the variable set | Key mistyped, revoked, or the config uses `bearer_token_env_var` | Create a fresh key at [namefi.io/api-key](https://namefi.io/api-key) and use `env_http_headers` with `x-api-key` |
| Nothing happens after editing config | The table name is wrong | OpenAI documents the table as `[mcp_servers.<name>]`, with an underscore; start a new Codex session after editing |
| Server times out at startup | Slow network or cold start | Codex's [documented default](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli#:~:text=startup_timeout_sec) is 10 seconds; raise `startup_timeout_sec` in the server table |
| Plugin installed but no Namefi tools | The session started before the install | Start a new Codex session after `codex plugin add`, per OpenAI's plugin docs |
| DNS write rejected, or `403` | The key's wallet does not own this domain, or a value is malformed | Generate the key from the owning wallet; no trailing dot on the zone name, trailing dot on FQDN values |
| Registration fails | Not enough NFSC or card balance | Check the balance, then top up via Payment Methods (production) or the faucet (test) |
| Codex does not ask before a paid action | Approval mode is not `prompt` | Set `default_tools_approval_mode = "prompt"` on the `namefi` server |

## Frequently Asked Questions

### Does Namefi work in the Codex IDE extension and the desktop app, or only the CLI?
The MCP connection works in all three: OpenAI says the desktop app, CLI and IDE extension [share MCP configuration](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli). The Namefi plugin does not, because OpenAI's plugin docs say [the IDE extension doesn't support plugins](https://learn.chatgpt.com/docs/plugins.md). If you use the extension, configure the server directly (Path B).

### Should I use the plugin or add the MCP server by hand?
The plugin adds guided workflows (domains, dynamic DNS, HTTPS routing) and a confirm-before-paying step in its domain skill, and installs in two commands. The manual config is smaller, works in the IDE extension, and gives you full control of the config. Both use the same server at `https://api.namefi.io/mcp`.

### Do I need an API key?
No. Connect without one and sign in with OAuth in the browser. Use a key for headless or unattended runs, where nobody is there to approve a browser prompt.

### Can Codex spend my money without asking?
Only if you let it. A Namefi key can buy domains, so keep Codex's approval mode at `prompt` for the Namefi server, tell Codex to show the exact name, duration and price and wait for a yes, and read the price yourself before approving.

### Why does Codex say the server needs authentication even for a simple availability check?
Namefi's MCP server has no anonymous tier. Its agent instructions note that a plain availability lookup is available over [open REST](https://namefi.io/llms.txt) without credentials, but the MCP tools require sign-in or a key.

### The Namefi MCP page shows a different Codex install command. Which one is right?
[namefi.io/mcp](https://namefi.io/mcp) lists an `npx codex-marketplace add …` command for Codex. This guide uses the two native `codex plugin` commands from the [plugin repository's README](https://github.com/d3servelabs/namefi-codex-plugins), which the Codex CLI supports directly. The `npx` tool is a separate community package that we have not tested, so we do not recommend it here.

### Is a domain registered this way an NFT?
By default, yes: Namefi's registration request sends the domain's ownership token to the buyer's wallet on Base unless you specify another receiving wallet. See [tokenized domains](/en/glossary/tokenized-domain/) for what that means.

### Where do I go for other agents?
[How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) covers six clients side by side, and [Buy a Domain with Claude](/en/blog/claude-mcp-domains/) is the Claude version of this guide. If you want to know why MCP rather than raw REST, read [MCP vs REST API](/en/blog/mcp-vs-rest-api/).

## Buy your next domain from your terminal

Codex plus Namefi comes down to one config table or two commands, one credential, and a habit of reading the price before saying yes. For what else the server can do once connected, including how the same tools show up in the browser, see [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/) and [WebMCP on Namefi](/en/blog/namefi-webmcp/).

**[Create a Namefi API key](https://namefi.io/api-key)**, or skip the key and run `codex mcp add namefi --url https://api.namefi.io/mcp`.

## Sources and further reading

- OpenAI — [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp.md?surface=cli) (config file location, `[mcp_servers.<name>]` tables, Streamable HTTP keys `url`, `bearer_token_env_var`, `http_headers`, `env_http_headers`, OAuth, `codex mcp add/login`, `/mcp`, approval modes, shared config across CLI, IDE extension and desktop app; the page `developers.openai.com/codex/mcp` redirects here)
- OpenAI — [Command line options](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli) (`codex mcp`, `codex plugin`, `codex plugin marketplace add` with GitHub shorthand)
- OpenAI — [Plugins](https://learn.chatgpt.com/docs/plugins.md) (CLI `/plugins` browser, new session after install, no plugins in the IDE extension)
- OpenAI — [Codex IDE extension](https://learn.chatgpt.com/docs/codex/ide.md) (install and configuration)
- Namefi — [d3servelabs/namefi-codex-plugins](https://github.com/d3servelabs/namefi-codex-plugins) (README install commands, package layout, authentication notes; [SUBMISSION.md](https://github.com/d3servelabs/namefi-codex-plugins/blob/main/SUBMISSION.md) for directory status)
- Namefi — [namefi.io/mcp](https://namefi.io/mcp) (endpoint, tool categories, authentication, plugins, payment routes)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (authentication, OAuth and API key flows, registration fields, DNS record format, payment-blocked handoff)
- Namefi — [namefi.io/api-key](https://namefi.io/api-key) (key creation; sign-in required)
- Namefi — [namefi.io/cli](https://namefi.io/cli) (command-line tool for dynamic DNS and portfolio listing)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC test faucet)
- Model Context Protocol — [What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro) (protocol overview)
