---
title: Registrar
date: '2025-06-30'
language: en
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: An ICANN-accredited company authorized to register domain names on behalf of the public, acting as the interface between registrants and registries.
keywords: ['registrar', 'domain registrar', 'ICANN accreditation', 'domain registration', 'RAA', 'EPP', 'auth code', 'transfer lock', 'domain transfer']
level: 2
sources:
  - https://www.icann.org/en/accredited-registrars
  - https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
  - https://www.iana.org/domains/root
aliasesByLocale:
  zh-CN: ['注册服务商']
  de: ['Registrierungsdienst']
relatedArticles:
  - /en/blog/how-to-sell-a-domain-name-you-own/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/what-is-a-tld/
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/what-is-udrp/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registry/
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

A **registrar** is an [ICANN](/en/glossary/icann/)-accredited organization that is authorized to register domain names in one or more top-level domains on behalf of the public, managing the relationship between domain buyers and the [registry](/en/glossary/registry/) that operates the authoritative database for those domains.

## What a registrar does

A registrar serves as the public-facing service provider in the domain name system. When a person or organization wants to own a domain name, they interact with a registrar — not directly with a registry or with [ICANN](/en/glossary/icann/).

The core functions a registrar provides include:

- **Domain search and registration.** The registrar queries the registry's availability database and, upon purchase, submits a registration request on the customer's behalf.
- **Renewal management.** Registrations are leased for one to ten years at a time. The registrar collects renewal fees and re-registers the name before it expires.
- **[DNS](/en/glossary/dns/) and [nameserver](/en/glossary/nameserver/) management.** Registrars give registrants a control panel to update the nameservers that determine where a domain's DNS records are hosted.
- **Contact record maintenance.** ICANN's rules require accurate WHOIS contact data. Registrars collect and (within privacy constraints) publish this data.
- **Domain security features.** These include domain locking, two-factor authentication on the registrar account, DNSSEC signing, and email verification for sensitive changes.
- **Transfer facilitation.** When a domain owner moves to a different registrar, the current registrar must follow ICANN's transfer policy and release the domain in response to a valid transfer request.

## Registrar vs registry vs registrant

The domain name industry is organized around three distinct roles, each starting with "regist-" — a source of frequent confusion.

| Role | Who they are | What they control |
|---|---|---|
| **[Registry](/en/glossary/registry/)** | The operator of a top-level domain (TLD) — e.g., Verisign for `.com`, DENIC for `.de`. | The authoritative database of all second-level domains under that TLD; sets wholesale pricing and registry policies. |
| **Registrar** | An ICANN-accredited reseller authorized to register names inside one or more TLDs. | The customer relationship, retail pricing, control panels, renewal notices, and transfer/lock mechanics. |
| **[Registrant](/en/glossary/registrant/)** | The individual, business, or organization that purchases and uses the domain name. | The configuration of nameservers and DNS records; the legal right to renew and transfer the name. |

Registries and registrars are separate businesses. A registry does not sell to the public; it sells wholesale access to accredited registrars. Registrars then set their own retail prices and compete for customers. In some cases the same company holds both a registry and registrar accreditation (Donuts/Identity Digital is a prominent example), but the roles remain operationally and contractually distinct under ICANN rules.

## ICANN accreditation — the RAA

A company cannot operate as a registrar simply by building a checkout flow. It must first be accredited by [ICANN](/en/glossary/icann/) under the **Registrar Accreditation Agreement (RAA)**, a binding contract that sets minimum obligations around data accuracy, dispute handling, registrant rights, abuse response, and financial escrow of customer data.

Key provisions of the RAA include:

- **Registrant verification.** Registrars must verify contact data and respond to inaccuracy complaints within a defined window.
- **Data escrow.** Registrars must deposit customer registration data with a third-party escrow provider so registrations survive if the registrar goes out of business.
- **Abuse response.** Registrars must maintain an abuse point of contact and take action on documented abuse reports (spam, malware, phishing) within stated timeframes.
- **Thin vs thick WHOIS.** Some TLDs use a thin model (contact data at the registrar) and others use a thick model (contact data copied to the registry). The RAA defines which data must be published or privacy-protected under GDPR and similar frameworks.

