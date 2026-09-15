---
title: "What Is a Top-Level Domain (TLD)? Types and Examples"
date: '2026-06-10'
language: en
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: choosing-a-tld
format: explainer
description: "Understand what a TLD is, where it appears in a domain name, and how generic, country-code, and branded extensions differ."
keywords: ["top level domain", "what is a tld", "tld meaning", "top level domain examples", "generic top-level domain", "country-code top-level domain", "brand TLD", "sponsored TLD", "internationalized domain name", "domain extension"]
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/ai-vs-io-domain/
  - /en/blog/top-tlds-to-secure-for-your-startup/
  - /en/blog/top-tlds-to-secure-for-your-saas/
  - /en/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/best-tlds-by-industry/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/tld/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/registry/
  - /en/glossary/dns/
---

## What Is a TLD?

A **TLD ([top-level domain](/en/glossary/tld/))** is the part of a domain name that comes **after the last dot**. In `namefi.io`, the TLD is `.io`. In `google.com`, the TLD is `.com`. In `wikipedia.org`, the TLD is `.org`.

That's the whole **TLD definition** in one sentence: the rightmost label of a [domain name](/en/blog/what-is-domain/). People also call it a **domain extension** or **domain suffix**, but the technically correct term is *top-level domain*. It sits at the very top of the internet's naming hierarchy — hence the name.

> **TLD meaning, quickly:** *Top-Level Domain* — the suffix at the end of a web address (`.com`, `.org`, `.io`, `.ai`, `.xyz`) that identifies the highest level of the [Domain Name System (DNS)](/en/glossary/dns/).


---

## TLD vs Domain vs Subdomain

A full domain name is built from several parts, read **right to left**. Understanding where the TLD fits clears up most of the confusion:

```
blog . namefi . io
 │       │       │
 │       │       └── TLD (top-level domain)
 │       └────────── SLD (second-level domain)
 └────────────────── Subdomain
```

| Part | Example (in `blog.namefi.io`) | What it is |
|------|-------------------------------|------------|
| **TLD** | `.io` | The top-level domain — the suffix you register *under*. |
| **Second-level domain (SLD)** | `namefi` | The unique name you choose and own. |
| **Subdomain** | `blog` | An optional prefix you create yourself to organize content. |

A few distinctions worth nailing down:

- The **domain** (or *registrable domain*) is usually the SLD + TLD together — `namefi.io`. That's the thing you actually register and pay for.
- The **TLD** is the shared ending. You don't own `.io`; you own a name *under* it.
- A **subdomain** is something you control for free once you own the domain — `mail.namefi.io`, `shop.namefi.io`, and so on.

For a deeper walkthrough of how domains are structured, see [What Is a Domain Name?](/en/blog/what-is-domain/) and our [domain terminology guide](/en/blog/domain-terminology-guide/).

---

## The Types of TLD

The broad distinction is between generic and country-code TLDs. Other labels describe a TLD's purpose, introduction round, or script; they are not all mutually exclusive categories.

| Type or label | Example | What to check |
| --- | --- | --- |
| Generic TLD (gTLD) | `.com`, `.org` | The registry's registration policy; “generic” does not always mean open registration |
| Country-code TLD (ccTLD) | `.uk`, `.ai`, `.io` | Local eligibility, registration terms, and the ccTLD manager's policies |
| Brand TLD | `.google` | The operator's brand-specific use and registry agreement |
| Sponsored TLD | `.aero` | The sponsored community's eligibility rules |
| Internationalized TLD | `.中国` | The script and underlying TLD's registration rules |

