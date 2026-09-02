---
title: "What an MCP Server's tools/list Tells You About Price"
date: '2026-09-01'
language: en
tags: ['mcp', 'ai-agents', 'commerce', 'json-schema', 'api-design']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-basics
format: explainer
description: "MCP's spec has no price, cart, or checkout field. Namefi, Shopify's catalog MCP, and commercetools each fill the gap differently."
ogImage: ../../assets/mcp-server-as-storefront-og.jpg
keywords: ['mcp storefront', 'mcp tools/list price', 'model context protocol commerce', 'mcp price field', 'ucp universal commerce protocol', 'mcp server pricing convention', 'agentic commerce mcp', 'mcp cart checkout', 'mcp outputSchema', 'commercetools mcp', 'shopify storefront mcp', 'mcp schema.ts', 'namefi mcp pricing', 'ai agent buy something mcp', 'mcp interoperability']
relatedArticles:
  - /en/blog/namefi-mcp/
  - /en/blog/mcp-vs-rest-api/
  - /en/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/
  - /en/blog/what-is-agent-payment/
  - /en/blog/agents-buy-domains/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/mcp/
  - /en/glossary/ai-agent/
  - /en/glossary/x402/
  - /en/glossary/epp/
  - /en/glossary/registrar/
---

Shopify's product is literally named "Storefront MCP." Its own docs describe it as the way to "help shoppers browse products, manage carts, and [checkout](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront#:~:text=Learn%20how%20to%20use%20the%20Storefront%20MCP%20server%20tools%20to%20help%20shoppers%20browse%20products%2C%20manage%20carts%2C%20and%20checkout%20from%20a%20specific%20Shopify%20store) from a specific Shopify store." BigCommerce built the same name for its own server, pitching it as enabling ["conversational product search, cart management, and seamless checkout"](https://www.bigcommerce.com/blog/storefront-mcp/#:~:text=Storefront%20MCP%20is%20now%20available%20to%20every%20store%2C%20enabling%20conversational%20product%20search%2C%20cart%20management%2C%20and%20seamless%20checkout), and Microsoft's Dynamics 365 Commerce MCP server is described as powering ["product discovery, checkout, inventory, and retail operations"](https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2026/06/29/dynamics-365-commerce-introduces-agentic-capabilities-with-model-context-protocol-mcp/#:~:text=Discover%20how%20the%20Dynamics%20365%20Commerce%20MCP%20server%20enables%20AI%20agents%20to%20power%20product%20discovery%2C%20checkout%2C%20inventory%2C%20and%20retail%20operations). Namefi and a growing list of registrars and marketplaces ship an MCP server with the same pitch. The [Model Context Protocol (MCP)](/en/glossary/mcp/) itself never uses the word "storefront," and its specification defines three kinds of thing a server can expose — tools, resources, prompts — none of which has a field for what something costs.

That gap is not a defect; MCP was built as a general-purpose way for a language model to discover and call a server's capabilities, not as a commerce protocol. But it does mean that "storefront" is doing a lot of unearned work in that marketing copy. Every price a shopping agent sees, every cart it fills, every checkout it completes over MCP is something a specific server chose to bolt on — and three real commerce servers checked against each other, Namefi, Shopify, and commercetools, bolt it on three different ways. A developer wiring an agent to any MCP-based storefront needs to know that before writing the integration, because a price field learned from one server tells you nothing about the shape of the next one.

## What `tools/list` actually gives you

Call `tools/list` on any MCP server and each result comes back with the same fixed set of fields, no matter what the tool does. The specification says a tool definition includes a `name`, an optional `title` and `icons`, a `description`, an `inputSchema` that must ["be a valid JSON Schema object"](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=be%20a%20valid%20JSON%20Schema%20object), and an optional `outputSchema` describing the shape of the result. That's the entire contract. Pulling the current schema directly — the raw `schema.ts` for the [2026-07-28 revision](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts) — and searching it for `price`, `cost`, `cart`, `checkout`, `payment`, `currency`, `inventory`, and `sku` turns up exactly one hit: `costPriority`, a field on `ModelPreferences` that tells a server [how much to prioritize cost when selecting a model](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts#:~:text=How%20much%20to%20prioritize%20cost%20when%20selecting%20a%20model) for sampling — a hint about *inference* cost, not the price of anything a merchant sells. Nothing else in the schema even rhymes with commerce.

The two extensions closest to shipping don't add it either. [MCP Apps](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx), which lets a server hand a host an interactive HTML surface to render in a sandboxed iframe, and [MCP Tasks](https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md), which turns a long-running tool call into a pollable handle instead of a blocking request, both grep clean for the same set of commerce terms. Tasks gives a server a durable way to say "still working, check back" — useful for a slow inventory sync, say, but it says nothing about what's in the inventory. Neither extension was built with commerce in mind, and neither one quietly introduces it as a side effect.

There's a second, more specific gap worth knowing before you build against it: `tools/call` in the base spec carries no session. The [2026-07-28 revision](https://modelcontextprotocol.io/specification/2026-07-28/changelog#:~:text=Make%20MCP%20stateless%3A%20remove%20the%20initialize/notifications/initialized%20handshake) removed the `initialize` handshake entirely, and the tools page is explicit that ["MCP has no protocol-level session, so a server cannot rely on implicit per-connection state to relate one tool call to the next."](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=MCP%20has%20no%20protocol%2Dlevel%20session%2C%20so%20a%20server%20cannot%20rely%20on%20implicit%20per%2Dconnection%20state%20to%20relate%20one%20tool%20call%20to%20the%20next) The spec's own guidance for anything stateful — and a cart, almost by definition, is a thing that accumulates state across calls — is non-normative: ["The protocol has no concept of a state handle; from the wire's perspective a handle is an ordinary string in a tool result and an ordinary argument to subsequent tool calls."](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=The%20protocol%20has%20no%20concept%20of%20a%20state%20handle) In plain terms: if an MCP commerce server wants a cart, it has to invent one — return an opaque ID from one tool and expect the agent to pass it back into the next.

## Three servers, three answers

None of that is a criticism of the spec; it's the reason the shape of a storefront differs from vendor to vendor. Checking three real, public MCP commerce servers against each other shows just how differently "price" and "cart" get filled in.

**Namefi** keeps price inside the MCP tool surface but keeps money entirely outside it. Its discovery descriptor lists availability search and pricing as regular, authenticated MCP tools — the file states plainly that ["every request must be authenticated, including read-only tools such as availability search, pricing, and DNS reads."](https://namefi.io/.well-known/mcp/servers.json) But its reference doc draws a hard line at payment: ["MCP is the control plane for search, registration, DNS, and domain config when paying with an API key + NFSC balance. The x402 (`/x402/...`) and MPP (`/mpp/...`) crypto-payment flows are separate HTTP endpoints, not MCP tools."](https://namefi.io/llms.txt#:~:text=MCP%20is%20the%20control%20plane%20for%20search%2C%20registration%2C%20DNS%2C%20and%20domain%20config%20when%20paying%20with%20an%20API%20key%20%2B%20NFSC%20balance.%20The%20x402%20%28/x402/...%29%20and%20MPP%20%28/mpp/...%29%20crypto-payment%20flows%20are%20separate%20HTTP%20endpoints%2C%20not%20MCP%20tools) When a wallet pays without a stored NFSC balance, the price itself doesn't even arrive as an MCP tool result — [the API responds with an HTTP 402 listing the price if none was attached yet](https://namefi.io/r/en/blog/ai-agent-register#:~:text=the%20API%20responds%20with%20an%20HTTP%20402%20listing%20the%20price%20if%20none%20was%20attached%20yet), a plain REST status code carrying the number. And there's no MCP concept of a cart at all: Namefi's own agent-to-human handoff builds a cart by redirecting a browser to a URL — `namefi.io/cart/add-from-url?add_to_cart=example.com` — that a *person*, not the agent, later checks out from.

**Shopify** takes a different route: it defines a shared price shape, but the shape comes from outside MCP. Shopify's Global Catalog MCP server returns product data that, per its own docs, ["conforms to the UCP catalog search response"](https://shopify.dev/docs/agents/catalog/mcp.md#:~:text=UCP%20catalog%20search%20response) — UCP being the [Universal Commerce Protocol](/en/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/), a separate, industry-wide commerce spec co-developed by Google, Shopify, Etsy, Wayfair, Target, Walmart, Amazon, Microsoft, Meta, Salesforce, Stripe, and others, with its own [MCP binding](https://ucp.dev/2026-04-08/specification/catalog/mcp/) that requires a conforming server to ["return products with valid Price objects (amount + currency)."](https://ucp.dev/2026-04-08/specification/catalog/mcp/#:~:text=Return%20products%20with%20valid%20Price%20objects%20%28amount%20%2B%20currency%29) That price object — an integer amount in minor units plus an ISO currency code — is genuinely portable *between* servers that adopt UCP, because it's specified once and reused. UCP goes further than price, too: its checkout binding defines cart and checkout as first-class MCP tools — `create_checkout`, `get_checkout`, `update_checkout`, `complete_checkout`, `cancel_checkout` — where [UCP capabilities map 1:1 to MCP tools](https://ucp.dev/specification/shopping/checkout/mcp/#:~:text=UCP%20Capabilities%20map%201%3A1%20to%20MCP%20Tools). The catch: Shopify runs this UCP-conformant catalog server *alongside* its own older, non-UCP "Storefront MCP" server, at a separate endpoint, with its own tool names. Standardizing across vendors didn't collapse the choices inside one vendor.

**commercetools** skips a shared commerce vocabulary altogether and exposes its own pre-existing data model as MCP tools directly. Its [Commerce MCP server](https://github.com/commercetools/commerce-mcp) ships dozens of narrow, CRUD-shaped tools — `read_carts` and `create_carts`, `read_standalone_prices` and `create_standalone_prices`, `read_inventory` and `create_inventory`, `create_orders` (built [from a cart, quote, or import](https://github.com/commercetools/commerce-mcp#:~:text=Create%20order)) — each one a thin wrapper around a commercetools REST resource that predates MCP by years. There's no `Price` object shared with UCP or with Namefi; there's commercetools' own `StandalonePrice`, exposed under a commercetools-specific tool name, because the MCP layer here is a pass-through onto an API that already existed.

| Server | Where price appears | Cart / checkout | Vocabulary source |
|---|---|---|---|
| Namefi | Inside read-only MCP tool results; sometimes in an HTTP 402 body outside MCP entirely | A web URL for human handoff — not an MCP concept | Namefi's own API shape |
| Shopify (Global Catalog MCP) | A shared `{amount, currency}` object in tool output | `create_checkout` / `complete_checkout` MCP tools (UCP binding) | UCP, an external multi-vendor spec |
| Shopify (legacy Storefront MCP) | Its own tool output shape, separate endpoint from the above | Its own cart tools, separate from UCP's | Shopify's own API shape |
| commercetools | `read_standalone_prices` / `create_standalone_prices` MCP tools | `read_carts` / `create_carts` MCP tools | commercetools' pre-existing REST resource model |

## The interoperability trap

That table is the actual finding, not the empty schema search by itself. An empty field in a general-purpose protocol isn't surprising — HTTP has no price header either, and nobody writes an article about that. What's worth knowing before you build is that the industry has *not* converged on one convention to fill the gap, even though a shared one — UCP — exists and several large platforms have adopted it. Integration code written against Shopify's UCP-conformant catalog server, expecting a `Price` object with `amount` and `currency`, gets nothing useful from commercetools' `read_standalone_prices` tool, whose output follows commercetools' own schema. Code written against Namefi's pricing tool gets a price, but has to look somewhere else entirely — a REST endpoint, not an MCP tool — to find out whether a crypto payment succeeded. And even a single vendor can run two conventions side by side, as Shopify does with its UCP and non-UCP catalog servers on different endpoints.

Concretely, that means: don't hardcode a price field name against one server and assume it will resolve, even loosely, against the next. Don't assume a `cart` you build against one server is a concept the next server even has — it might be a tool-call handle, a web URL, or nothing at all. And don't assume a server that quotes you a price over MCP is also the thing you pay through MCP; on more than one of these servers, it isn't.

## What to check before you write the integration

Before wiring an agent to a new MCP-based storefront, three checks answer most of what matters:

1. **Call `tools/list` and read the `outputSchema` on anything that looks like search or pricing.** That's the server's actual, current contract — not its marketing page, and not what a similar-sounding server did.
2. **Look for a UCP profile.** A server that publishes `/.well-known/ucp` and advertises `dev.ucp.shopping.catalog` or `dev.ucp.shopping.checkout` is committing to UCP's shared `Price` and `Checkout` shapes, which is the closest thing to a portable convention that exists today. Absent that, treat the tool's fields as vendor-specific until proven otherwise.
3. **Find out where money actually moves.** A server can quote a price over MCP and still settle payment somewhere else entirely — a separate HTTP endpoint, a redirect to a human-facing checkout page, or a status code rather than a tool result. Read the server's own docs for that boundary rather than assuming MCP covers it end to end.

Namefi is a working example of exactly that last split: pricing tools live on the MCP server, but the two payment paths — x402 for direct wallet payment and MPP for a managed payment flow — are separate, documented HTTP endpoints, not MCP tools, precisely because MCP's spec gives a server no vocabulary for either one. That's not a workaround bolted on to cover a gap nobody expected; it's what a spec with no price field leaves every commerce-facing MCP server to decide for itself.

## The takeaway

MCP is not a storefront standard, and none of its likely near-term extensions make it one. What you get from `tools/list` is a name, a description, and two JSON schemas — a contract about *shape*, not about *commerce*. Whether a server's idea of "price" is a shared UCP object, a bespoke JSON field, or a number that only shows up in an HTTP 402 body is a decision every server makes on its own, and three real ones checked side by side made three different decisions. Read the schema the server actually publishes, check whether it points at UCP, and confirm where payment happens before you write a line of integration code against the assumption that "MCP storefront" means one thing.

## Sources and further reading

- Model Context Protocol — [Specification 2026-07-28: Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) — the `Tool` data type, `outputSchema`, and the "Stateful Tools" guidance.
- Model Context Protocol — [Key Changes (2026-07-28 changelog)](https://modelcontextprotocol.io/specification/2026-07-28/changelog) — removal of the `initialize` handshake and protocol-level sessions.
- modelcontextprotocol/modelcontextprotocol — [schema/2026-07-28/schema.ts](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts) — the current protocol schema; `costPriority` is the only cost-adjacent field.
- modelcontextprotocol/ext-apps — [specification/2026-01-26/apps.mdx](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx) — the MCP Apps extension spec.
- modelcontextprotocol/ext-tasks — [specification/2026-07-28/tasks.md](https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md) — the MCP Tasks extension spec.
- Namefi — [MCP discovery descriptor](https://namefi.io/.well-known/mcp/servers.json) and [llms.txt reference](https://namefi.io/llms.txt).
- Namefi — [How to Register a Domain with Your AI Agent](https://namefi.io/r/en/blog/ai-agent-register) — the HTTP 402 price-delivery detail.
- Shopify — [Global Catalog MCP](https://shopify.dev/docs/agents/catalog/mcp.md) and [Storefront MCP server](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront) docs.
- BigCommerce — [Build AI Shopping Agents with BigCommerce Storefront MCP](https://www.bigcommerce.com/blog/storefront-mcp/).
- Microsoft — [Dynamics 365 Commerce MCP Server for AI Agents and Agentic Commerce](https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2026/06/29/dynamics-365-commerce-introduces-agentic-capabilities-with-model-context-protocol-mcp/).
- Universal Commerce Protocol — [homepage](https://ucp.dev/), [Catalog Capability: MCP Binding](https://ucp.dev/2026-04-08/specification/catalog/mcp/), and [Checkout Capability: MCP Binding](https://ucp.dev/specification/shopping/checkout/mcp/).
- commercetools — [Commerce MCP repository and tool reference](https://github.com/commercetools/commerce-mcp).
