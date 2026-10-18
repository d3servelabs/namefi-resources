---
title: 'OAuth CIMD: Why Domains Matter for AI Agent Trust'
date: '2026-07-20'
language: en
tags: ['oauth', 'ai-agents', 'domains', 'security', 'web-standards']
authors: ['namefiteam']
draft: false
format: analysis
description: OAuth CIMD lets an HTTPS URL identify a client. For AI agents, that makes stable domains, secure DNS, and TLS part of the trust path.
keywords: ['OAuth CIMD', 'Client ID Metadata Document', 'AI agent identity', 'OAuth client ID URL', 'MCP authorization', 'domain trust', 'DNSSEC', 'HTTPS', 'TLS certificate', 'OAuth dynamic client registration', 'agent authentication', 'client metadata', 'domain security', 'AI agent OAuth']
ogImage: ../../assets/oauth-cimd-domain-trust-ai-agents-og.jpg
relatedArticles:
  - /en/blog/agent-native/
  - /en/blog/namefi-mcp/
  - /en/blog/agents-buy-domains/
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/dns-on-tokenized-domains/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/dns/
  - /en/glossary/dnssec/
  - /en/glossary/public-key/
  - /en/glossary/domain-hijacking/
---

OAuth has always needed an answer to a basic question: **which application is asking for access?**

Traditionally, the answer is a `client_id` issued after the application registers with an authorization server. That works when one application connects to a known service and the two sides can arrange the relationship in advance. It becomes awkward when an [AI agent](/en/glossary/ai-agent/) or a general-purpose MCP client meets many services at runtime, often for the first time.

The IETF's [OAuth Client ID Metadata Document draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/) proposes a different answer. Instead of receiving an opaque client ID from every authorization server, a client can use an HTTPS URL it controls:

```text
https://agent.example/oauth/client.json
```

That URL is both the client's identifier and the location of a JSON document describing it. The authorization server fetches the document when it needs the client's name, redirect addresses, supported OAuth flows, or public keys.

The change looks small, but it moves a meaningful part of OAuth identity onto internet infrastructure that already has global reach: domains, [DNS](/en/glossary/dns/), and HTTPS. For AI agents, which need to introduce themselves to services they have never seen before, that is especially important.

It also raises the stakes of domain security. If a domain becomes an agent's long-lived OAuth identity, renewing and protecting that domain is no longer just a branding or uptime concern. It is part of protecting the agent's identity.

## First, what CIMD changes

