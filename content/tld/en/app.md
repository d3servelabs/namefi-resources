---
title: 'What Is a .app Domain? The HTTPS-Secure TLD Explained'
date: '2026-06-15'
language: 'en'
tags: ['tld']
authors: ['namefiteam']
draft: false
description: 'The .app domain is Google Registry''s gTLD for software and apps, with HTTPS required on every site. Learn who it suits, how it ranks, and how to register one.'
keywords: ['.app domain', 'what is .app', '.app TLD', '.app domains', 'app domain extension', 'Google Registry .app', '.app HTTPS required', 'register .app domain', 'developer domains']
faqs:
  - question: 'Can anyone register a .app domain?'
    answer: 'Yes. The .app TLD is an open generic top-level domain with no eligibility restrictions, so anyone can register an available name. The one practical condition is technical, not legal: a .app site needs a valid HTTPS certificate to load in browsers.'
  - question: 'Does a .app domain affect SEO?'
    answer: 'Google treats .app as a standard generic gTLD with no inherent ranking advantage or penalty. Because .app forces HTTPS, you automatically meet Google''s secure-connection best practice, which is a lightweight positive signal.'
  - question: 'Who should register a .app domain?'
    answer: 'Mobile app makers, SaaS and web-app builders, and developers showcasing projects are the natural fit. The suffix reads as "this is a working application," making it ideal for product hubs, download pages, and login portals.'
  - question: 'Why does a .app domain require HTTPS?'
    answer: 'Google Registry added the entire .app zone to the browser HSTS preload list before launch. Browsers therefore upgrade every .app request to HTTPS automatically, so the domain will not load without a valid TLS certificate. You cannot opt out.'
  - question: 'Does .app support WHOIS privacy?'
    answer: 'Yes. As a generic gTLD, .app supports standard registrar WHOIS privacy or proxy services, and most personal registrant data is already redacted in public WHOIS output under current ICANN policy.'
relatedArticles:
  - /en/blog/top-tlds-to-secure-for-your-startup/
  - /en/blog/top-tlds-to-secure-for-your-saas/
  - /en/blog/what-is-a-tld/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/ai-vs-io-domain/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/best-tlds-by-industry/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/tld/
  - /en/glossary/icann/
  - /en/glossary/registry/
  - /en/glossary/dns/
---

The **.app** domain is a [generic top-level domain](/en/glossary/gtld/) (gTLD) built for the one corner of the web everyone now lives in: software. Operated by Google Registry, it carries a clear, universally understood meaning, and it is best known for one defining rule: every .app site must be served over HTTPS. If you build mobile apps, web apps, or developer tools, a `.app` address tells visitors exactly what they are about to open before they click.

This page covers what makes .app different from generic extensions like .com, who actually uses it, how Google treats it for ranking, the registration rules, and how to register one at Namefi.

## .app at a glance

| Fact | Detail |
| --- | --- |
| TLD type | Generic top-level domain (gTLD) |
| Registry operator | Charleston Road Registry Inc. (Google Registry) |
| Year launched | Delegated 2015; general availability May 2018 |
| IDN support | Yes |
| DNSSEC | Supported |
| Registration restrictions | Open to all — no eligibility gating; valid HTTPS certificate required for the site to load |
| Best for | Mobile apps, SaaS/web apps, developer projects |

## What is .app?

The word "app" needs no translation: it is global shorthand for an application, whether on a phone, in a browser, or on a desktop. That makes .app one of the most self-explanatory new gTLDs available. A name like `getproduct.app` communicates "functional software" instantly, in a way `getproduct.com` cannot.

