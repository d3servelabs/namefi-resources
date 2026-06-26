---
title: Registry
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The organization that operates the authoritative database and nameservers for a top-level domain, delegating retail sales to registrars.
keywords: ['registry', 'registry operator', 'TLD registry', 'domain registry', 'ICANN', 'registrar', 'EPP', 'gTLD registry', 'ccTLD registry', 'shared registry system']
also_known_as: ['Registry Operator']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/top-tlds-to-secure-for-your-business/
  - /en/blog/how-tld-affects-domain-value/
  - /en/blog/top-tlds-to-secure-for-your-fashion-brand/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/best-tlds-by-industry/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/dns/
  - /en/glossary/web3/
---

A **registry** (also called a *registry operator*) is the organization that operates the authoritative database for a [TLD](/en/glossary/tld/) — recording every domain registered under that extension, maintaining the zone file that maps those names to [nameservers](/en/glossary/nameserver/), and publishing the data that makes queries across the [DNS](/en/glossary/dns/) work. Registries sit at the top of the domain-name supply chain, above [registrars](/en/glossary/registrar/) and [registrants](/en/glossary/registrant/).

## What a registry does

A registry's core function is to maintain the **authoritative database** — often called the *registry database* or *shared registration system* — for every domain under its TLD. When a domain is created, renewed, transferred, or deleted, the registry records the change. The registry also publishes the **TLD zone file**: the set of [nameserver](/en/glossary/nameserver/) delegations that tell the global [DNS](/en/glossary/dns/) where to send queries for names under that TLD.

In addition to database management, most registries operate or contract for the **authoritative nameservers** for their TLD (often called the TLD nameservers). These servers answer queries from resolvers asking, for example, "which nameservers are authoritative for `example.com`?" and return the answer from the registry's zone file.

Beyond technical duties, registries:

- Set **wholesale pricing** — the price [registrars](/en/glossary/registrar/) pay per domain, per year.
- Draft and enforce **registration policies** — eligibility requirements, acceptable-use rules, and sunrise/trademark-protection periods for new extensions.
- Operate **WHOIS / RDAP** lookup services exposing registration data to the public.
- Coordinate with [ICANN](/en/glossary/icann/) under a registry agreement that defines obligations and performance standards ([ICANN Registry Agreements](https://www.icann.org/en/registry-agreements)).

## Registry vs. registrar vs. registrant

The domain-name industry is organized around a three-tier model established by [ICANN](/en/glossary/icann/):

| Tier | Role | Examples |
|------|------|---------|
| **Registry** | Operates the TLD database; sets wholesale price; no direct consumer sales | Verisign (.com, .net), PIR (.org), DENIC (.de) |
| **[Registrar](/en/glossary/registrar/)** | Accredited retailer; sells domains to the public; interfaces with the registry via EPP | GoDaddy, Namecheap, Google Domains |
| **[Registrant](/en/glossary/registrant/)** | The person or organization that registers a domain name | Any business or individual who buys a domain |

Registries and registrars are both accredited by [ICANN](/en/glossary/icann/), but they serve distinct roles. A registry may not also act as a retail registrar for its own TLDs under ICANN's vertical-separation rules (with limited exceptions). This separation is intentional: it prevents a registry from giving itself preferential pricing or preferential access to desirable names ahead of the public.

## How the registry–registrar model works

The technical bridge between registry and registrar is the **[Extensible Provisioning Protocol (EPP)](/en/glossary/epp/)**, an XML-based protocol defined in [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730). Registrars connect to the registry's EPP server to perform domain lifecycle operations: `check` (is a name available?), `create`, `renew`, `transfer`, `update`, and `delete`.

Under this model:

1. A registrar concludes a **Registrar Accreditation Agreement (RAA)** with [ICANN](/en/glossary/icann/) and a separate **registry–registrar agreement** with each registry whose TLDs it wants to sell.
2. The registry charges the registrar a **wholesale fee** (for example, Verisign charges accredited registrars roughly $10.26/year for a `.com` as of 2024).
3. The registrar adds its margin and sells at a **retail price** to the [registrant](/en/glossary/registrant/).
4. The registrar submits [EPP](/en/glossary/epp/) commands to the registry, which updates the authoritative database and zone file — making the domain live across the DNS within minutes.

This architecture, sometimes called the **shared registry system (SRS)**, means a single registry can support hundreds of competing registrars simultaneously, all writing to the same authoritative database via standardized [EPP](/en/glossary/epp/) transactions. Competition at the registrar tier keeps retail prices down without giving any single reseller a monopoly on access to the TLD.

## Examples

**Generic TLD registries**

- **Verisign** operates `.com` and `.net`, the two largest [gTLD](/en/glossary/gtld/)s by registration volume. Its registry agreement with [ICANN](/en/glossary/icann/) is publicly available and widely cited as the reference model ([IANA root database entry for .com](https://www.iana.org/domains/root/db/com.html)).
- **Public Interest Registry (PIR)** operates `.org`, originally established as a non-profit registry to serve non-commercial organizations.
- **Identity Digital** (formerly Donuts and Afilias) is one of the largest operators of delegated [new gTLD](/en/glossary/new-gtld/)s, running hundreds of extensions such as `.blog`, `.online`, `.store`, and `.news`.

**Country-code TLD registries**

[ccTLD](/en/glossary/cctld/) registries operate under national or territorial authority rather than [ICANN](/en/glossary/icann/) [gTLD](/en/glossary/gtld/) agreements, though many still interact with registrars via [EPP](/en/glossary/epp/):

- **Nominet** (.uk) — the registry for the United Kingdom, a non-profit organization founded in 1996.
- **DENIC** (.de) — the cooperative registry for Germany, run by a member organization of registrars.
- **AFNIC** (.fr) — the registry for France, operated under a delegation from the French government.
- **VeriSign** / **CNNIC** (.cn) — China's country-code registry, operated by the China Internet Network Information Center.

ccTLD registries are listed in the IANA root database at [iana.org/domains/root/db](https://www.iana.org/domains/root/db), which is the authoritative inventory of all TLD delegations worldwide.

## New gTLD registries

Before 2012, the set of generic TLDs was small and stable — `.com`, `.net`, `.org`, `.info`, `.biz`, and a handful of others. ICANN's **New gTLD Program**, launched in 2012, opened applications for almost any string as a [new gTLD](/en/glossary/new-gtld/). Over 1,200 new extensions were ultimately delegated.

New [gTLD](/en/glossary/gtld/) registries operate under a **Registry Agreement** with [ICANN](/en/glossary/icann/) that imposes technical requirements (EPP support, DNSSEC, RDAP), performance standards (system availability, query response times), and policy obligations (abuse mitigation, trademark-protection mechanisms such as the Trademark Clearinghouse sunrise period and the Uniform Rapid Suspension system).

ICANN maintains the full list of registry agreements for new gTLDs at [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements).

## Registries and tokenized domains

A small number of alternative domain namespaces — notably Unstoppable Domains and ENS (Ethereum Name Service) — issue domain-like names anchored on public blockchains rather than in an ICANN-coordinated DNS zone. In these systems, ownership is recorded in a smart contract rather than in a registry database, and resolution requires a browser extension or a compatible resolver rather than the standard DNS lookup path.

These blockchain-based namespaces are not delegated in the IANA root and are not visible to ordinary DNS resolvers by default. They operate independently of the ICANN registry system described above.
