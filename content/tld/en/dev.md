---
title: 'What Is the .dev Domain? The Secure TLD for Developers'
date: '2026-06-15'
language: 'en'
priority: P1
tags: ['tld']
authors: ['namefiteam']
editors: ['victor-zhou']
draft: false
description: 'Learn who can register a .dev domain, what browser HSTS requires, and how to prepare certificates, subdomains, and renewal costs.'
keywords: ['Google Registry dev', 'HSTS preload', 'developer domain', 'register dev domain']
faqs:
  - question: "Can anyone register a .dev domain?"
    answer: "Yes. Google Registry lists .dev among its open TLDs. Registration still follows registry policies, reserved-name rules, availability, and registrar terms."
  - question: "Does a .dev domain affect SEO?"
    answer: "Google gives new generic TLDs no inherent ranking advantage or disadvantage. Choose .dev for its audience and name, rather than an expected ranking benefit."
  - question: "Why do .dev sites require HTTPS?"
    answer: "The .dev namespace is HSTS-preloaded. Browsers that enforce the preload list upgrade HTTP requests to HTTPS. Each website hostname needs working HTTPS and a trusted certificate."
  - question: "Who should register a .dev domain?"
    answer: "Developer portfolios, documentation, software tools, and open-source projects can use .dev. Choose a different name if your audience will not understand the suffix."
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/top-tlds-to-secure-for-your-startup/
  - /en/blog/top-tlds-to-secure-for-your-saas/
  - /en/blog/why-are-io-domains-expensive/
  - /en/blog/ai-vs-io-domain/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-basics/
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

