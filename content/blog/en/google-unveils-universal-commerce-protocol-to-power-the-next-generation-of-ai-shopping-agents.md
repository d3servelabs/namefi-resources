---
title: Google Unveils ‘Universal Commerce Protocol’ to Power the Next Generation of AI Shopping Agents
date: '2026-01-15'
language: en
tags: ['Infrastructure', 'AI Agents', 'Digital Commerce']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
format: news
description: UCP is an open-source commerce standard for connecting AI shopping surfaces with merchants and payment providers.
keywords: [‘Universal Commerce Protocol’, ‘UCP’, ‘Google UCP’, ‘AI shopping agents’, ‘AI-powered commerce’, ‘agentic commerce’, ‘AI ecommerce protocol’, ‘conversational commerce’, ‘AI checkout’, ‘future of ecommerce’, ‘agent-based shopping’, ‘open commerce standards’, ‘Google AI’, ‘Gemini AI’, ‘Agent Engine Optimization’]
relatedArticles:
  - /en/blog/ai-vs-io-domain/
  - /en/blog/the-12-dollar-minute-someone-owned-google-com/
  - /en/blog/top-tlds-to-secure-for-your-ecommerce-store/
  - /en/blog/from-mona-co-to-crypto-com/
  - /en/blog/from-mrchewy-com-to-chewy-com/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/choosing-a-tld/
relatedSeries:
  - /en/series/name-change-game-change/
  - /en/series/best-tlds-by-industry/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registrar/
  - /en/glossary/ai-agent/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

At the National Retail Federation conference, Google introduced the [Universal Commerce Protocol (UCP)](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/?linkId=36493970), an open-source standard for commerce interoperability among consumer surfaces, businesses, and payment providers. Google says UCP will support a new checkout experience for eligible product listings in AI Mode and the Gemini app in the United States, while the protocol itself is intended for use beyond Google's own products.

Google developed UCP with companies including [Shopify](https://www.shopify.com/), [Etsy](https://www.etsy.com/), [Wayfair](https://www.wayfair.com/), [Target](https://www.target.com/), and [Walmart](https://www.walmart.com/). Instead of requiring a unique point-to-point integration between every consumer surface and every business, UCP defines shared commerce primitives and a way for participants to discover and negotiate supported capabilities. A business publishes a profile describing the services and endpoints it supports; a client then uses those declared capabilities rather than scraping the merchant's site.

In his [NRF remarks](https://blog.google/company-news/inside-google/message-ceo/nrf-2026-remarks/), Google CEO Sundar Pichai described UCP as open and platform-agnostic. Google's [launch announcement](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/) says more than 20 companies across retail, payments, and commerce have endorsed the protocol.

### Under the Hood

UCP separates commerce services, such as checkout, from optional capabilities, such as fulfillment choices and discounts. Its [technical overview](https://ucp.dev/2026-01-11/specification/overview/) defines bindings for REST, the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro), and Agent2Agent (A2A), allowing the same commerce capabilities to be exposed through different transports. UCP is also designed to work with the [Agent Payments Protocol (AP2)](https://ucp.dev/documentation/ucp-and-ap2/) so payment authorization can remain separate from the shopping workflow.

### What UCP Does — and Does Not Do

UCP is an opt-in interoperability standard, not permission for an agent to scrape a merchant's website. Participating businesses choose which capabilities and endpoints to expose. Google's announcement also says retailers remain the merchant of record and can preserve their customer relationships, while payment credentials are handled by the customer's chosen provider.

UCP could add another surface for product discovery and checkout, but it does not mean the era of [SEO](/en/glossary/seo/) is ending. Retailers still need accurate, discoverable product information for people and search engines. If agent-mediated commerce grows, businesses may also need structured catalogs, clear policies, and machine-readable capability profiles that agents can use reliably.

### Sources

- [Google Developers Blog: Under the Hood — Universal Commerce Protocol](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/?linkId=36493970)
- [Google: New tech and tools for retailers in the agentic era](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/)
- [Google: Sundar Pichai's NRF 2026 remarks](https://blog.google/company-news/inside-google/message-ceo/nrf-2026-remarks/)
- [Universal Commerce Protocol technical overview](https://ucp.dev/2026-01-11/specification/overview/)
- [UCP and Agent Payments Protocol](https://ucp.dev/documentation/ucp-and-ap2/)
