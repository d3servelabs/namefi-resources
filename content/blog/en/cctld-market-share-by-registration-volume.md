---
title: 'ccTLD Market Share by Registration Volume: Who Actually Runs the National Namespace?'
date: '2026-05-01'
language: en
tags: ['cctld', 'domains', 'market-analysis', 'registry']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
format: analysis
description: A look at which country-code top-level domains command the largest share of registrations worldwide, why the leaders differ from what most people expect, and what the volume numbers tell us about how the internet is actually used.
ogImage: ../../assets/cctld-market-share-by-registration-volume-og.jpg
keywords: ['cctld market share', 'country code domains', '.cn', '.de', '.uk', '.tk', '.io', 'domain statistics', 'registry data', 'namefi']
---

When most people picture the internet, they picture `.com`. And in raw numbers, `.com` is still the largest [top-level domain](/en/glossary/tld/) on the planet, with roughly 160 million names under management. But `.com` is a [gTLD](/en/glossary/gtld/)—a *generic* top-level domain. Shift the lens to **country-code TLDs (ccTLDs)**—the two-letter suffixes assigned to nations and territories under [ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html)—and the picture gets much more interesting, and much less predictable.

This post walks through which ccTLDs lead by registration volume, why the leaders are not who you would guess, and what those numbers reveal about how the internet is *actually used* in different parts of the world.

## The leaders, roughly ordered

