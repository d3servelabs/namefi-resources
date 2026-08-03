---
title: "Why MCP Exists When We Already Have REST APIs and CLIs"
date: '2026-08-03'
language: 'en'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
description: "Agents can already call REST and run shell commands. The design case for MCP — runtime discovery, typed tools, auth — and where curl is still right."
keywords: ["MCP vs REST API", "why does MCP exist", "Model Context Protocol rationale", "MCP vs OpenAPI", "MCP vs CLI", "why not just use an API for AI agents", "tools/list", "JSON Schema tool calling", "MCP capability negotiation", "MCP OAuth 2.1", "agent tool discovery", "runtime API discovery for LLMs", "MCP protocol design", "shell out to CLI AI agent", "MCP session state"]
relatedArticles:
  - /en/blog/agent-native/
  - /en/blog/ai-domain-platforms/
  - /en/blog/llms-txt/
  - /en/blog/namefi-mcp/
  - /en/blog/ai-agent-register/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/epp/
  - /en/glossary/x402/
---

Namefi's own machine-readable policy file, published at [namefi.io/llms.txt](https://namefi.io/llms.txt), tells any agent that reads it: "**REST/curl is a fallback only** when: your client cannot install MCP, the MCP install failed or is blocked, or the user explicitly asks for raw HTTP." It even lists an anti-pattern — "Don't lead with curl when MCP can be installed."

That is an instruction, not an argument. It asserts a preference without saying why the preference is correct, and the objection writes itself: HTTP has worked for thirty years, every language ships a client for it, and a language model can already emit a `curl` command. Adding a protocol on top of a protocol looks like a tax.

