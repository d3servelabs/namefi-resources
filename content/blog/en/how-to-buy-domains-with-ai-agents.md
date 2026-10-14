---
title: "How to Buy Domains with Your AI Agent (Claude, Codex and More)"
date: '2026-10-14'
language: 'en'
tags: ['ai-agents', 'domains', 'guide', 'faq']
authors: ['namefiteam']
editors: ['victor-zhou']
draft: false
format: guide
cluster: buy-domains-with-ai-agents
priority: P1
ogImage: ../../assets/how-to-buy-domains-with-ai-agents-og.jpg
description: "Which way to connect an AI agent to a domain registrar (MCP, REST, CLI or WebMCP), how to pay, what to approve yourself, and where to go for Claude, Codex, Cursor and more."
keywords: ["buy domains with ai agent", "ai agent buy domain", "let ai agent register domain", "claude buy domain", "codex buy domain", "namefi mcp", "agent domain purchase"]
relatedArticles:
  - /en/blog/ai-agent-register/
  - /en/blog/claude-mcp-domains/
  - /en/blog/codex-mcp-domains/
  - /en/blog/wallet-checkout/
  - /en/blog/agent-own-domain/
relatedTopics:
  - /en/topics/buy-domains-with-ai-agents/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/ai-agent-setup/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/mcp/
  - /en/glossary/x402/
  - /en/glossary/registrar/
  - /en/glossary/tokenized-domain/
---

