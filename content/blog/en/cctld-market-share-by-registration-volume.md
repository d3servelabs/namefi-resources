---
title: 'ccTLD Market Share by Registration Volume: Who Actually Runs the National Namespace?'
date: '2026-05-20'
language: en
tags: ['cctld', 'domains', 'market-analysis', 'registry']
authors: ['namefiteam']
draft: false
description: A look at which country-code top-level domains command the largest share of registrations worldwide, why the leaders differ from what most people expect, and what the volume numbers tell us about how the internet is actually used.
keywords: ['cctld market share', 'country code domains', '.cn', '.de', '.uk', '.tk', '.io', 'domain statistics', 'registry data', 'namefi']
---

When most people picture the internet, they picture `.com`. And in raw numbers, `.com` is still the largest top-level domain on the planet, with roughly 160 million names under management. But `.com` is a gTLD—a *generic* top-level domain. Shift the lens to **country-code TLDs (ccTLDs)**—the two-letter suffixes assigned to nations and territories under [ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html)—and the picture gets much more interesting, and much less predictable.

This post walks through which ccTLDs lead by registration volume, why the leaders are not who you would guess, and what those numbers reveal about how the internet is *actually used* in different parts of the world.

## The leaders, roughly ordered

Public registry data (from operators that publish counts, plus aggregator snapshots like [Verisign's Domain Name Industry Brief](https://www.verisign.com/en_US/domain-names/dnib/index.xhtml) and [nic.de](https://www.denic.de/en/know-how/statistics/)) puts the top tier of ccTLDs in roughly this order:

- **.cn (China)** — somewhere in the range of 20 million names. Largest ccTLD on most days.
- **.de (Germany)** — around 17 million. Run by DENIC; remarkably stable year over year.
- **.uk (United Kingdom)** — around 10 million across `.uk` and `.co.uk` combined.
- **.nl (Netherlands)** — about 6 million. Outsized for a country of 17 million people.
- **.ru (Russia)** — around 5 million, plus several million on `.рф` (the Cyrillic IDN equivalent).
- **.br (Brazil)** — around 5 million on `.com.br` and other second-levels.
- **.eu (European Union)** — around 3.5 million. Technically a "regional" ccTLD.
- **.it, .fr, .pl, .au, .ca** — each in the 3-4 million range.

Below that band, a long tail of country-code zones sit between hundreds of thousands and a couple of million.

## Why the leaders are not who you expect

A few patterns are worth pulling out.

### China and Germany dominate, not the U.S.

The U.S. has a ccTLD—`.us`—and almost nobody uses it. It sits well below a million active registrations. The American internet ran straight at `.com` from the start, and never looked back. So the world's largest economy is essentially absent from the ccTLD chart, and the actual ccTLD leaders end up being economies where the *local* extension carries strong brand trust: Germany (`.de`), the U.K. (`.co.uk`), the Netherlands (`.nl`), and China (`.cn`).

This is the single biggest reason ccTLD market share looks unfamiliar. The denominator is not "internet users." It is "internet users in places where the local extension actually means something."

### Some ccTLDs are not really used by their country

Several small-country ccTLDs are operated more like generic extensions, and most of their registrations come from outside the country.

- **.io** (British Indian Ocean Territory) — beloved by tech startups for "input/output" wordplay.
- **.tv** (Tuvalu) — leased to media and streaming brands.
- **.co** (Colombia) — marketed globally as a `.com` alternative.
- **.me** (Montenegro) — pronoun-friendly, popular for personal sites.
- **.ai** (Anguilla) — recently exploded thanks to the AI boom.
- **.tk** (Tokelau) — historically inflated by free-registration programs, since [discontinued](https://en.wikipedia.org/wiki/.tk).

These zones can show very large volume numbers, but the volume reflects *global branding demand*, not population or economic activity in the assigned country. Tuvalu has about 11,000 residents and one of the most-watched ccTLDs in the world.

### Free registration distorts the table

For most of the 2010s, Freenom offered free registrations on `.tk`, `.ml`, `.ga`, `.cf`, and `.gq`. At its peak, `.tk` alone was reported as having more registrations than `.de`. Industry observers consistently flagged that most of those names were either unused or actively abused for phishing. After [ICANN proceedings and registry takeovers](https://www.icann.org/en/system/files/files/proposed-renewal-tk-redelegation-12sep23-en.pdf), Freenom suspended new registrations, and the apparent market share evaporated. The lesson: registration *volume* and registration *value* are different metrics.

### Restricted ccTLDs stay small on purpose

Some ccTLDs have eligibility rules—you need a local address, a local company, a national ID. `.jp`, `.no`, `.fi`, and `.ch` fall in this category. They will never compete on raw volume with open zones, but the names that exist there are unusually clean: low abuse rates, low parking rates, and high renewal rates. If you want a registry whose volume number you can actually trust, restricted ccTLDs are a good place to look.

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

At Namefi we route registrations through multiple registrar back-ends across many of the ccTLDs above, including restricted ones with eligibility checks. Because we tokenize the ownership record on-chain rather than relying on a single registrar's account-level controls, the choice of extension becomes a routing decision rather than a lock-in decision. Want to start on `.io` and move the same brand identity to `.de` for a local market later? That is a transfer workflow we are designed to handle, not a migration project.

The deeper point: ccTLD market share is a story about *trust signals* on the open internet. The names people register tell you which extensions feel native in which markets. And those native extensions are not always the ones the volume tables put on top.

## Sources and further reading

- Verisign — [Domain Name Industry Brief](https://www.verisign.com/en_US/domain-names/dnib/index.xhtml), the most cited quarterly snapshot of the TLD market.
- DENIC — [Statistics for .de](https://www.denic.de/en/know-how/statistics/), the German registry's public dashboard.
- Nominet — [Statistics for .uk](https://www.nominet.uk/news/reports-statistics/) and policy.
- ICANN — [Centralized Zone Data Service](https://czds.icann.org/) for zone file access where available.
- ISO — [ISO 3166-1 country codes](https://www.iso.org/iso-3166-country-codes.html), the source of every ccTLD label.