Public registry data (from operators that publish counts, plus aggregator snapshots like [DNIB's Q1 2026 Domain Name Industry Brief](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.) and [DENIC's .de statistics](https://www.denic.de/en/products/statistics-about-de/)) puts the top tier of ccTLDs in roughly this order:

- **.cn (China)** — somewhere in the range of 20 million names. Largest [ccTLD](/en/glossary/cctld/) on most days.
- **.de (Germany)** — around 17 million. Run by DENIC; remarkably stable year over year.
- **.uk (United Kingdom)** — around 10 million across `.uk` and `.co.uk` combined.
- **.nl (Netherlands)** — about 6 million. Outsized for a country of 17 million people.
- **.ru (Russia)** — around 5 million, plus several million on `.рф` (the Cyrillic IDN equivalent).
- **.br (Brazil)** and **.fr (France)** — each around the next large tier, with `.br` concentrated heavily under `.com.br`.
- **.au (Australia)**, **.in (India)**, and **.eu (European Union)** — each in the next tier; `.eu` is technically a regional ccTLD rather than a single-country namespace.
- **.it, .pl, .ca** — important national namespaces that sit just outside or near the current top-10 band depending on the reporting period and source.

Below that band, a long tail of country-code zones sit between hundreds of thousands and a couple of million.

## Why the leaders are not who you expect

A few patterns are worth pulling out.

### China and Germany dominate, not the U.S.

The U.S. has a ccTLD—`.us`—and almost nobody uses it. It sits well below a million active registrations. The American internet ran straight at `.com` from the start, and never looked back. So the world's largest economy is essentially absent from the ccTLD chart, and the actual ccTLD leaders end up being economies where the *local* extension carries strong brand trust: Germany (`.de`), the U.K. (`.co.uk`), the Netherlands (`.nl`), and China (`.cn`).

This is the single biggest reason ccTLD market share looks unfamiliar. The denominator is not "internet users." It is "internet users in places where the local extension actually means something."

### Some ccTLDs are not really used by their country

Several small-country ccTLDs are operated more like generic extensions, and most of their registrations come from outside the country.

- **[.io](/en/tld/io/)** (British Indian Ocean Territory) — beloved by tech startups for "input/output" wordplay.
- **[.tv](/en/tld/tv/)** (Tuvalu) — leased to media and streaming brands.
- **[.co](/en/tld/co/)** (Colombia) — marketed globally as a `.com` alternative.
- **[.me](/en/tld/me/)** (Montenegro) — pronoun-friendly, popular for personal sites.
- **[.ai](/en/tld/ai/)** (Anguilla) — recently exploded thanks to the AI boom.
- **.tk** (Tokelau) — historically inflated by free-registration programs, since [discontinued](https://en.wikipedia.org/wiki/.tk).

These zones can show very large volume numbers, but the volume reflects *global branding demand*, not population or economic activity in the assigned country. Tuvalu has about 11,000 residents and one of the most-watched ccTLDs in the world.

### Free registration distorts the table

For most of the 2010s, Freenom offered free registrations on `.tk`, `.ml`, `.ga`, `.cf`, and `.gq`. At its peak, `.tk` alone was reported as having more registrations than `.de`. Industry observers consistently flagged that most of those names were either unused or actively abused for [phishing](/en/glossary/phishing/). After [ICANN proceedings and registry takeovers](https://www.icann.org/en/system/files/files/proposed-renewal-tk-redelegation-12sep23-en.pdf), Freenom suspended new registrations, and the apparent market share evaporated. The lesson: registration *volume* and registration *value* are different metrics.

### Restricted ccTLDs stay small on purpose

Some ccTLDs have eligibility rules—you need a local address, a local company, a national ID. `.jp` and `.no` fall squarely in this category: JPRS requires a permanent postal address in Japan for `.jp`, and Norid requires Norwegian identity or organization eligibility plus a Norwegian mailing address for `.no`. `.fi` is a useful counterexample: Traficom now allows companies, organizations, and private persons to register regardless of domicile. Restricted zones will never compete on raw volume with fully open zones, but the names that exist there are often unusually clean: low abuse rates, low parking rates, and high renewal rates. If you want a [registry](/en/glossary/registry/) whose volume number you can actually trust, restricted ccTLDs are a good place to look.

## Volume vs. value: what the numbers do and don't tell you

ccTLD ranking by registration count is the most-cited statistic, and also the most-misunderstood. A more honest picture comes from looking at three numbers together:

- **Total registrations** — the headline figure.
- **Renewal rate** — what fraction of names are still around a year later. Healthy zones sit at 75-85%. Speculative or free-tier zones can sit below 50%.
- **Use rate** — what fraction of names actually resolve to a website, MX record, or other live service. This is harder to measure, but registry transparency reports and third-party crawls (e.g., [DomainTools](https://www.domaintools.com/resources/blog/), [SecurityTrails](https://securitytrails.com/blog)) publish estimates.

A ccTLD with 20 million names and a 50% renewal rate is, in a meaningful sense, smaller than a ccTLD with 6 million names and an 88% renewal rate. The first is churn; the second is *installed base*.

## What this means if you are choosing a domain

For builders, the practical takeaways are:

- **`.com` is still the default global brand extension.** It is the only TLD that no one ever has to spell out.
- **A local ccTLD beats `.com` for local-market trust** in countries where the ccTLD is dominant—Germany, the Netherlands, the U.K., Czechia, Poland. In those markets, users actively prefer the local extension.
- **Small-country ccTLDs operated globally** (`.io`, `.ai`, `.co`, `.me`) are gTLDs in everything but name. Treat them like brand decisions, not jurisdictional ones, and read the [registry's policy](https://www.icann.org/resources/pages/registries-listing-2012-02-25-en) so you know what happens if the operator changes.
- **Registration volume is not a quality signal.** It is mostly a marketing signal. Renewal rate is the number worth asking for.

## How Namefi thinks about this

At Namefi we route registrations through multiple [registrar](/en/glossary/registrar/) back-ends across many of the ccTLDs above, including restricted ones with eligibility checks. Because we [tokenize](/en/glossary/tokenize/) the ownership record [on-chain](/en/glossary/on-chain/) rather than relying on a single registrar's account-level controls, the choice of extension becomes a routing decision rather than a lock-in decision. Want to start on `.io` and move the same brand identity to `.de` for a local market later? That is a transfer workflow we are designed to handle, not a migration project.

The deeper point: ccTLD market share is a story about *trust signals* on the open internet. The names people register tell you which extensions feel native in which markets. And those native extensions are not always the ones the volume tables put on top.

## Sources and further reading

- Verisign — [Domain Name Industry Brief](https://www.verisign.com/en_US/domain-names/dnib/index.xhtml), the most cited quarterly snapshot of the TLD market.
- DNIB — [Q1 2026 Domain Name Industry Brief](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.), the current top-10 ccTLD ordering used above.
- DENIC — [Statistics for .de](https://www.denic.de/en/know-how/statistics/), the German registry's public dashboard.
- Nominet — [Statistics for .uk](https://www.nominet.uk/news/reports-statistics/) and policy.
- JPRS — [.jp registration eligibility](https://jprs.co.jp/en/jpdomain.html#:~:text=Any%20individual%2C%20group%20or%20organization%20having%20a%20permanent%20postal%20address%20in%20Japan%20is%20eligible%20for%20registration.).
- Norid — [.no general requirements](https://teknisk.norid.no/en/administrere-domenenavn/generelle-krav/#:~:text=must%20have%20a%20mailing%20address%20in%20Norway).
- Traficom — [.fi registration eligibility](https://traficom.fi/en/fi-domains/applying-and-using-fi-domains/how-get-fi-domain-name#:~:text=Companies%2C%20organisations%20and%20private%20persons%2C%20regardless%20of%20their%20domicile%2C%20can%20all%20have%20fi%2Ddomain%20names%20registered%20for%20them.).
- ICANN — [Centralized Zone Data Service](https://czds.icann.org/) for zone file access where available.
- ISO — [ISO 3166-1 country codes](https://www.iso.org/iso-3166-country-codes.html), the source of every ccTLD label.