You can now ask an AI agent to find a domain, check the price, register it, and point its DNS at your project, all from one conversation. This page is the overview and decision guide for doing that on [Namefi](https://namefi.io), an [ICANN](/en/glossary/icann/)-accredited [registrar](/en/glossary/registrar/). It explains the moving parts, helps you pick a connection method and a payment method, and sends you to the detailed guide for your specific agent. It does not repeat those guides.

If you already know which agent you use, skip to [Pick your agent](#pick-your-agent). If you want the full step-by-step walkthrough that works for any agent, that is [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/).

## What "buying a domain with an AI agent" means

An [AI agent](/en/glossary/ai-agent/) buys a domain the way you would, minus the checkout page: it asks the registrar's API whether a name is free, reads the price, submits a registration order, and then configures DNS. Two things must be in place first.

- **A way to call the registrar.** Namefi publishes one hosted [MCP](/en/glossary/mcp/) server for its whole API. Its [MCP page](https://namefi.io/mcp) describes the tools as generated from the API and lists search, registration and payment, DNS records, portfolio and orders, and balance. Clients that do not speak MCP can use the same operations over plain HTTPS.
- **Authority to spend.** The agent needs either a credential tied to a funded balance or a wallet that can sign a payment. Without one, it can search but not buy.

Namefi's own agent instructions at [namefi.io/llms.txt](https://namefi.io/llms.txt) tell agents to prefer MCP when the client supports it and to treat REST as a fallback. That is a good default for you too.

## Three ways to connect, plus one in the browser

| Method | Best for | What you need | Where to read more |
| --- | --- | --- | --- |
| MCP server | Anything conversational: Claude, Codex, Cursor, Windsurf, Gemini CLI | The URL `https://api.namefi.io/mcp`, plus OAuth sign-in or an API key | [Namefi MCP Server](/en/blog/namefi-mcp/) |
| REST API | Scripts, CI jobs and agent runtimes without MCP | An API key (or an OAuth token) and HTTPS calls | [How to Use the Namefi API](/en/blog/namefi-api-guide/) |
| CLI | A terminal workflow for your own machine | The `namefi` binary and a browser or device login | [namefi.io/cli](https://namefi.io/cli) |
| WebMCP | Working with the Namefi website itself alongside your agent | An agent or browser that supports site tools | [WebMCP on Namefi](/en/blog/namefi-webmcp/) |

A few honest notes on that table.

**MCP is the main path.** Every MCP request to Namefi is authenticated, including read-only ones; the MCP page says there is no anonymous tier. You sign in with OAuth in a browser, or you send an API key from [namefi.io/api-key](https://namefi.io/api-key) in an `x-api-key` header. OAuth is the comfortable choice on a laptop. An API key suits unattended or headless runs.

**REST is the fallback.** The availability search endpoint is open without credentials, which is handy for a quick check from any script. Everything that spends money or changes DNS needs a key or token.

**The CLI is narrower.** The [CLI page](https://namefi.io/cli) describes dynamic DNS, listing the domains on your account, and port forwarding. It does not describe a purchase command, so this guide does not recommend it for buying. It earns its place after the purchase, for example keeping a home server's DNS record current.

**WebMCP is experimental and page-bound.** It lets an agent act on the Namefi page you already have open, such as searching, managing the cart, or preparing DNS changes for you to review. The [WebMCP article](/en/blog/namefi-webmcp/) explains what it does and what it leaves to the remote MCP server.

## Pick your agent

Every agent below talks to the same server and the same operations. What differs is only where each client keeps its configuration. Pick the one you already have open.

**Claude (Claude Desktop, claude.ai and Claude Code).** Claude Code adds the server with a single `claude mcp add --transport http` command. Claude Desktop and claude.ai use custom connectors. The Claude guide includes an annotated purchase conversation and troubleshooting: [Buy a Domain with Claude](/en/blog/claude-mcp-domains/).

**OpenAI Codex (CLI, IDE extension and desktop app).** Codex reads MCP servers from its `config.toml`, and Namefi also ships a first-party Codex plugin. See [How to Use Namefi in OpenAI Codex](/en/blog/codex-mcp-domains/).

**Cursor and Windsurf.** Both read a JSON config file, and the key can come from an environment variable instead of being typed into the file. The editor-first version, including pointing the new domain at a fresh deployment, is [Namefi MCP Quickstart: Claude Code, Cursor and Windsurf](/en/blog/mcp-quickstart/).

**Gemini CLI, or any other agent.** Use the setup matrix in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/). It covers six named clients and a generic recipe for any MCP-capable one.

**No MCP at all.** If your runtime can only make HTTP requests, go to [How to Use the Namefi API](/en/blog/namefi-api-guide/).

**Want the tool list first?** The full catalog of what an agent can call, grouped by task, is in [Namefi MCP Server: Domain Tools for AI Agents](/en/blog/namefi-mcp/).

**Prefer the browser?** See [WebMCP on Namefi](/en/blog/namefi-webmcp/).

## The universal flow

Whatever the agent, the sequence is the same. The detailed per-client steps live in the spokes above.

1. **Search.** Ask whether a name is available. For several candidates, ask for a bulk check.
2. **Confirm the price.** The availability response carries pricing details: a registration price with an amount and a currency, plus renewal pricing. Make the agent show you both, with the currency, before it proceeds. Do not accept "it is cheap" as an answer.
3. **Register.** Tell the agent the exact name and the number of years. The request takes a normalized domain name and a duration in years from 0 to 10, defaulting to one.
4. **Pay.** Payment is covered by the registration call itself, from one of the rails in the next section. The order is created and then processed asynchronously.
5. **Set DNS.** Once the order finishes, the agent can create records, or you can ask for records in the same registration call. Remember the formatting rule that trips agents most often: the zone name has no trailing dot, but values for CNAME-style records do.
6. **Verify.** The agent should poll the order until it reaches a final status and then confirm that the records resolve. [DNS propagation](/en/glossary/dns-propagation/) can take a few minutes, so a record that is not visible immediately is not necessarily wrong.

A rate limit applies across the API, so a polling agent should poll at a sensible interval and batch DNS changes. The [API guide](/en/blog/namefi-api-guide/) gives the current figure.

## Paying: balance or wallet

There are two families of payment, and the right one depends on whether you want an account.

**Account balance (API key or OAuth).** Registration is paid from your NFSC (Namefi Service Credits) balance first. According to the API description, any remainder is charged to the credit card saved on your Namefi profile, and if neither covers the price the request fails with links to top up or save a card. Balances are reported in US dollars and in integer US cents, and code should prefer the cents fields. In production you top up from the Namefi dashboard; the faucet only issues test tokens on a test network and does not fund real purchases. This is the better fit when an agent buys repeatedly and you want one standing balance to watch.

**Wallet checkout, with no account.** Namefi also accepts a wallet-signed payment through the [x402](/en/glossary/x402/) protocol, with a related MPP variant and a manual signing path. The agent's wallet signs an authorization for one registration and nothing stays on file. These flows are separate HTTP endpoints, not MCP tools, so an MCP-only agent calls them directly. The full explanation is in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/). For the wider landscape of how agents are being given spending authority, see [What Is Agent Payment?](/en/blog/what-is-agent-payment/).

**Hand off to a human.** If the agent has no key and no funded wallet, Namefi's agent instructions describe a cart link the agent can build for you. You open it, sign in and pay yourself. Agents are told to surface the top-up or card link from a payment error rather than invent one.

## Safety and guardrails

An agent that can register domains can also spend money and change live DNS, so decide the rules before you start.

- **Require your approval before any paid call.** Most clients prompt before running a tool. Keep that on for registration, renewal and auto-renew changes. Reading availability is harmless; paying is not.
- **Limit what the agent can lose.** A prepaid balance is a natural cap, so fund it with an amount you are comfortable with. An API key inherits the permissions of the wallet that created it, so create it from the wallet meant to own new domains.
- **Never paste a real key into a prompt, a shared config or a repository.** Prefer OAuth where you can. Where you need a key, load it from an environment variable or your secret manager. Every example in the Namefi guides uses placeholders, and you should treat any example you see as a template, not a value.
- **Review DNS changes.** Validation catches malformed records, not records that are well formed and wrong, and a bad A or MX record on a live domain has real consequences.
- **Watch what it registers.** An unattended agent can register a name that turns out to be someone's trademark, and the registrant is the one who answers for it.

## Who owns the domain

The registrant is you, or your organization, not the agent. ICANN's registrar agreement requires the registered name holder to be a person or legal entity, and the agent is a tool acting under your credential. By default a Namefi registration is also issued as a [tokenized domain](/en/glossary/tokenized-domain/): the NFT goes to the wallet tied to your account, or to a wallet you specify at registration. The agent can operate the domain without owning it. [Can an AI Agent Own a Domain?](/en/blog/agent-own-domain/) covers registrant records, custody levels and liability in depth.

## Frequently Asked Questions

### Can an AI agent really buy a domain on its own?

Yes, technically. With an MCP connection or an API key and a way to pay, an agent can search, register and configure DNS without you touching a checkout form. Whether it should do so unattended is a policy choice. Most people keep an approval step on the paid call.

### Which AI agent is best for buying domains?

None has an advantage on the registrar side, because they all call the same server and operations. Pick the one you already use. The differences are limited to how each client stores its configuration, which is why this page links to a guide per agent.

### Do I need an API key?

Not always. You can connect over MCP with an OAuth browser sign-in and never create a key. A key is simplest for headless or unattended runs. A wallet-signed x402 payment needs neither an account nor a key, but it needs a funded wallet.

### Is it safe to give an agent my payment details?

You do not have to. Prefer a prepaid balance or a wallet you fund in advance, so the most it can spend is what you put there, and keep the approval prompt on for paid calls. Namefi's own wallet flow signs one specific payment at a time instead of storing a charge-anywhere credential.

### How do I check the price before the agent buys?

Ask for it explicitly. The availability result includes registration and renewal pricing with a currency. Tell the agent to quote both, and to stop until you reply "yes".

### Does it work with any TLD?

The agent can only register what the availability check reports as registerable. Ask it to check the exact name, including the extension, first.

### What happens if the registration fails halfway?

Registration is asynchronous, so the agent tracks the order until it reaches a final status. The order status values include succeeded, failed, cancelled and partially completed. If the status is anything other than succeeded, ask the agent to report the order details to you instead of retrying blindly.

### Can the agent keep the domain from expiring?

You can ask it to turn on auto-renewal, which renews the domain before expiry using the payment methods available on the owner wallet. That is a standing authorization, so treat it like a purchase approval and confirm it deliberately.

### Can an agent work with the Namefi website directly?

That is what WebMCP is for. It lets a compatible agent act on the Namefi page you have open, while you watch. See [WebMCP on Namefi](/en/blog/namefi-webmcp/) for what it covers today.

## Start with the agent you already have open

Create an API key at [namefi.io/api-key](https://namefi.io/api-key) or choose OAuth when your client offers it, then follow the guide for your agent above. For a first test, ask the agent only to check whether a name is available and to tell you which tool it called. Nothing is spent, and it proves the connection works.

## Sources and further reading

- Namefi, [namefi.io/mcp](https://namefi.io/mcp): MCP endpoint, tool categories, authentication model.
- Namefi, [namefi.io/llms.txt](https://namefi.io/llms.txt): agent policy, MCP-first flow, registration fields, payment and human hand-off.
- Namefi, [namefi.io/cli](https://namefi.io/cli): CLI capabilities and login options.
- Namefi, [API reference (OpenAPI)](https://api.namefi.io/v-next/openapi/doc): availability pricing fields, balance units, registration payment order.
- Namefi, [API key page](https://namefi.io/api-key).
- ICANN, [2013 Registrar Accreditation Agreement](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en): registered name holder must be a person or legal entity.