.app is a generic gTLD, not a country-code TLD, so it carries no geographic association. According to [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/managing-multi-regional-sites), [new gTLD](/en/glossary/new-gtld/)s like .app are treated as generic by default and are not tied to any single country for geo-targeting — your audience can be global. You can confirm its delegation and operator details on the [IANA root-zone entry for .app](https://www.iana.org/domains/root/db/app.html).

The defining technical fact about .app is its security model. It was the first TLD made available for general registration with **HTTPS enforced for every site**, baked in at the registry level via the HSTS preload list. We cover the practical consequences in the eligibility and reputation sections below.

## History of .app

Charleston Road Registry Inc. applied for .app during ICANN's new-gTLD program. The string was contested by multiple applicants, and Google won it at a 2015 ICANN [auction](/en/glossary/auction/) with a reported bid of around $25 million — at the time one of the highest amounts paid for a new gTLD. [IANA](/en/glossary/iana/) records show the delegation completed in 2015.

The namespace opened to the public in 2018. After a sunrise period for [trademark](/en/glossary/trademark/) holders and an early-access window with descending fees, .app reached general availability in May 2018, when anyone could register an available name at standard pricing. Google marketed it as the first TLD with built-in HTTPS security to launch for general registration. It has since become a recognizable home for app-related products, though it remains niche relative to legacy extensions.

## How people use .app

- **Mobile app landing pages** — a central hub for App Store and Google Play links, release notes, and support, e.g. `yourapp.app`.
- **Web apps and SaaS** — the product interface and login surface, often kept separate from a marketing `.com`.
- **Developer portfolios and side projects** — `name.app` or `project.app` to show working tools rather than a static résumé.
- **Documentation, status, and API portals** — dedicated `.app` subsites for docs and uptime pages.
- **Product launches** — concise, brandable names that are still findable, unlike the saturated short-`.com` market.

**Who it's not ideal for:** content-first sites (blogs, news, editorial), local brick-and-mortar businesses that benefit from a familiar `.com`, or any project unwilling or unable to serve over HTTPS — a `.app` site simply will not load without a valid certificate.

## Notable sites using .app

- **cash.app** — Block's peer-to-peer payments service, the highest-profile .app brand, with name and URL perfectly aligned.
- **google.app** — Google Registry, the operator itself, uses the namespace for projects and redirects.
- **ohdear.app** — a well-known website-monitoring service that Google Registry has featured as a flagship .app site.

These are products that handle real users, logins, and payments — a reasonable signal that .app is trusted for serious applications, not just experiments.

## .app vs other domains

| | .app | [.com](/en/tld/com) | [.dev](/en/tld/dev) | [.io](/en/tld/io) |
| --- | --- | --- | --- | --- |
| Meaning | Application / software | Generic, universal | Developer / engineering | Tech / startup connotation |
| Registry | Google Registry | Verisign | Google Registry | Identity Digital |
| HTTPS enforced | Yes (HSTS preload) | No | Yes (HSTS preload) | No |
| Availability of short names | Good | Very poor | Good | Moderate |

Choose **.app** when the thing you are publishing is itself an application and you want the URL to say so. Choose **[.com](/en/tld/com)** when broad familiarity outweighs descriptiveness. Choose **[.dev](/en/tld/dev)** for developer tooling and engineering audiences, and **[.io](/en/tld/io)** when you want a general tech-startup feel. Both .app and [.dev](/en/tld/dev) share the same registry and the same mandatory-HTTPS model.

## Why choose .app?

- **Built-in security.** Enforced HTTPS via HSTS preload means there is no "I forgot to enable SSL" failure mode, and visitors never hit an insecure-page warning.
- **Instant meaning.** The suffix describes the product, which is rare among extensions and useful for click-through and recall.
- **Availability.** Short, one-word names that are long gone in `.com` are still attainable in .app.
- **Generic, global treatment.** No country lock-in, so it suits an international audience.

## Things to consider

- **HTTPS is mandatory, not optional.** You must configure a valid TLS certificate before the site will resolve in any modern browser. This is trivial on hosts like Vercel, Netlify, Cloudflare, or GitHub Pages, but it is a hard requirement.
- **Lower baseline familiarity than .com.** Some non-technical users still default to typing `.com`, so a `.app` brand may want to defend the matching `.com` if it is available.
- **Narrower meaning.** The suffix's strength — "this is an app" — is also a limit: it fits software and products, but reads oddly for a blog, a charity, or a local shop.
- **Single-operator namespace.** Both .app and .dev are run by Google Registry, so policy and roadmap decisions sit with one operator.

## Who can register a .app domain?

**Registration restrictions: open to all.** .app is an unrestricted generic gTLD. There is no credential, membership, industry, or local-presence requirement — anyone, anywhere can register an available name. The only real condition is technical: because the zone is on the HSTS preload list, a .app domain will not display in a browser until you attach a valid HTTPS certificate. You can buy and own the name without one, but it will not resolve as a website.

Standard gTLD policies apply otherwise: a sunrise phase ran at launch for trademark holders, IDN names and DNSSEC are supported, and registrars offer [WHOIS privacy](/en/glossary/whois-privacy/) or proxy services (with most personal data already redacted under current ICANN policy). Transfers, renewals, and the redemption [grace period](/en/glossary/grace-period/) follow ordinary gTLD rules. The authoritative governing document is the [ICANN Registry Agreement for .app](https://www.icann.org/en/registry-agreements/details/app); launch and policy details are published by [Google Registry](https://www.registry.google/).

## .app pricing and value

This static page lists no prices, but here is how .app pricing behaves. .app sits in the standard new-gTLD tier rather than the budget bracket, priced comparably to other premium-feel suffixes. Expect **first-year and renewal pricing to differ**, and remember that renewals recur for as long as you hold the name, so budget for the ongoing rate. A subset of short, dictionary, or otherwise desirable names are classified as **premium** and carry higher registry-set fees. The drivers of cost are name length, keyword desirability, and premium status — the extension itself, not any promotion, sets the floor.

## Reputation and email deliverability

.app is perceived as **modern, secure, and developer-credible** rather than cheap or spammy. Two factors help: it is run by Google, and its mandatory-HTTPS model means there is no such thing as an insecure .app site, which discourages some throwaway abuse patterns common to ultra-cheap TLDs.

That said, newer gTLDs sometimes draw slightly more cautious spam-filter treatment than long-established extensions, simply because they have a shorter track record. If you send email from a .app domain, the mitigation is the same as for any domain: publish correct **SPF, DKIM, and DMARC** records, warm up volume gradually, and keep your list clean. Done properly, .app deliverability is on par with mainstream extensions.

## Branding and naming tips

The cleanest .app names are ones where "app" completes the brand, not just trails it — `cash.app` works because the result reads as a phrase. Use it when the suffix adds meaning (`tracker.app`, `notes.app`) rather than fighting it. Keep names short and easy to dictate aloud, since "dot app" is unambiguous to say. If your audience is non-technical, consider securing the matching `.com` as a safety net for direct-type traffic. Hyphens and tricky spellings hurt recall here just as anywhere.

## How to register a .app domain at Namefi

1. Search your desired name on [Namefi](https://namefi.io) to check .app availability.
2. Choose the name and confirm whether it is a standard or premium registration.
3. Register, then point the domain at your host and ensure HTTPS is configured so the site loads.

Namefi is an [ICANN-accredited registrar](/en/glossary/accredited-registrar/) with transparent pricing, and it bridges Web2 and [Web3](/en/glossary/web3/): you can register a .app and optionally mint it as an on-chain asset (an NFT) for easier transfer and trading, while keeping full ICANN-compliant ownership and fast DNS. To understand tokenization first, see [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains)

[Register your .app domain at Namefi](https://namefi.io)

## Frequently asked questions

### Can anyone register a .app domain?

Yes. The .app TLD is an open generic top-level domain with no eligibility restrictions, so anyone can register an available name. The one practical condition is technical, not legal: a .app site needs a valid HTTPS certificate to load in browsers.

### Does a .app domain affect SEO?

Google treats .app as a standard generic gTLD with no inherent ranking advantage or penalty. Because .app forces HTTPS, you automatically meet Google's secure-connection best practice, which is a lightweight positive signal.

### Who should register a .app domain?

Mobile app makers, SaaS and web-app builders, and developers showcasing projects are the natural fit. The suffix reads as "this is a working application," making it ideal for product hubs, download pages, and login portals.

### Why does a .app domain require HTTPS?

Google Registry added the entire .app zone to the browser HSTS preload list before launch. Browsers therefore upgrade every .app request to HTTPS automatically, so the domain will not load without a valid TLS certificate. You cannot opt out.

### Does .app support WHOIS privacy?

Yes. As a generic gTLD, .app supports standard registrar WHOIS privacy or proxy services, and most personal registrant data is already redacted in public WHOIS output under current ICANN policy.

## Related resources

- [.dev domain](/en/tld/dev) — the sibling Google Registry gTLD with the same mandatory-HTTPS model.
- [.com domain](/en/tld/com) — the universal default to compare against.
- [.io domain](/en/tld/io) and [.tech domain](/en/tld/tech) — other tech-leaning extensions.
- [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains) — how registering with Namefi lets you mint a domain on-chain.
- [Domain Terminology Guide](/en/blog/domain-terminology-guide) — definitions for gTLD, DNSSEC, and more.
- Glossary: [ICANN](/en/glossary/icann), [registrar](/en/glossary/registrar), [DNS](/en/glossary/dns), [DNSSEC](/en/glossary/dnssec).
