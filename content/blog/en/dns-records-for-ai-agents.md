---
title: 'The DNS Records an AI Agent Needs, and the One That Is Missing'
date: '2026-09-01'
language: en
tags: ['dns', 'ai-agents', 'mcp', 'acme', 'standards']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-basics
format: guide
description: SPF, DKIM, DMARC, and ACME dns-01 are real DNS records you can publish now. The record proving an AI agent may act for your domain does not exist yet.
ogImage: ../../assets/dns-records-for-ai-agents-og.jpg
keywords: ['dns records for ai agents', 'ai agent dns', 'agent authority txt record', 'agent identity and discovery', 'dnsaid draft', 'a2a agent card', 'well-known agent-card.json', 'mcp dns', 'acme dns-01 challenge', 'spf dkim dmarc setup', 'ietf agent dns draft', 'ai agent domain control', 'dns txt record verification']
relatedArticles:
  - /en/blog/agent-own-domain/
  - /en/blog/claude-mcp-domains/
  - /en/blog/mcp-vs-rest-api/
  - /en/blog/dns-is-the-control-plane/
  - /en/blog/what-is-https/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/dns-record-types/
  - /en/glossary/dns/
  - /en/glossary/subdomain/
  - /en/glossary/registrar/
---

Say you are wiring an AI agent to act under your own domain — it sends mail as you, it needs its own TLS certificate, maybe it speaks the [A2A protocol](https://a2a-protocol.org/) to talk to other agents. You open your DNS console to publish what it needs. Four of those records are real, standardized, and safe to ship today. The fifth record — the one that would say "this agent is authorized to act for this domain" — does not exist. Not as a ratified standard, not as an IETF working-group document, not even as one agreed community convention. Several people are racing to invent it right now, and their proposals do not interoperate with each other.

That gap matters because the instinct to reach for a DNS TXT record is correct — it is exactly how the web already proves domain control for mail and for TLS certificates. This piece walks through what to actually publish, why that pattern doesn't yet extend to agent authority, and what the candidates trying to fill it look like as of today.

## The zone file you can publish today

If your agent sends email as your domain, it needs the mail triad. [SPF](/en/glossary/dns-record-types/) records **must be published as a DNS TXT** [(type 16) Resource Record](https://www.rfc-editor.org/rfc/rfc7208.html#section-3.1:~:text=SPF%20records%20MUST%20be%20published%20as%20a%20DNS%20TXT%20%28type%2016%29%20Resource%20Record%20%28RR%29), listing which servers may send mail claiming to be you. DKIM signs outgoing mail with a private key and publishes the public half in DNS — the base specification defines exactly one record type for it, [indicating the use of a TXT RR](https://www.rfc-editor.org/rfc/rfc6376.html#section-3.6.2:~:text=indicating%20the%20use%20of%20a%20TXT%20RR). DMARC then tells receiving mail servers what to do when SPF or DKIM fails, with [Domain Owner preferences stored as DNS TXT records in subdomains named "_dmarc"](https://www.rfc-editor.org/rfc/rfc7489.html#section-6.1:~:text=Domain%20Owner%20DMARC%20preferences%20are%20stored%20as%20DNS%20TXT%20records%20in%20subdomains%20named).

If the agent needs its own certificate — to run a server, not just to call one — the ACME protocol's `dns-01` challenge proves you control the zone: an ACME client [constructs the validation domain name by prepending the label "_acme-challenge"](https://www.rfc-editor.org/rfc/rfc8555.html#section-8.4:~:text=constructs%20the%20validation%20domain%20name%20by%20prepending%20the%20label) to the domain being validated, then publishes the required value there as a TXT record. Unlike ACME's HTTP-based challenge, `dns-01` is the one that can issue wildcard certificates, because it proves control of the whole zone rather than one web server.

A minimal zone for an agent that sends mail and needs a certificate looks like this:

```
; SPF — who may send mail as example.com
example.com.                       TXT  "v=spf1 include:_spf.yourmailer.com ~all"

; DKIM — the public half of your mail signing key
selector1._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."

; DMARC — what to do when SPF/DKIM fail
_dmarc.example.com.                TXT  "v=DMARC1; p=quarantine; rua=mailto:reports@example.com"

; ACME dns-01 — proves control of the zone for certificate issuance
_acme-challenge.example.com.       TXT  "<value issued by your ACME client>"
```

If the agent speaks A2A, add one more file — but notice it is not a DNS record at all. A2A servers make their agent card discoverable by [hosting it at a standardized, well-known URI](https://a2a-protocol.org/latest/topics/agent-discovery/#:~:text=make%20their%20Agent%20Card%20discoverable%20by%20hosting%20it%20at%20a%20standardized) on their domain: `https://example.com/.well-known/agent-card.json`. That path follows [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615.html#:~:text=defines%20a%20path%20prefix%20for), the IETF's decade-old convention for [well-known locations](https://www.rfc-editor.org/rfc/rfc8615.html), and it lives on the web server, not in the zone file. `agent-card.json` is registered in [IANA's Well-Known URIs registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) as of 2025-08-01, with the Linux Foundation as change controller — one of only a handful of entries added for anything AI-agent-related. Search that same registry for anything containing "mcp," and nothing comes back.

## The record you're reaching for next doesn't exist

Notice the pattern underneath SPF, DKIM, DMARC, and `dns-01`: publish a specific value at a specific label in your zone, and anyone who can query DNS for your domain can confirm you — the domain's owner — put it there. That is domain control validation, and it has been the internet's working definition of "proves you own this name" for two decades.

So when the question shifts from "prove I can send mail" to "prove this agent may act for my domain" — book things, spend from a linked account, manage records, represent the domain to another agent — the same reflex kicks in: publish a TXT record, something like `_agent.example.com`, naming the agent and its scope. That record is what a growing number of proposals are trying to define. None of them is a ratified standard yet, and — as the next two sections show — the two agent protocols builders actually use today don't lean on DNS for this at all.

## How today's records earned that trust — and how long it took

The TXT-record-as-proof pattern was not invented for agents; it was built, standardized, and hardened over close to twenty years, one mechanism at a time:

- **2006:** SPF's first specification, [RFC 4408](https://www.rfc-editor.org/rfc/rfc4408.html), reaches Experimental status.
- **2011:** DKIM's current specification, [RFC 6376](https://www.rfc-editor.org/rfc/rfc6376.html), obsoletes the 2007 original and reaches Standards Track.
- **2014:** SPF is re-specified as [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208.html), also Standards Track, obsoleting RFC 4408.
- **2015:** DMARC ships as [RFC 7489](https://www.rfc-editor.org/rfc/rfc7489.html).
- **2019:** ACME, including the `dns-01` challenge, ships as [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555.html).

Every one of those is a full IETF Request for Comments: drafted, reviewed, and published with a permanent document number. None of the agent-authority proposals below have reached that stage. The oldest of them was first published in March 2026 — a few months old against a lineage measured in decades.

## What MCP and A2A actually say about DNS: nothing

It would be reasonable to assume the protocols agents already speak have quietly solved this. They haven't — at least not through DNS.

The Model Context Protocol's authorization specification is built entirely on OAuth. Its current revision, published 2026-07-28, states plainly that [MCP servers MUST implement the OAuth 2.0 Protected Resource Metadata specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#:~:text=MCP%20servers%20MUST%20implement%20the%20OAuth%202.0%20Protected%20Resource%20Metadata) to point clients at an authorization server — discovered via an HTTP `/.well-known/oauth-protected-resource` path, not a DNS lookup. Checking the current spec text directly (not just the older 2025-06-18 revision that an earlier pass of this research had cited) turns up no mention of DNS anywhere in the authorization pages. MCP's whole discovery-and-auth story runs over HTTPS and well-known metadata documents.

A2A's own discovery mechanism, as covered above, is the same shape: a well-known HTTPS path, not a zone record. Two smaller, lighter-weight conventions in the same neighborhood — [AGENTS.md](https://agents.md/#:~:text=Create%20an%20AGENTS.md%20file%20at%20the%20root%20of%20the%20repository), a plain file [placed at the root of a repository](https://agents.md/), and [llms.txt](https://llmstxt.org/), a plain file served from a web root — are HTTP or filesystem conventions too. The llms.txt spec explains explicitly why it didn't use the RFC 8615 well-known-URI convention at all: [well-known URIs exist only at the origin root, and many authors control only a path on a shared host](https://llmstxt.org/#:~:text=well-known%20URIs%20exist%20only%20at%20the%20origin%20root). Nothing in this stack asks a client to look anything up in DNS.

## The crowded almost, as of 2026-09-01

That does not mean nobody is working on it. The opposite: DNS-based agent-authority is a genuinely busy corner of early standards work right now, with at least three efforts pursuing the same goal by different mechanisms. None has been adopted by an IETF working group, and none of them agree on a record format. The snapshot below reflects what each source said when fetched on 2026-09-01 — a status this early is expected to move, possibly before you finish reading this.

| Proposal | Mechanism | Status (fetched 2026-09-01) |
|---|---|---|
| [draft-nemethi-aid-agent-identity-discovery](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/) | TXT record at `_agent.<domain>` | Individual Internet-Draft, version -00 only (no resubmission since it was first posted 2026-03-16). [Expires 17 September 2026](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/#:~:text=Expires%3A%2017%20September%202026) — about two weeks after this snapshot was taken. Not associated with any IETF working group. |
| [draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) | [SVCB/HTTPS](https://www.rfc-editor.org/rfc/rfc9460.html#section-1:~:text=HTTP%20clients%20currently%20resolve%20only%20A%20and%2For%20AAAA%20records) and TLSA-style records rather than TXT | Individual Internet-Draft despite the `dnsop` working-group name in its filename; resubmitted twice, now at version -02 (27 May 2026), replacing an earlier draft the same authors called `dnsop-bandaid`. [Expires 28 November 2026](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/#:~:text=Expires%3A%2028%20November%202026). Not associated with any IETF working group. |
| [Agent Identity & Discovery v2](https://aid.agentcommunity.org/docs/specification) | TXT record, [a single semicolon-delimited string of key=value pairs](https://aid.agentcommunity.org/docs/specification#:~:text=The%20record%20MUST%20be%20a%20single%20semicolon-delimited%20string%20of%20key%3Dvalue%20pairs) | Independent community specification maintained at agentcommunity.org, entirely outside the IETF process. The nemethi IETF draft above credits the same community's registry as its reference implementation. |

Both IETF drafts carry the same standard disclaimer the datatracker attaches to every individual submission: it is not endorsed by the IETF and has no formal standing in the IETF standards process until (if ever) a working group takes it up. Neither page shows a working-group name, a responsible Area Director, or a scheduled IESG telechat — the datatracker's own markers for adoption. Which of the three approaches wins, if any single one does, is not something this snapshot can predict; check the datatracker links yourself for anything published after this date.

## What to publish now, and what to treat as a bet

None of this means DNS is a dead end for agent authority — it means nothing has crossed the line from "proposed" to "standard" yet. Until one does, treat the two categories differently:

**Publish the real ones.** SPF, DKIM, and DMARC if your agent sends mail; `dns-01` if it needs a certificate, especially a wildcard one; a `/.well-known/agent-card.json` if it speaks A2A; an OAuth-based authorization flow per MCP's current specification if it speaks MCP. All four are ratified, all four are boring in the way infrastructure should be boring, and none of them will be superseded next quarter.

**Treat an agent-authority TXT record as an experiment, not a control.** If you publish one of the drafts above under `_agent.<yourdomain>` today, label it internally as exactly that — a bet on an unratified format that may be replaced, renamed, or abandoned, and that no relying party is under any obligation to check. Don't build access control, billing, or legal attestations on top of a record with no formal standing. Re-check the datatracker links in the table above periodically; a working-group adoption call, when one lands, is the signal that changes this calculus.

Because [DNS is what proves control of a name](/en/blog/dns-is-the-control-plane/) for everything from mail to certificates, it is a reasonable bet that whichever agent-authority format eventually wins will live there too — that's the pattern this whole piece just walked through. It just hasn't happened yet. If you're setting up those DNS records anyway, that's ordinary domain and DNS management — [Namefi](https://namefi.io) handles the registration and record-editing side of it, same as it does for the SPF, DKIM, DMARC, and ACME records above; we don't have an agent-authority product to sell you, because as of this writing nobody does.

## Sources and further reading

- IETF — [RFC 7208: Sender Policy Framework (SPF)](https://www.rfc-editor.org/rfc/rfc7208.html) (April 2014), obsoleting [RFC 4408](https://www.rfc-editor.org/rfc/rfc4408.html) (April 2006).
- IETF — [RFC 6376: DomainKeys Identified Mail (DKIM) Signatures](https://www.rfc-editor.org/rfc/rfc6376.html) (September 2011).
- IETF — [RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)](https://www.rfc-editor.org/rfc/rfc7489.html) (March 2015).
- IETF — [RFC 8555: Automatic Certificate Management Environment (ACME)](https://www.rfc-editor.org/rfc/rfc8555.html) (March 2019).
- IETF — [RFC 9460: Service Binding and Parameter Specification via the DNS (SVCB and HTTPS Resource Records)](https://www.rfc-editor.org/rfc/rfc9460.html) (November 2023).
- IETF — [RFC 8615: Well-Known Uniform Resource Identifiers (URIs)](https://www.rfc-editor.org/rfc/rfc8615.html) (May 2019).
- IANA — [Well-Known URIs registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml), `agent-card.json` entry (registered 2025-08-01).
- Model Context Protocol — [Authorization Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery), specification revision 2026-07-28.
- A2A Protocol — [Agent Discovery](https://a2a-protocol.org/latest/topics/agent-discovery/).
- AGENTS.md — [agents.md](https://agents.md/).
- llms.txt — [llmstxt.org](https://llmstxt.org/).
- IETF Datatracker — [draft-nemethi-aid-agent-identity-discovery](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/), fetched 2026-09-01; primary text at [ietf.org/archive/id](https://www.ietf.org/archive/id/draft-nemethi-aid-agent-identity-discovery-00.html#:~:text=Given%20a%20domain%20name%2C%20an%20AID%20client%20queries%20a%20DNS%20TXT%20record).
- IETF Datatracker — [draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/), fetched 2026-09-01.
- Agent Community — [Agent Identity & Discovery specification](https://aid.agentcommunity.org/docs/specification).