ICANN publishes the [full list of accredited registrars](https://www.icann.org/en/accredited-registrars), currently numbering over 2,000 worldwide, along with their accreditation status and any public sanctions.

## How registration and transfers work

### Registration via EPP

Registrars connect to registries using the **Extensible Provisioning Protocol ([EPP](/en/glossary/epp/))**, a standardized XML-based protocol defined in RFC 5730–5734. When a registrant completes a purchase, the registrar's system sends an EPP `create` command to the registry, which records the registration and returns a unique **Registry Object Identifier (ROID)**. The registry then publishes the [nameserver](/en/glossary/nameserver/) delegation in the DNS root zone so the domain resolves.

### Transfer locks and auth codes

Domain transfers between registrars are governed by ICANN's [Inter-Registrar Transfer Policy](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en). Two mechanisms protect against unauthorized transfers:

- **[Transfer lock](/en/glossary/transfer-lock/) (registrar lock / EPP status `clientTransferProhibited`).** When enabled, the registry will reject any transfer request for that domain. Registrars enable this by default as a security measure. The registrant must explicitly unlock the domain before initiating a transfer.
- **[Auth code](/en/glossary/auth-code/) (also called the EPP auth-info code or transfer authorization code).** A one-time password generated by the registrar. The gaining (receiving) registrar submits this code to the registry to prove the registrant authorized the transfer. Without it, the registry rejects the request.

A standard outbound transfer flow:

1. Registrant requests the auth code from the current registrar.
2. Registrant unlocks the domain (disables `clientTransferProhibited`).
3. Registrant enters the auth code at the gaining registrar.
4. Gaining registrar submits an EPP `transfer` command to the registry.
5. The registry notifies the losing registrar, which has five days to explicitly reject or approve; silence is treated as approval.
6. Transfer completes; the gaining registrar holds the registration for the remainder of the term plus one year.

ICANN rules prohibit registrars from charging a transfer-out fee, though some attempt to do so for certain TLDs.

### The 60-day lock rule

ICANN policy locks a domain at its current registrar for 60 days after initial registration and for 60 days after a registrar-to-registrar transfer. This prevents abuse scenarios such as a domain being flipped between registrars to obscure ownership. The 60-day clock resets on each transfer.

## Resellers

Many domain names are sold not by accredited registrars directly, but by **[resellers](/en/glossary/reseller/)** — companies that white-label the registrar's infrastructure under their own brand. Resellers do not hold their own ICANN accreditation; they operate under the accreditation of their upstream registrar. For the [registrant](/en/glossary/registrant/), the practical implications are:

- The upstream registrar holds the EPP connection to the registry, so the registrar's name will appear in WHOIS, not the reseller's.
- Disputes and escrow rights fall under the upstream RAA.
- If the reseller exits the business, registrations remain valid under the upstream registrar's escrow.

Reseller arrangements are common: many web hosting companies, website builders, and telecom providers sell domains as add-ons through this model.

## Choosing a registrar

No single registrar suits every use case. Neutral factors worth comparing:

- **Pricing.** Registration prices are set by the registry (wholesale) but marked up differently by each registrar. Compare first-year promotional pricing against multi-year renewal rates — the gap is often large. Also check transfer-in pricing.
- **Privacy protection.** Most registrars include WHOIS privacy (proxy contact data) at no extra charge following ICANN's GDPR guidance, but some still charge for it. Confirm the default.
- **Security features.** Look for two-factor authentication on the account, registry lock availability for high-value domains, DNSSEC support, and account-change confirmation emails.
- **DNS hosting.** Some registrars bundle their own DNS hosting; others are nameserver-agnostic. Evaluate whether the bundled DNS meets your needs or whether you will point to a separate provider (Cloudflare, AWS Route 53, etc.).
- **Support quality.** Response times and channel options (chat, phone, ticket) vary significantly. For business-critical domains, 24/7 live support matters.
- **Accreditation scope.** Not every registrar is accredited for every TLD. Confirm the registrar supports the specific TLD(s) you need, especially for country-code TLDs (ccTLDs) that may require local presence rules.

Well-known examples of accredited registrars include GoDaddy, Namecheap, Cloudflare Registrar, Google Domains (now Squarespace Domains), and Gandi — named here as factual illustrations, not endorsements. Each has different pricing structures, feature sets, and user interfaces that suit different registrant needs.

## Registrars and tokenized domains

Conventional [DNS](/en/glossary/dns/) registration places domain control with the registrar: account access, payment method, and the registrar's own policies determine who can renew, transfer, or configure a name. Ownership is effectively tied to the registrar account.

Some blockchain-based naming systems — such as the Ethereum Name Service (ENS) for `.eth` names — operate outside the traditional DNS hierarchy and ICANN accreditation framework entirely. In these systems, ownership is encoded in a smart contract and controlled by a cryptographic private key rather than a registrar account. Such names do not appear in the [IANA](/en/glossary/nameserver/) root zone and are not resolvable in standard DNS without browser extensions or resolver-level support.

A small set of projects explore hybrid models, where conventional ICANN-delegated domain names are linked to on-chain ownership records, but as of 2025 these remain outside the mainstream DNS and do not affect the registrar's formal role under the RAA. For any domain that resolves in standard DNS, an ICANN-accredited registrar remains the mandatory intermediary between registrant and registry.