CIMD stands for **Client ID Metadata Document**. As of 2026-07-20, it is an active IETF Internet-Draft, not a published RFC. The current Working Group version is [`draft-ietf-oauth-client-id-metadata-document-02`](https://www.ietf.org/archive/id/draft-ietf-oauth-client-id-metadata-document-02.html), published on 2026-07-06, so details may still change.

Under the draft, a client can publish a document like this:

```json
{
  "client_id": "https://agent.example/oauth/client.json",
  "client_name": "Example Research Agent",
  "client_uri": "https://agent.example",
  "redirect_uris": ["https://agent.example/oauth/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "private_key_jwt",
  "jwks_uri": "https://agent.example/.well-known/jwks.json"
}
```

The exact URL in `client_id` must match both the URL used to fetch the document and the `client_id` value inside it. The authorization server can then treat the listed redirect addresses as the client's registered redirect addresses and can use the published public keys when the client authenticates with a method such as `private_key_jwt`.

The document does not contain a shared client secret or a private key. CIMD specifically rules out shared-secret client authentication in the metadata document. A client may publish a [public key](/en/glossary/public-key/) or a URL for its public keys, but it must keep the matching private key private.

In plain language, the document says:

> This is where I live, this is what I am called, these are the addresses I am allowed to return to, and these are the public keys you can use to check my signatures.

## Why this fits AI agents and MCP

A normal consumer app might integrate with a handful of known identity providers. A general-purpose agent can be asked to connect to a new MCP server during a conversation. Neither the client nor the server may have known about the other when they were deployed.

That creates a cold-start problem:

1. The agent needs to discover how the server authorizes access.
2. The authorization server needs to learn who the agent's client is.
3. The user needs enough information to decide whether to grant access.

OAuth already has Dynamic Client Registration, standardized in [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591.html). With that model, a client sends a registration request to each authorization server and receives a new local client ID. It works, but every server has to create, store, manage, and eventually clean up another registration.

CIMD reverses the direction. The client publishes its own stable metadata once, and supporting authorization servers read it as needed. The current [MCP draft authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization) recommends CIMD support and uses it for the common case in which an MCP client and server have no prior relationship. In that flow, Dynamic Client Registration is retained as a fallback for compatibility.

The result is closer to how the web already identifies servers. An agent can carry one domain-based client identity from service to service instead of collecting a different opaque ID from each one. The current MCP draft still links to CIMD revision `-00`, while the active IETF Working Group document is `-02`; both specifications remain moving drafts. This is protocol direction, not evidence that most deployed authorization servers support CIMD today.

## The domain becomes the stable name

The most important design choice in CIMD is not JSON. It is the HTTPS URL.

A domain gives the client ID several properties that a server-generated random string does not have:

- **Global uniqueness.** `https://agent.example/oauth/client.json` is namespaced by a domain rather than by one authorization server's database.
- **Portability.** Multiple supporting authorization servers can retrieve the same client metadata without sharing a registration database.
- **Human meaning.** A consent screen can show `agent.example`, which a person can inspect and recognize more easily than an opaque string.
- **Operational control.** The operator that controls the exact URL can update metadata and rotate published public keys at a stable location.
- **Policy signals.** An authorization server can apply rules based on the hostname, such as an enterprise allowlist or extra warnings for a newly registered domain.

The CIMD draft goes further: it says the authorization server should display the client ID hostname on the authorization screen. If fetching the metadata fails, the URL may be the only information available to tell the user which client is asking for access.

This is why a good domain is not merely decoration in the flow. It becomes the readable, durable handle around which technical checks and human trust decisions are organized.

## The trust path has several layers

It is tempting to say, "the domain proves the agent's identity." That is too broad. A domain is the name at the center of the process, but several systems work together to make the claim verifiable.

| Layer | What it contributes | What it does not prove |
|---|---|---|
| Domain registration | Delegates a unique name to a registrant while the registration remains active | Control of DNS, hosting, TLS keys, or the metadata URL |
| DNS | Directs the hostname to the service that hosts the metadata | That an unsigned DNS answer was not forged |
| DNSSEC | Lets validating resolvers check the origin and integrity of DNS data | Confidentiality, application safety, or control of the web server |
| HTTPS/TLS | Authenticates the service for the hostname and protects the metadata in transit | That the client deserves the permissions it requests |
| CIMD validation | Binds the exact client ID URL to the fetched document and registered redirect addresses | That the code running as the client holds a private key unless client authentication is also used |
| OAuth policy and consent | Decides whether to accept the client and which access to grant | That every future action by the client will be benign |

No single row is sufficient. Together they turn a domain from a label into a useful source of identity evidence.

## HTTPS is mandatory because the document changes security decisions

The CIMD draft requires the Client Identifier URL to use `https`. That requirement is doing real work.

When the authorization server opens `https://agent.example/oauth/client.json`, it checks that the server's TLS certificate is valid for `agent.example`. [Modern TLS service-identity rules](https://www.rfc-editor.org/rfc/rfc9525.html) define how the hostname expected by the client is matched against the identity in the certificate. A successful connection then protects the JSON from being read or changed in transit.

That matters because the document may supply redirect addresses and public keys. If an attacker could replace either one, the authorization server could send an authorization response to the wrong place or trust the wrong key.

CIMD also forbids the authorization server from automatically following redirects while fetching the document. The metadata must be served directly from the Client Identifier URL with a successful `200 OK` response. That keeps the identity tied to the URL the client actually presented instead of allowing it to wander through a redirect chain to another host.

HTTPS does not certify that `agent.example` belongs to a famous company or that its agent behaves well. It establishes the narrower fact OAuth needs at this step: the authorization server fetched the document through an authenticated, integrity-protected connection for that hostname.

## DNSSEC strengthens the layer below HTTPS

Before an authorization server can connect to `agent.example`, it normally asks DNS where that host can be reached. Ordinary DNS was not designed to prove that an answer is authentic. A forged answer can try to send the request to an attacker's server.

[DNSSEC](/en/glossary/dnssec/) adds digital signatures to DNS data. A validating resolver can follow a chain of trust from the DNS root to the domain and verify that the response came from the signed zone and was not altered. [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html) describes this as data-origin authentication and integrity protection for DNS. For that protection to reach the authorization server, the server must validate DNSSEC itself or securely rely on a trusted validating resolver; signing a zone alone does not guarantee that every application checks the signatures.

For CIMD, DNSSEC is useful defense in depth:

- it makes forged DNS answers detectable before the HTTPS connection begins;
- it protects signed records that direct the authorization server toward the metadata host;
- it helps preserve the integrity of other domain-published security data, including records used for certificate policy where supported.

The distinction matters: **the CIMD draft requires HTTPS, but it does not require DNSSEC.** Correct HTTPS certificate validation is designed to stop a DNS-spoofing attacker who cannot also present a valid certificate for the domain. DNSSEC protects the DNS answer itself and removes one avenue of redirection earlier in the process. They protect different layers and work best together.

Deployments that use [DANE TLSA records](https://www.rfc-editor.org/rfc/rfc6698.html) can go further by publishing a DNSSEC-protected association between a domain and its TLS certificate or public key. DANE is also not a CIMD requirement, and support varies. It is an additional way to connect the DNS trust chain to TLS, not something CIMD silently provides.

## Domain loss can become identity loss

The strongest warning in the CIMD draft is also the clearest argument for taking domains seriously. It says operators should keep the Client Identifier URL resolvable and under their control indefinitely because losing the URL, including through domain expiry or reassignment, could let a third party assume the client's identity.

That risk is larger than a website going offline. If an expired domain is registered by someone else, the new holder may be able to publish metadata at the old client ID URL. Depending on what an authorization server cached, how it handles metadata changes, and whether the client also has to prove possession of an established private key, existing grants or future consent flows could be at risk.

The URL is the identity from the authorization server's point of view. Changing it creates a different client. Losing it may hand the old name to someone else.

For an agent operator, domain renewal therefore belongs beside key rotation and credential recovery in the security plan. Auto-renewal, current payment details, registrar account protection, registry lock where available, and expiry monitoring all reduce the chance that the name changes hands. Separate controls are still needed for DNS, hosting, TLS keys, and the metadata URL. [Domain hijacking](/en/glossary/domain-hijacking/) response is no longer only a web-operations concern when client identity is hosted under the same name.

## A valid domain is not the same as a trustworthy agent

CIMD makes a client easier to identify. It does not make every identified client safe.

An attacker can register a domain, obtain a valid TLS certificate, and publish a perfectly well-formed metadata document. DNSSEC would prove that the attacker's DNS records are authentic records for the attacker's domain. HTTPS would prove that the document came from that domain. Neither system claims that the software is honest.

Authorization servers still need policy. The CIMD draft explicitly allows domain-based trust rules, including:

- warning users about unfamiliar or recently registered domains;
- allowing known enterprise domain patterns;
- showing the hostname alongside the client name and logo;
- requiring redirect addresses to stay on the same origin as the client ID;
- reacting carefully when redirect addresses, public keys, or other important metadata changes.

The hostname is more resistant to cosmetic impersonation than a client-supplied display name, but people can still be fooled by lookalike domains. Logos are also untrusted input. The draft recommends that authorization servers fetch and cache logos themselves so they can inspect them and avoid exposing users to tracking or last-second image changes.

The right claim is therefore: **a securely operated domain gives an agent a stable, verifiable place to make identity claims.** Whether an authorization server trusts those claims, and how much access a user grants, remains a separate decision.

## What agent operators should protect

If a domain will serve as a CIMD client identity, treat the full path as security-sensitive infrastructure:

1. **Choose a durable domain.** Use a name the operator expects to control for the life of the client. Avoid URL shorteners or temporary hosting domains; the draft does not allow redirect-based indirection when the document is fetched.
2. **Protect registration and renewal.** Enable registrar MFA, auto-renewal, expiry alerts, and registry lock where the domain and registrar support it.
3. **Secure DNS administration.** Limit who can change nameservers and records, monitor changes, and enable DNSSEC with a correctly maintained chain of trust.
4. **Serve only over HTTPS.** Automate certificate renewal, monitor certificate failures, and keep TLS configuration current.
5. **Publish public material only.** A CIMD document may contain public keys or a `jwks_uri`; it must never contain private keys or shared client secrets.
6. **Keep redirect addresses narrow.** Use exact, predeclared redirect URLs. Keep them on infrastructure controlled by the same operator when possible.
7. **Plan metadata and key changes.** Authorization servers may cache the document and may require new consent or revoke grants when sensitive fields change. Rotate deliberately and monitor retrieval.
8. **Separate reputation from authentication.** Use signed client authentication such as `private_key_jwt` when the client can protect a private key. Domain control identifies the publication point. On requests where the authorization server requires client authentication, typically at the token endpoint, a valid signed JWT proves possession of the private key corresponding to the public key the server accepted. It does not prove that every agent process or future action is trustworthy.

Authorization servers have their own responsibilities. Fetching a URL supplied by an unknown client creates server-side request forgery risk: a malicious URL could try to make the authorization server contact a private database, cloud metadata endpoint, or administrative service that is not public. The draft therefore requires servers to avoid special-use IP ranges and recommends strict limits and network controls. They also need exact client ID and redirect checks, sensible caching, change detection, and a consent screen that makes the hostname visible.

## Domains are becoming active security infrastructure for agents

For most of the web's history, domains have done several jobs at once: human-readable names, routing anchors, email identities, certificate names, and brand assets. CIMD adds another job. A domain can become the persistent OAuth identity through which an AI client introduces itself and publishes the facts an authorization server needs to evaluate it.

That is a natural fit for agents. Agents are expected to move between services, discover capabilities at runtime, and ask for delegated access without a developer manually registering every possible client-server pair. A stable HTTPS URL gives that moving software a fixed home.

But a fixed home is only useful if it remains controlled and authentic. Careful registration and renewal reduce the risk of the name changing hands. Validated DNSSEC can protect the integrity of signed DNS answers. HTTPS authenticates the host and protects the metadata fetch. CIMD binds that exact URL to the client description. OAuth still limits what the client is allowed to do.

The domain does not replace those controls. It is the name that lets them meet.

## Frequently asked questions

### Is CIMD already an RFC?

No. As of 2026-07-20, OAuth Client ID Metadata Document is an active IETF Internet-Draft. The current Working Group document is revision `-02`, published on 2026-07-06. Implementers should expect the draft to evolve and should track the Datatracker entry.

### Does CIMD require DNSSEC?

No. CIMD requires an HTTPS Client Identifier URL. DNSSEC is a separate, complementary control that lets validating resolvers authenticate DNS data and detect tampering. It strengthens the path to the HTTPS service but is not currently a CIMD requirement.

### Does controlling the domain authenticate the running AI agent?

Not by itself. It authenticates the location from which the authorization server retrieves client metadata when HTTPS validation succeeds. A client that can keep a private key should also use asymmetric client authentication, such as `private_key_jwt`. On an authenticated request, this proves possession of the private key corresponding to the public key accepted by the authorization server; it does not establish the reputation of the agent or authenticate every action it takes.

### Why is this especially relevant to MCP?

MCP clients often connect to servers they did not know about at installation time. CIMD gives those clients a reusable HTTPS identity and lets supporting authorization servers retrieve their metadata without a separate registration record for every new pairing. The current MCP draft authorization specification recommends CIMD for that no-prior-relationship case, although it still cites CIMD revision `-00` and does not establish how widely the mechanism is deployed.

### What happens if the client changes domains?

OAuth treats a different client ID URL as a different client. Existing grants, tokens, and consent associated with the old URL may not transfer. A CIMD URL should therefore be treated as a long-lived identity, not a link that can be casually renamed.

## Sources and further reading

- IETF - [OAuth Client ID Metadata Document, Working Group draft `-02`](https://www.ietf.org/archive/id/draft-ietf-oauth-client-id-metadata-document-02.html) (current draft mechanism, HTTPS URL requirements, metadata validation, domain-loss warning, and domain trust policy).
- IETF Datatracker - [OAuth Client ID Metadata Document status and history](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/).
- Model Context Protocol - [Draft authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization) (CIMD in the MCP client registration and authorization flow).
- IETF - [RFC 7591: OAuth 2.0 Dynamic Client Registration Protocol](https://www.rfc-editor.org/rfc/rfc7591.html) (the registration model CIMD complements).
- IETF - [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414.html) (authorization server discovery and capabilities).
- IETF - [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) (current OAuth security guidance, including exact redirects and asymmetric client authentication).
- IETF - [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728.html) (resource and authorization server discovery used by MCP).
- IETF - [RFC 9525: Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html) (matching a TLS service certificate to its expected domain identity).
- IETF - [RFC 4033: DNS Security Introduction and Requirements](https://www.rfc-editor.org/rfc/rfc4033.html) (what DNSSEC authenticates and what it does not).
- IETF - [RFC 6698: DANE TLSA](https://www.rfc-editor.org/rfc/rfc6698.html) (using DNSSEC-protected DNS records to associate domains with TLS certificates or keys).