ICANN defines a [.Brand TLD](#ref-brand-definition) as one using the owner's brand in the extension, and its [.google agreement record](#ref-google-agreement) specifically identifies Brand (Specification 13) status. A brand-shaped string alone is not proof of that contractual status. [IANA](/en/glossary/iana/) delegation records identify TLD managers and classifications; eligibility questions require the relevant registration policy or agreement.

### 1. Generic TLDs (gTLDs)

**gTLDs** are generic top-level domains rather than country-code domains. Well-established examples include:

- [`.com`](/en/tld/com/) — *commercial*, the default for the entire web
- [`.net`](/en/tld/net/) — originally for network infrastructure
- [`.org`](/en/tld/org/) — originally for organizations and nonprofits
- [`.info`](/en/tld/info/) — informational sites; introduced in the 2000 expansion round and delegated in 2001, not one of the original 1980s gTLDs

These familiar examples serve different audiences. Confirm the exact name, price, and registration policy rather than treating familiarity as a guarantee of value.

### 2. Country-Code TLDs (ccTLDs)

**ccTLDs** are two-letter TLDs tied to a country or territory, based on the ISO 3166 country-code list. Examples include `.us` (United States), `.uk` (United Kingdom), `.de` (Germany), `.cn` (China), [`.ae`](/en/tld/ae/) (United Arab Emirates), and [`.ac`](/en/tld/ac/) (Ascension Island).

Here's the interesting part — many ccTLDs have been repurposed far beyond their home country because the letters spell something useful:

- [`.ai`](/en/tld/ai/) is technically Anguilla's [ccTLD](/en/glossary/cctld/), but it's become *the* extension for artificial-intelligence companies.
- [`.io`](/en/tld/io/) belongs to the British Indian Ocean Territory, yet dominates tech and startup branding ("I/O").
- `.co` (Colombia) is widely used as a short stand-in for `.com`.

This is the **[gTLD](/en/glossary/gtld/) vs ccTLD** distinction in a nutshell: gTLDs operate under ICANN registry contracts, while ccTLD managers use their own policy arrangements. Neither category alone tells you whether anyone can register; restrictions vary by extension.

### 3. Sponsored TLDs (sTLDs)

**Sponsored TLDs** are restricted gTLDs backed by a specific community or organization that sets eligibility rules. You generally have to qualify to register one. Classic examples: `.gov` (US government), `.edu` (accredited US educational institutions), `.mil` (US military), `.aero` (the aviation industry), and `.museum`.

### 4. New gTLDs

Starting in 2013, ICANN opened the floodgates with the **[new gTLD](/en/glossary/new-gtld/) program**, expanding the namespace from a couple dozen endings to well over a thousand. These cover keywords, industries, hobbies, and brands:

| Category | Examples |
|----------|----------|
| Tech & web | [`.app`](/en/tld/app/), [`.dev`](/en/tld/dev/), [`.tech`](/en/tld/tech/), [`.cloud`](/en/tld/cloud/), [`.click`](/en/tld/click/) |
| Modern & generic | [`.xyz`](/en/tld/xyz/), [`.site`](/en/tld/site/), [`.online`](/en/tld/online/), [`.world`](/en/tld/world/), [`.space`](/en/tld/space/) |
| Commerce | [`.shop`](/en/tld/shop/), [`.store`](/en/tld/store/), [`.vip`](/en/tld/vip/) |
| Community & content | [`.blog`](/en/tld/blog/), [`.club`](/en/tld/club/), [`.live`](/en/tld/live/), [`.fun`](/en/tld/fun/) |
| Short & memorable | [`.top`](/en/tld/top/), [`.sbs`](/en/tld/sbs/), [`.now`](/en/tld/now/) |

New gTLDs gave the internet breathing room: when every good `.com` was taken, endings like [`.xyz`](/en/tld/xyz/), [`.site`](/en/tld/site/), and [`.app`](/en/tld/app/) opened up fresh, memorable naming space.

### 5. Internationalized TLDs (IDN TLDs)

**IDN TLDs** are top-level domains written in non-Latin scripts — Arabic, Chinese, Cyrillic, Devanagari, and more. Examples include `.рф` (Russia), `.中国` (China), and `.السعودية` (Saudi Arabia). They let people use the internet in their own language and writing system, end to end.

### A note on Web3 endings

You may also have seen [blockchain](/en/glossary/blockchain/)-native endings like `.eth` or `.crypto`. These are *not* ICANN TLDs — they live outside the traditional DNS root and resolve only through special wallets or resolvers. Namefi catalogs them too (see [`.eth`](/en/tld/eth/)), but it's worth knowing they're a different category. We unpack that distinction in [Tokenized Domain vs Web3 Domain](/en/blog/tokenized-domain-vs-web3-domain/).

---

## How TLDs Are Governed

Behind every TLD is a layered system of governance. Here's who does what:

- **ICANN** — the [Internet Corporation for Assigned Names and Numbers](/en/glossary/icann/) is the nonprofit that coordinates the global namespace, sets policy for gTLDs, and accredits registrars. Founded in 1998, it's the closest thing the domain world has to a referee.
- **IANA** — the Internet Assigned Numbers Authority (operated under ICANN) maintains the authoritative **[root zone](/en/glossary/root-zone/)**: the master list of every valid TLD and which [registry](/en/glossary/registry/) runs it.
- **Registries** — each TLD is operated by a *registry*, the organization that runs the central database for that ending. For example, **Verisign** operates `.com` and `.net`, and the **Public Interest Registry (PIR)** runs `.org`. ccTLD managers can have different organizational forms; for instance, [`.ae`](/en/tld/ae/) is administered by the UAE's TDRA.
- **Registrars** — a [registrar](/en/glossary/registrar/) is the retailer you buy from. ICANN-accredited registrars (like Namefi, GoDaddy, and Namecheap) sell names to the public and pass registrations up to the registry.

So the chain looks like this: **ICANN/IANA** sets the rules and the root → **registries** operate each TLD → **registrars** sell names to **you**. When you register `yourname.com`, you're buying from a registrar, who records it with the registry (Verisign), all under ICANN policy.

---

## TLD Examples: Popular Endings at a Glance

A quick, scannable reference of common **TLD examples** and what each is best known for:

| TLD | Type | Best known for |
|-----|------|----------------|
| [`.com`](/en/tld/com/) | gTLD | The default for any business — most trusted, most valuable |
| [`.org`](/en/tld/org/) | gTLD | Nonprofits, communities, open-source projects |
| [`.net`](/en/tld/net/) | gTLD | Tech, networks, infrastructure |
| [`.io`](/en/tld/io/) | ccTLD (repurposed) | Startups, developers, SaaS |
| [`.ai`](/en/tld/ai/) | ccTLD (repurposed) | Artificial intelligence and tech |
| [`.app`](/en/tld/app/) | new gTLD | Mobile and web apps (HTTPS-only) |
| [`.dev`](/en/tld/dev/) | new gTLD | Developers and engineering teams |
| [`.tech`](/en/tld/tech/) | new gTLD | Technology brands and products |
| [`.xyz`](/en/tld/xyz/) | new gTLD | Modern, flexible, generation-neutral |
| [`.shop`](/en/tld/shop/) | new gTLD | E-commerce and retail |
| [`.vip`](/en/tld/vip/) | new gTLD | Premium, exclusive, membership brands |
| [`.sbs`](/en/tld/sbs/) | new gTLD | "Side-by-side" — affordable, expressive names |

Want to go deeper on a specific one? Browse the full library of [TLD guides](/en/tld/), including [`.cloud`](/en/tld/cloud/), [`.online`](/en/tld/online/), [`.store`](/en/tld/store/), [`.site`](/en/tld/site/), [`.club`](/en/tld/club/), [`.world`](/en/tld/world/), and dozens more.

---

## How to Choose a TLD

With well over a thousand options, picking the right ending comes down to a few practical questions:

1. **Is `.com` available?** It's still the gold standard for trust and resale value. If your exact `.com` is free and affordable, it's usually the safe default. See [why `.com` remains the gold standard](/en/tld/com/).
2. **Does the TLD match your purpose?** A startup fits [`.io`](/en/tld/io/) or [`.ai`](/en/tld/ai/); a store fits [`.shop`](/en/tld/shop/) or [`.store`](/en/tld/store/); a developer tool fits [`.dev`](/en/tld/dev/). The right ending can *describe* what you do.
3. **Are you targeting a specific country?** A ccTLD like [`.ae`](/en/tld/ae/) signals local presence and can help with local search visibility — but check eligibility rules first.
4. **Is the name memorable and brandable?** A short SLD on a modern TLD ([`.xyz`](/en/tld/xyz/), [`.app`](/en/tld/app/)) often beats a long, awkward `.com`.
5. **What does renewal cost?** Some TLDs have low first-year promos but higher renewals. Always check the long-term price, not just the intro price.
6. **Any restrictions?** Sponsored TLDs (`.gov`, `.edu`) and some ccTLDs require eligibility. New gTLDs like [`.app`](/en/tld/app/) and [`.dev`](/en/tld/dev/) enforce HTTPS by default.

A good rule of thumb: **choose the TLD your audience will trust and remember**, then make sure the price and rules fit your plans.

---

## TLDs and Tokenization

Your TLD does not just shape branding — it can also affect whether a particular registrar or tokenization platform supports bringing the domain **[on-chain](/en/glossary/on-chain/)**.

A [tokenized domain](/en/blog/what-are-tokenized-domains/) is a domain in the ordinary DNS root whose platform-supported control is also represented by a token, typically an [NFT](/en/glossary/nft/), in a [wallet](/en/glossary/wallet/). Registrar and registry records, ICANN policy, platform agreements, disputes, and court orders still apply. DNS remains in the ordinary system and must stay aligned with the token-control layer.

Support varies by TLD, registrar, platform, chain, and contract. Check the live platform catalog if you want to:

- Hold your domain directly in your own wallet
- Transfer its token-control leg onchain while the platform keeps domain management aligned
- List it on a compatible NFT marketplace or offer it as [collateral](/en/glossary/collateral/) only where a [DeFi](/en/glossary/defi/) protocol explicitly supports that chain, collection, and asset

**Namefi** supports [tokenization](/en/glossary/tokenize/) for eligible domains across a current catalog of TLDs, including examples such as [`.com`](/en/tld/com/), [`.xyz`](/en/tld/xyz/), and [`.io`](/en/tld/io/). Availability and chain support can change, so verify the live product before relying on a specific TLD or marketplace.

> Curious how the two layers fit together? Read [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) or visit [namefi.io](https://namefi.io) to register or tokenize a domain.

---

## Frequently Asked Questions

### What is a TLD?
A TLD (top-level domain) is the part of a domain name after the last dot — like `.com`, `.org`, or `.io`. It's the highest level in the Domain Name System hierarchy and is often called a domain extension or suffix.

### What does TLD stand for?
TLD stands for **Top-Level Domain**. It refers to the suffix at the end of a web address that sits at the top of the internet's naming hierarchy.

### What is the difference between a TLD and a domain?
A *domain* is the full registrable name, usually the second-level name plus the TLD (e.g., `namefi.io`). The *TLD* is just the shared ending (`.io`). You register and own a domain; you register names *under* a TLD but don't own the TLD itself.

### What are the main types of TLD?
The main types are generic TLDs (gTLDs) like `.com`, country-code TLDs (ccTLDs) like `.uk` and `.ai`, sponsored TLDs (sTLDs) like `.edu` and `.gov`, new gTLDs like `.xyz` and `.app`, brand TLDs such as `.google`, and internationalized TLDs (IDNs) written in non-Latin scripts.

### What is the difference between gTLD and ccTLD?
A gTLD is a generic ending governed under an ICANN registry contract. A ccTLD is associated with a country or territory and has a designated manager. Registration eligibility varies within both groups; a brand gTLD is different from an open retail extension.

### What are some examples of TLDs?
Common examples include `.com`, `.org`, `.net`, `.io`, `.ai`, `.app`, `.dev`, `.tech`, `.xyz`, `.shop`, and `.vip`. There are well over 1,000 TLDs available today.

### Who controls TLDs?
ICANN coordinates the global namespace and accredits registrars, IANA maintains the authoritative root zone of all valid TLDs, registries operate individual TLDs (e.g., Verisign runs `.com`), and registrars sell domains to the public.

### Which TLD should I choose?
If your exact `.com` is available and affordable, it's usually the safest choice for trust and resale value. Otherwise, pick a TLD that matches your purpose — `.io` or `.ai` for startups, `.shop` for stores, `.dev` for developers — and check the renewal price and any eligibility rules before registering.

---

## Sources and further reading

- <span id="ref-brand-definition"></span>ICANN — [What is a .Brand TLD?](https://newgtldprogram.icann.org/en/application-rounds/round2/2026-round-general/application-types/faqs/brand-tlds/what-is-a-brand-tld), definition and Specification 13. Fetched 2026-09-15.
- <span id="ref-google-agreement"></span>ICANN — [`.google` registry agreement](https://www.icann.org/en/registry-agreements/details/google#:~:text=Agreement%20Type), agreement type and operator. Fetched 2026-09-15.

- ICANN — [New gTLD Program history](https://www.icann.org/resources/pages/newgtlds-history-2023-04-05-en) (the original seven gTLDs and the 2000 expansion round)
- IANA — [`.info` delegation record](https://www.iana.org/domains/root/db/info.html) (`.info` type and 2001 delegation date)
- IANA — [`.io` delegation record](https://www.iana.org/domains/root/db/io.html) (`.io` classification as a country-code TLD)
- Namefi — [Registration Agreement](https://namefi.io/registration-agreement) (registrar, registry, policy, dispute, and legal layers)
- Namefi — [Terms of Service](https://namefi.io/tos) (platform and token-control terms)

---

## Summary

- A **TLD (top-level domain)** is the part of a domain after the last dot — `.com`, `.org`, `.io`, and so on. It's also called a domain extension.
- Read right to left, a domain breaks into **TLD → second-level domain → subdomain**.
- TLD labels include generic, country-code, sponsored, new generic, brand, and internationalized; several labels can apply to the same extension.
- TLDs are governed by **ICANN** and **IANA** at the top, **registries** that operate each ending, and **[registrars](/en/glossary/registrar/)** that sell names to you.
- Choosing a TLD is about trust, fit, cost, and — increasingly — whether it can be brought **on-chain** as a [tokenized domain](/en/blog/what-are-tokenized-domains/).

Ready to register or tokenize a domain across your favorite TLD? Visit [namefi.io](https://namefi.io) to get started.