The **.dev** domain is a [generic top-level domain](/en/glossary/gtld/) for developers, software projects, and technical teams. Google Registry operates .dev through Charleston Road Registry Inc., as its [FAQ](https://www.registry.google/faqs/) explains.

The main setup requirement concerns web browsing. Google includes the whole .dev namespace on the HSTS preload list. Browsers that enforce the list require HTTPS before they can display a .dev website. Domain registration alone does not configure hosting or issue a certificate. [Google Registry explains the requirement](https://www.registry.google/domains/dev/).

## .dev gives developer projects a recognizable address

| Fact | Detail |
| --- | --- |
| Type | Generic top-level domain |
| Operator | Charleston Road Registry Inc., also known as Google Registry |
| Delegation | December 18, 2014 |
| General availability | February 28, 2019 |
| Registration | Publicly available, subject to registry and registrar policies |
| Browser requirement | Working HTTPS for website hostnames |
| Common uses | Portfolios, documentation, tools, and technical blogs |

[IANA records the operator and delegation date](https://www.iana.org/domains/root/db/dev.html). Google Registry [opened general availability on February 28, 2019](https://www.registry.google/announcements/launch-details-for-dev/). IANA does not establish registration eligibility. Google Registry's [policy directory](https://www.registry.google/policies/) lists .dev among its open TLDs.

A portfolio such as `yourname.dev` signals a developer audience. A documentation site such as `docs.example.dev` can fit the same purpose. Google Registry showcases [web.dev, stripe.dev, and flutter.dev](https://www.registry.google/domains/dev/) as examples of developer-oriented use.

Choose .dev when the suffix makes sense to your readers. A general consumer business may need a name that needs less explanation. Compare [.app](/en/tld/app/) for an application brand and [.io](/en/tld/io/) for another technology-oriented option.

## Anyone can apply for an available .dev name under the registry rules

Google Registry describes the TLDs in its [policy directory](https://www.registry.google/policies/) as open and unrestricted. The [.dev registration policy](https://www.registry.google/policies/registration/dev/) does not impose a developer qualification or local-presence requirement.

Open registration still has conditions. The policy requires a clear HTTPS notice before purchase. Two-letter ASCII names must not falsely suggest a government or country-code manager affiliation. Registrants of protected IOC, Red Cross, and IGO names must represent the relevant organization. Availability and applicable abuse policies also matter.

A developer does not receive trademark rights merely by registering a domain. Check your proposed name before paying. Read the registrar's registration term, renewal conditions, transfer terms, and cancellation rules before checkout.

## HSTS requires HTTPS in supporting browsers, including on subdomains

HSTS controls browser transport. A browser with the relevant preload entry upgrades `http://example.dev` to HTTPS before sending an HTTP request. If HTTPS fails, the browser cannot fall back to an ordinary HTTP page. The [HSTS preload documentation](https://hstspreload.org/) explains the upgrade and failure behavior.

The requirement includes hostnames below the registered domain. Prepare HTTPS for `www.example.dev`, `docs.example.dev`, and any internal web hostname that users open in a browser. Each hostname needs a certificate that covers the hostname and that the client trusts. [The preload documentation explicitly includes internal subdomains](https://hstspreload.org/).

![A browser connects example.dev and docs.example.dev through TLS certificate checks to a web server.](../../assets/dev-01-https-setup.jpg)

HSTS does not issue certificates, configure DNS, or make application code secure. HSTS also does not authenticate email senders. Treat HTTPS as a transport requirement, rather than a promise that a website is trustworthy. Mozilla explains the [browser policy and certificate-error behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security).

A non-browser client may apply different transport rules. Check API clients and automation separately instead of assuming that browser preloading governs every protocol.

## A .dev launch needs DNS, certificates, and browser checks

1. Connect the domain to a hosting service that supports custom-domain HTTPS.
2. Add the [DNS](/en/glossary/dns/) records that the hosting service requires.
3. Complete domain validation and certificate issuance before announcing the site.
4. Check HTTPS on the apex domain and every web subdomain.
5. Test redirects through a browser that enforces the preload list.
6. Enable certificate renewal and monitor renewal failures.

A forwarding-only domain also needs HTTPS at the forwarding endpoint. A browser must establish HTTPS before the server can return a redirect. Do not assume that an HTTP forwarding service will work for .dev.

For a private development hostname, plan trusted local certificates before choosing a .dev address. A hosts-file entry changes name resolution. A hosts-file entry does not remove the browser's inherited HSTS rule.

## The renewal quote matters more than a first-year promotion

Google Registry's [.dev pricing policy](https://www.registry.google/policies/pricing/dev/) distinguishes standard registration, premium registration, renewal, transfer, and restoration fees. Registry fees and the retail amount a registrar charges are different.

Check the exact name at checkout. Compare the first term, renewal quote, included services, taxes, and any premium classification. Do not assume that a promotional registration price continues at renewal. This page does not quote a live price.

## Google gives .dev no automatic search-ranking advantage

Google says its systems generally treat [new generic TLDs like other generic TLDs](https://developers.google.com/search/blog/2015/07/googles-handling-of-new-top-level). A keyword in the suffix does not create an inherent ranking advantage or disadvantage.

Choose .dev for a clear developer identity and a suitable available name. Plan useful content and a reliable website separately. Google's ownership of the registry does not promise favorable search treatment.

## Namefi lets you check a proposed .dev name

Search for the exact name on [Namefi](https://namefi.io). Review availability, registration terms, and renewal details before purchase. Then connect the domain to your host and complete the HTTPS setup before sharing the address.

## Readers often ask these .dev questions

### Can anyone register a .dev domain?

Yes. Google Registry lists .dev among its open TLDs. Registration still follows registry policies, reserved-name rules, availability, and registrar terms.

### Does a .dev domain affect SEO?

Google gives new generic TLDs no inherent ranking advantage or disadvantage. Choose .dev for its audience and name, rather than an expected ranking benefit.

### Why do .dev sites require HTTPS?

The .dev namespace is HSTS-preloaded. Browsers that enforce the preload list upgrade HTTP requests to HTTPS. Each website hostname needs working HTTPS and a trusted certificate.

### Who should register a .dev domain?

Developer portfolios, documentation, software tools, and open-source projects can use .dev. Choose a different name if your audience will not understand the suffix.

## These sources explain the registry rules and browser behavior

Sources checked on October 21, 2026 (America/Los_Angeles):

- [Google Registry: .dev overview and examples](https://www.registry.google/domains/dev/).
- [Google Registry: open TLD policy directory](https://www.registry.google/policies/).
- [Google Registry: .dev registration policy](https://www.registry.google/policies/registration/dev/).
- [Google Registry: .dev pricing policy](https://www.registry.google/policies/pricing/dev/).
- [IANA: .dev operator and delegation](https://www.iana.org/domains/root/db/dev.html).
- [HSTS preload documentation](https://hstspreload.org/).
- [Mozilla: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security).
- [Google Search Central: new TLD treatment](https://developers.google.com/search/blog/2015/07/googles-handling-of-new-top-level).