This post is the missing argument. It is not a setup guide — [How to Register a Domain with Your AI Agent](/en/blog/ai-agent-register/) covers configuration for six clients, and [the Namefi MCP server catalog](/en/blog/namefi-mcp/) covers the tool surface. This is the design rationale: what problem the [Model Context Protocol](https://modelcontextprotocol.io) solves that a REST API and a shell prompt structurally cannot, and — the part most MCP advocacy skips — where raw HTTP genuinely remains the better answer.

It is also deliberately the *protocol* question, sitting upstream of two adjacent ones: what a [registrar](/en/glossary/registrar/) has to ship before an agent can use it at all ([What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/)) and which platforms expose which interface today ([AI-Agentic Domain Platforms: The 2026 Guide](/en/blog/ai-domain-platforms/)).

## The premise: an integration nobody wrote

Every REST API on the internet assumes a specific sequence: a developer finds the docs, reads them once, writes client code by hand, and ships it. After that the integration runs unattended — but only because a person already did the interpretive work, months ago, off the clock.

An [AI agent](/en/glossary/ai-agent/) breaks that assumption at the root. It arrives with no prior integration, and it arrives again on the next conversation, and the next. That cold-start framing is developed in full in [What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/); the short version is that every session is effectively a new developer with seconds of context budget and no ability to go read a docs site properly.

The rest of this post takes that premise as given and asks the narrower question: given a cold-start caller, what does a protocol have to provide that HTTP alone doesn't?

## "Just read the OpenAPI spec" doesn't survive contact with a context window

The obvious rebuttal is that the machine-readable answer already exists. Publish an OpenAPI document, point the agent at it, done.

It fails on arithmetic. Namefi's own OpenAPI 3.1.1 document, fetched from [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) and measured on **August 3, 2026**, is **415,601 bytes** describing 41 paths and 49 operations. That is a mid-sized API by any standard — and dropping ~416 KB of JSON into a context window to answer "is example.com available" is not a discovery mechanism, it's a denial-of-service against your own token budget.

Size is the visible problem. Three others matter more:

- **A spec describes transport, not intent.** OpenAPI tells you that `POST /v-next/orders/register-domain` accepts a body with certain fields. It does not tell you that registration is asynchronous, that you must poll a second endpoint until the order reaches a terminal status, or which of the 49 operations fits the task in front of you.
- **Specs aren't reliably discoverable.** There is no `/openapi.json` convention that servers actually honor. An agent handed a base URL has no standard way to find the document, and often no way to know one exists.
- **A spec is a superset of what you're allowed to call.** It describes the API; it does not describe *your* API — the operations your credentials actually permit.

MCP's `tools/list` inverts all four. It returns a paginated, cacheable list of tools the caller can invoke right now, and the current specification is explicit that the set "**MAY** vary by the authorization presented on the request — for example, returning only the tools the caller's granted scopes permit" ([MCP specification, 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=vary%20by%20the%20authorization%20presented%20on%20the%20request)). The agent doesn't fetch a description of everything the server can do and then filter. It asks what it can do, and gets an answer scoped to itself.

## The schema is the contract, and the error is written for the model

Each tool in a `tools/list` response carries an `inputSchema`: "JSON Schema defining expected parameters," defaulting to JSON Schema 2020-12, and it "**MUST** be a valid JSON Schema object (not `null`)" ([MCP specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=be%20a%20valid%20JSON%20Schema%20object)). An optional `outputSchema` does the same for the result, and when one is present, servers "**MUST** provide structured results that conform to this schema."

This is not decoration. It moves argument validation to a place where it can be enforced before a call is made rather than diagnosed after one fails. The equivalent in REST-land is a prose sentence in a docs page — "`durationInYears` must be between 0 and 10" — that a model may or may not have in context at the moment it constructs the request.

The error design is the sharper difference. MCP splits failures in two. Protocol errors — unknown tool, malformed request — come back as JSON-RPC errors and are described as "issues with the request structure itself that models are less likely to be able to fix." Tool execution errors come back inside a successful result with `isError: true`, and the spec says explicitly that they "contain [actionable feedback that language models can use to self-correct](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=actionable%20feedback%20that%20language%20models%20can%20use%20to%20self%2Dcorrect) and retry with adjusted parameters." The spec's own example is a date validation failure that tells the model what today's date is.

Read that as a design statement rather than a schema detail: MCP has a category of error whose *audience is the model*, distinct from the category whose audience is the developer. HTTP has status codes, whose audience is a caching proxy, plus a response body whose shape nobody agreed on. A `400 Bad Request` with a human sentence in it is not the same artifact.

## Tool descriptions are context, not documentation

Here is the part with no REST analogue at all.

A tool's `description` field is not read by a developer at design time. It is loaded into the model's context window at tool-selection time, on every turn where those tools are available. That makes its length a runtime cost and its phrasing part of the interface — a distinction the specification acknowledges directly when it asks servers to return tools in a stable order, because "deterministic ordering enables clients to reliably cache the tool list and [improves LLM prompt cache hit rates](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=improves%20LLM%20prompt%20cache%20hit%20rates) when tools are included in model context."

That sentence is quietly remarkable. A wire protocol is making a normative recommendation about the *inference cost* of the thing on the other end. No REST specification has ever had a reason to care whether your endpoint names cache well in a language model's prompt.

The same logic runs through the rest of the surface. Servers can return an `instructions` string described as "optional natural-language guidance for LLMs on how to use this server effectively." When guidance about state lifetime is needed, the spec says to put it in the creation tool's description — "e.g., 'baskets expire after 24 hours of inactivity'" — explicitly "so the model can see it when deciding to create state."

Documentation, in MCP, is not a separate artifact that ships beside the API. It *is* the API, and you pay for it per token.

## Capability negotiation, and a protocol willing to break itself

An agent connecting to a server needs to know what version it's speaking and which optional features exist. REST's answer is convention: a version in the URL path, or a header, or nothing, with no standard way to signal a mismatch and no standard way to ask what's supported.

MCP's answer has changed once already, which is the more interesting fact. The 2025 revisions used an `initialize` handshake in which client and server exchanged protocol versions and capability objects before any real work. The current revision, [2026-07-28](https://modelcontextprotocol.io/specification/versioning#:~:text=protocol%20version%20is), threw that out: "[There is no negotiation handshake](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning#:~:text=There%20is%20no%20negotiation%20handshake). Every request carries its protocol version, and the server accepts or rejects each request independently." A version the server doesn't implement produces an `UnsupportedProtocolVersionError` carrying the list of versions it *does* support, so the client retries correctly instead of guessing. A `server/discover` method — which "[Servers **MUST** implement](https://modelcontextprotocol.io/specification/2026-07-28/server/discover#:~:text=lets%20a%20client%20query%20a%20server)" — returns supported versions, capabilities, and identity in one request for clients that want to ask up front.

The specification also publishes a full client-era × server-era compatibility matrix, naming the two eras "modern" and "legacy," so implementers can predict exactly which combinations break. That is the point worth taking: versioning here is a specified mechanism with a specified failure mode, not a convention each vendor invents. An incompatible client hitting an incompatible server gets a structured error, not a 404 and a shrug.

## State: the part MCP tried, and then deleted

You will read, in a lot of MCP explainers, that MCP is better than REST because it maintains a stateful session while REST is request-scoped. As of the current specification, that is wrong, and the correction is more interesting than the claim.

The 2026-07-28 revision states it flatly: "[MCP has no protocol-level session](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=MCP%20has%20no%20protocol%2Dlevel%20session), so a server cannot rely on implicit per-connection state to relate one tool call to the next." Even the local transport is stateless now — if a server process dies, "because the protocol is stateless, any in-flight requests are simply lost and the client can retry them against the fresh process."

MCP started with implicit session state and moved *toward* REST's statelessness, for the same reasons REST had it: connections drop, processes restart, and load balancers exist. What it kept is the part that actually helps a model: state is now explicit and typed. A server that needs continuity returns a handle from a creation tool and accepts it as an argument on later calls, with the specification setting out guidance on authorization ("a handle is a name, not a capability"), opacity, lifetime, and expiry errors that "say so, so the model can recover by creating a new one."

There is one genuinely stateful thing MCP added that HTTP has no vocabulary for: a tool call can come back `input_required`, carrying a request for more information — a login, a disambiguation, a confirmation — plus an opaque `requestState` blob the client returns with the retry. A REST endpoint that needs one more field from the user can only fail and hope the caller reads the message.

## Why not just shell out to a CLI?

The strongest objection isn't REST. It's that agents can already run shell commands, and every serious service ships a CLI that a person already knows how to use. Why is `namefi register example.com` worse than a tool call?

Five reasons, and one concession that matters.

**A CLI assumes a host.** It assumes a POSIX-ish machine, an installed binary at a known version, a package manager that can put it there, and a shell to invoke it from. A hosted agent — an assistant in a browser tab or a chat product, anything running where the user has no filesystem — has none of that. Notably, MCP did *not* reject local processes: its stdio transport is one, where "[the client launches the MCP server as a subprocess](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio#:~:text=the%20client%20launches%20the%20MCP%20server%20as%20a%20subprocess)" and speaks JSON-RPC over its standard streams. What MCP rejected is the *framing*, not the locality — and the same server, unchanged, is reachable over Streamable HTTP by clients that can't spawn anything.

**Text output is not a schema.** Parsing `--help` gives you flags, not types or constraints or which combinations are valid. Parsing results means regexes against human-formatted output that changes between versions with no compatibility contract. Some CLIs offer `--json`; almost none publish a schema for what that JSON contains.

**Streams get contaminated.** MCP's stdio transport had to legislate what a normal CLI does casually: the server "**MUST NOT** write anything to its `stdout` that is not a valid MCP message," while clients "**SHOULD NOT** assume `stderr` output indicates error conditions" ([MCP specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio#:~:text=write%20anything%20to%20its)). Every progress bar, deprecation notice, and update nag a normal CLI prints to stdout is noise a model has to interpret.

**The blast radius is the whole machine.** A tool call reaches exactly the operations a server exposes. A shell command reaches the filesystem, the network, the environment, and every other binary installed. Sandboxing shell access is a genuinely hard problem; enumerating a tool list is not.

**And it doesn't compose.** Two MCP servers connected to one client present one merged tool list in one vocabulary, and the spec anticipates the obvious failure — clients aggregating tools from multiple servers "**SHOULD** implement a [disambiguation strategy such as prefixing tool names](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=disambiguation%20strategy%20such%20as%20prefixing%20tool%20names) with a server identifier." Two CLIs present two sets of undocumented conventions and no shared error vocabulary.

**The concession.** None of this makes MCP the right answer everywhere, and Namefi's own documentation doesn't claim it does. Every operation reachable through the MCP server is also a plain HTTPS endpoint, and [How to Register a Domain with Your AI Agent](/en/blog/ai-agent-register/) documents the raw `curl` path as a first-class route, not an apology. Use REST or a CLI when: the caller is a script with a fixed integration written once by a human, where cold-start discovery buys nothing; the runtime is a CI job or cron task with no MCP client; latency or dependency budget rules out a protocol layer; you're debugging and want to see the wire; or the operation is a single unauthenticated read — Namefi's availability endpoint needs no credentials at all, and is documented as the explicit search-only exception to its own MCP-first policy.

The dividing line isn't sophistication, it's who wrote the integration. If a human wrote it in advance and it runs the same way every time, an API is the correct tool and the protocol is overhead. MCP earns its cost precisely when nobody wrote the integration.

## Auth is a layer, not a token pasted into a config file

The default agent-credential story is bleak: a long-lived API key in a JSON config file, in plaintext, in a home directory, frequently committed by accident, with the same permissions as the human who created it and no expiry.

MCP specifies an alternative rather than leaving it to each vendor. Authorization is "[OPTIONAL for MCP implementations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#:~:text=Authorization%20is,MCP%20implementations)," but when an HTTP-based server supports it, the shape is fixed: the server acts as an OAuth 2.1 resource server, "MCP servers **MUST** implement OAuth 2.0 Protected Resource Metadata ([RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728))" so a client can discover the authorization server from a `401` response, and "MCP clients **MUST** implement [PKCE](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#:~:text=MCP%20clients-,MUST,implement%20PKCE)" — and must refuse to proceed if the authorization server doesn't advertise support for it. Tokens must carry an RFC 8707 `resource` parameter binding them to the specific server, and servers must reject tokens issued for anyone else.

The practical effect is that a user can connect a client to a server it has never seen, complete a browser sign-in, and end up with a scoped, expiring, audience-bound token — with no secret stored in a config file. Namefi's own [discovery descriptor](https://namefi.io/.well-known/mcp/servers.json) advertises exactly this path alongside the `x-api-key` header. One caveat worth flagging: Namefi's llms.txt documents dynamic client registration (RFC 7591), which the current MCP revision has demoted — it is now "[deprecated and retained for backwards compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#:~:text=is%20deprecated%20and%20retained%20for%20backwards%20compatibility)" in favor of Client ID Metadata Documents. <!-- TODO: confirm with team — whether Namefi's MCP authorization server plans to support OAuth Client ID Metadata Documents alongside RFC 7591 DCR -->

Note the deliberate carve-out: local stdio servers "**SHOULD NOT** follow this specification, and instead [retrieve credentials from the environment](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#:~:text=instead%20retrieve%20credentials%20from%20the%20environment)." The protocol is not claiming OAuth everywhere. It is saying that *remote* servers, where the trust boundary is real, get a specified answer instead of a per-vendor one.

## Frequently Asked Questions

### Is MCP just a wrapper around a REST API?

Mechanically, most MCP servers are — Namefi's tools are generated from its OpenAPI specification. But the wrapper is the point. It converts a document written for a developer to read once into a runtime query (`tools/list`) that returns only what the current caller can invoke, with JSON Schema on every argument, errors written for a model to recover from, and a specified authorization flow. The underlying HTTP endpoints don't change; what changes is whether a caller with no prior integration can use them.

### Why can't an agent just read the OpenAPI spec?

Three reasons. Size: Namefi's spec is over 400 KB of JSON, verified August 3, 2026 — expensive context for one availability check. Discovery: there is no reliable convention for finding a spec from a base URL. Scope: a spec describes the whole API, not the operations your credentials permit, whereas a `tools/list` response can be filtered by the authorization presented on the request.

### Does MCP keep a session open the way a database connection does?

No, and this is a common misconception. The current specification states that "MCP has no protocol-level session." Servers that need continuity across calls return an explicit handle from a creation tool and accept it as an argument later, with lifetime and expiry documented in the tool description itself. MCP moved toward statelessness over time, not away from it.

### When is raw REST or a CLI actually the better choice?

When a human wrote the integration in advance and it runs identically every time: scripts, CI jobs, cron tasks, anything in a runtime with no MCP client, and one-off debugging where you want to see the wire. Namefi documents a full `curl` path for exactly these cases. The protocol earns its cost when nobody wrote the integration ahead of time — not merely because the caller happens to be a program.

### Is MCP a finished, stable standard?

Not yet. The current revision is 2026-07-28, and it replaced the `initialize` handshake used by 2025-11-25 and earlier with per-request version metadata — a breaking change roughly eighteen months after MCP's initial release on November 25, 2024. The specification publishes a compatibility matrix for mixing eras, so the churn is documented rather than silent, but treat any specific mechanism described here as current-as-of-publication rather than permanent.

### Does using MCP mean an agent can spend my money without asking?

No more than an API key does, and the specification is direct about it: "[there **SHOULD** always be a human in the loop](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=there,a%20human%20in%20the%20loop) with the ability to deny tool invocations." That guardrail lives in the client, not the protocol — which is the same open row flagged in the [agent-native checklist](/en/blog/agent-native/), where no major registrar yet documents a server-side spend cap.

## Try it against a real API

The fastest way to evaluate any of this is to point a client at a server that implements the whole surface — typed tools, structured errors, OAuth or a header key — and watch what your agent does with a task it has never been given an integration for. Namefi, an [ICANN](/en/glossary/icann/)-accredited registrar, runs one at `https://api.namefi.io/mcp` over Streamable HTTP, with the same operations available as plain HTTPS endpoints when raw HTTP is the right call — including the [x402](/en/glossary/x402/) wallet-payment path, which lives outside MCP entirely.

**[Generate a Namefi API key](https://namefi.io/api-key)**, or connect with OAuth and let your client discover the sign-in flow on its own.

## Sources and further reading

- Model Context Protocol — [Versioning](https://modelcontextprotocol.io/specification/versioning#:~:text=protocol%20version%20is) (establishes 2026-07-28 as the current revision and the dated-revision scheme)
- Model Context Protocol — [Tools (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=MCP%20has%20no%20protocol%2Dlevel%20session) (`tools/list`, `inputSchema`/`outputSchema`, per-authorization tool sets, the two error categories, prompt-cache guidance, and the "no protocol-level session" statement)
- Model Context Protocol — [Versioning and Compatibility (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning#:~:text=There%20is%20no%20negotiation%20handshake) (per-request version declaration replacing the `initialize` handshake; modern/legacy compatibility matrix)
- Model Context Protocol — [Discovery (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/server/discover#:~:text=lets%20a%20client%20query%20a%20server) (`server/discover` as a mandatory server method returning versions, capabilities, and identity)
- Model Context Protocol — [stdio transport (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio#:~:text=the%20client%20launches%20the%20MCP%20server%20as%20a%20subprocess) (subprocess launch, newline-delimited framing, the stdout/stderr rules cited in the CLI section)
- Model Context Protocol — [Authorization (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#:~:text=Authorization%20is,MCP%20implementations) (OAuth 2.1 roles, RFC 9728 protected-resource metadata, RFC 8707 resource binding, the stdio environment-credentials carve-out, DCR deprecation)
- Model Context Protocol — [Authorization Security Considerations (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#:~:text=MCP%20clients-,MUST,implement%20PKCE) (PKCE requirement and the obligation to refuse servers that don't advertise support)
- Anthropic — [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) (initial release, November 25, 2024)
- IETF — [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728) (the discovery mechanism MCP servers must implement)
- IETF — [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html) (audience binding for MCP access tokens)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (the OpenAPI 3.1.1 document measured at 415,601 bytes / 41 paths / 49 operations on August 3, 2026)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (the mandatory agent policy quoted in the opening, the REST/curl fallback rules, and the search-only exception)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor: transport, OAuth 2.1 + PKCE, dynamic client registration, `x-api-key`)
