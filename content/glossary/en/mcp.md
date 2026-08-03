---
title: MCP
date: '2026-08-03'
language: en
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: An open protocol that lets AI agents discover and call a server's tools at runtime over JSON-RPC, instead of relying on integration code written in advance.
keywords: ['Model Context Protocol', 'MCP server', 'tools/list', 'JSON-RPC 2.0', 'agent tool calling']
also_known_as: ['Model Context Protocol']
level: 1
sources:
  - https://modelcontextprotocol.io/specification/2026-07-28/server/tools
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
  - https://www.anthropic.com/news/model-context-protocol
relatedArticles:
  - /en/blog/mcp-vs-rest-api/
  - /en/blog/namefi-mcp/
  - /en/blog/agent-native/
  - /en/blog/llms-txt/
  - /en/blog/ai-agent-register/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/x402/
  - /en/glossary/epp/
  - /en/glossary/did/
  - /en/glossary/composability/
---

**MCP**, or the **Model Context Protocol**, is an open protocol — [released by Anthropic](https://www.anthropic.com/news/model-context-protocol) on 25 November 2024 — that lets an [AI agent](/en/glossary/ai-agent/) discover and call a server's tools at runtime rather than through integration code a developer wrote in advance. It runs over JSON-RPC 2.0: a [`tools/list`](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) request returns the tools the caller may invoke, each carrying a `name`, a `description`, and an `inputSchema` that must ["be a valid JSON Schema object"](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=be%20a%20valid%20JSON%20Schema%20object) (2020-12 by default), plus an optional `outputSchema` for the result; `tools/call` then invokes one. Servers are reached over stdio, where ["the client launches the MCP server as a subprocess"](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio#:~:text=the%20client%20launches%20the%20MCP%20server%20as%20a%20subprocess), or over Streamable HTTP; HTTP servers that support authorization act as OAuth 2.1 resource servers, and clients ["MUST implement PKCE"](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#:~:text=MCP%20clients-,MUST,implement%20PKCE). Failures split two ways — JSON-RPC errors for malformed requests, and tool execution errors returned with `isError: true` so the model gets ["actionable feedback"](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=actionable%20feedback%20that%20language%20models%20can%20use%20to%20self%2Dcorrect) it can self-correct against. As of the 2026-07-28 revision there is no `initialize` handshake — ["There is no negotiation handshake"](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning#:~:text=There%20is%20no%20negotiation%20handshake); each request declares its own protocol version, and ["MCP has no protocol-level session"](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=MCP%20has%20no%20protocol%2Dlevel%20session), so state travels as explicit handles passed in tool arguments. Compare [EPP](/en/glossary/epp/), the machine-to-machine protocol registrars use with registries, and [x402](/en/glossary/x402/) for agent payments; [Why MCP Exists When We Already Have REST APIs and CLIs](/en/blog/mcp-vs-rest-api/) covers the design rationale.
