---
title: 'What Is the .sh Domain? Saint Helena Meets Shell Scripts'
date: '2026-08-05'
language: 'en'
priority: P1
tags: ['tld']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'The .sh domain is the ccTLD of Saint Helena, embraced by developers as the shell-script extension. Who runs it, registration rules, notable sites, trade-offs.'
keywords: ['.sh shell script domain', 'Saint Helena ccTLD', 'NIC.SH registry rules', '.sh vs .io', 'brew.sh ohmyz.sh bun.sh']
faqs:
  - question: 'Can anyone register a .sh domain?'
    answer: 'Yes, at the second level. NIC.SH policy states that an applicant may reside in any legal jurisdiction, so anyone worldwide can register name.sh. Only third-level names such as co.sh or org.sh are restricted to Saint Helena residents, who can claim them free of charge.'
  - question: 'Does a .sh domain affect SEO?'
    answer: 'Google does not include .sh on its published list of ccTLDs treated as generic, so by default it can be read as targeting Saint Helena. In practice you can shape your international audience through content language, hreflang, and where you earn links, but a globally neutral extension avoids the question entirely.'
  - question: 'Who runs the .sh domain?'
    answer: 'IANA lists the Government of Saint Helena as the sponsor and Internet Computer Bureau Ltd as the registry operator, running the NIC.SH registry. Internet Computer Bureau was acquired by Afilias in 2017 alongside .io and .ac, and Afilias later became part of Identity Digital.'
  - question: 'Why do developer tools use .sh domains?'
    answer: 'Because .sh is also the file extension for Unix shell scripts, the suffix reads as a command-line in-joke. Projects such as Homebrew at brew.sh, Oh My Zsh at ohmyz.sh, and the Bun runtime at bun.sh use it to signal a terminal-native developer audience.'
relatedArticles:
  - /en/blog/what-is-a-tld/
  - /en/blog/domain-hacks-explained/
  - /en/blog/cctld-market-share-by-registration-volume/
  - /en/blog/domain-terminology-guide/
  - /en/blog/what-are-tokenized-domains/
relatedTopics:
  - /en/topics/choosing-a-tld/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/best-tlds-by-industry/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/cctld/
  - /en/glossary/domain-hack/
  - /en/glossary/registry/
  - /en/glossary/dnssec/
  - /en/glossary/registrar/
---

The **.sh domain** is the [country-code top-level domain](/en/glossary/cctld/) (ccTLD) of **Saint Helena, Ascension and Tristan da Cunha** — a remote British Overseas Territory in the South Atlantic — that found a global second life because `.sh` is also the file extension of a Unix **shell script**. Every developer who has typed `install.sh` already knows the suffix, which is why tools like Homebrew, Oh My Zsh, and Bun built their homes on it. This page covers who runs .sh, its unusual two-tier registration policy, how Google treats it, and the honest trade-offs.

## .sh at a glance

| Fact | Detail |
| --- | --- |
| TLD type | Country-code TLD (ccTLD) for Saint Helena, Ascension and Tristan da Cunha (ISO 3166-1 code SH) |
| Registry operator | Internet Computer Bureau Ltd (NIC.SH), part of Identity Digital; sponsor: Government of Saint Helena |
| Year introduced | 1997 |
| IDN support | — |
| DNSSEC | Supported — the .sh zone is signed, with DS records published in the root |
| Registration restrictions | **Second level open to all** — any legal jurisdiction; **third level (.co.sh, .org.sh, etc.) restricted to Saint Helena residents**, free of charge |
| Best for | Developer tools, CLIs, terminal-native brands, short command-style names |

## What is .sh?

.sh is the ccTLD assigned to **Saint Helena, Ascension and Tristan da Cunha** under the ISO 3166-1 two-letter country-code system. The [IANA root-zone entry for .sh](https://www.iana.org/domains/root/db/sh.html) records the **Government of St. Helena** as the sponsoring organization and **Internet Computer Bureau Ltd** as the registry operator, running the registry at NIC.SH.

Its cultural meaning, though, has little to do with the island. In Unix and Linux, `sh` is the Bourne shell and `.sh` the conventional extension for shell scripts — so a .sh domain reads to any developer like an executable command. That coincidence turned a tiny-territory ccTLD into a niche favorite for command-line tools, the repurposing path also taken by [.io](/en/tld/io/) ("input/output") and [.ai](/en/tld/ai/) ("artificial intelligence").

One nuance separates .sh from those neighbors: **Google's published list of ccTLDs it treats as generic** — which includes .io, [.co](/en/tld/co/), [.me](/en/tld/me/), [.tv](/en/tld/tv/), and [.fm](/en/tld/fm/) — [does not include .sh](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=en#:~:text=Google%20treats%20some%20ccTLDs%20%28such%20as%20.tv%20and%20.me%29%20as%20gTLDs). By default, then, .sh can be read as geo-targeted to Saint Helena rather than globally neutral (more under "Things to consider").

## History of .sh

.sh was introduced in **1997**, administered from the start by the UK-based **Internet Computer Bureau (ICB)** on behalf of the Government of Saint Helena — the same small company that operated .io for the British Indian Ocean Territory and .ac for Ascension Island.

The pivotal corporate event came in **April 2017**, when registry giant **Afilias** [paid $70.17 million in cash](https://domainincite.com/23650-afilias-bought-io-for-70-million#:~:text=%2470.17%20million%20cash) for ICB and its three ccTLDs — a deal driven overwhelmingly by .io's developer-market boom, with .sh and .ac riding along. Afilias was in turn acquired by Donuts in 2020, and the combined company [rebranded as Identity Digital](https://identity.digital/company) — so one of the internet's smallest-territory ccTLDs is now operated within one of its largest registry groups. Meanwhile developers kept adopting the suffix organically: as `curl | sh` installer culture spread through open source, a .sh homepage became a natural fit for tools whose entire onboarding is a shell one-liner.

## How people use .sh

- **Package managers and installers** — projects whose first user interaction is a shell script, like Homebrew at [brew.sh](https://brew.sh/).
- **Shell frameworks** — Oh My Zsh lives at [ohmyz.sh](https://ohmyz.sh/), a literal [domain hack](/en/glossary/domain-hack/) spelling the name across the dot.
- **Runtimes and developer platforms** — the Bun JavaScript runtime ships from [bun.sh](https://bun.sh/).
- **CLI-first startups** — a short `verb.sh` name doubles as branding and an install mnemonic.
- **Names ending in "-sh"** — completing a word across the dot, the trick del.icio.us made famous for [.us](/en/tld/us/).
- **Saint Helena itself** — the island's government and residents use the reserved third-level space (.gov.sh, .co.sh, .edu.sh).

**Who it's not ideal for:** consumer brands whose audience has never opened a terminal, and projects that need an unambiguous global-generic SEO posture out of the box.

## Notable sites using .sh

- **[brew.sh](https://brew.sh/)** — official homepage of **Homebrew**, the hugely popular package manager for macOS and Linux, whose canonical install command is itself a shell script.
- **[ohmyz.sh](https://ohmyz.sh/)** — home of **Oh My Zsh**, the community-driven Zsh configuration framework with over 300 plugins.
- **[bun.sh](https://bun.sh/)** — the **Bun** JavaScript runtime, package manager, bundler, and test runner, a prominent modern toolchain.

These three anchor the pattern: .sh's flagship tenants are open-source and infrastructure tools whose users live in the shell.

## .sh vs other domains

| Factor | .sh | [.io](/en/tld/io/) | [.dev](/en/tld/dev/) |
| --- | --- | --- | --- |
| Type | ccTLD (Saint Helena) | ccTLD (British Indian Ocean Territory) | gTLD (Google Registry) |
| Developer connotation | Shell scripts / CLI | Input/output, startups | Developers broadly |
| On Google's generic-ccTLD list | No | Yes | N/A (gTLD, generic by nature) |
| Registration | Open worldwide (2nd level) | Open worldwide | Open, but HTTPS required (HSTS-preloaded) |
| Short-name availability | Good | Scarcer, competitive | Moderate |

Pick **.io** for a startup-flavored name with Google's explicit generic treatment; pick **.dev** for a broadly developer-branded site on a secure modern gTLD; pick **.sh** when your product genuinely lives in the terminal and the shell-script pun does branding work for you.

## Why choose .sh?

- **Built-in meaning for your exact audience.** No other TLD says "command line" as precisely.
- **Flagship neighbors.** Sharing an extension with Homebrew, Oh My Zsh, and Bun lends instant category recognition.
- **Better availability than .io or .com.** The zone is far smaller, so short, clean names are often still open.
- **Open registration.** At the second level there is no residency, credential, or paperwork requirement.
- **DNSSEC-signed zone** for stronger [DNS](/en/glossary/dns/) integrity.

## Things to consider

- **Default geo-targeting ambiguity.** Because .sh is absent from Google's generic-ccTLD list, it can be treated as targeting Saint Helena by default. International SEO signals (content language, hreflang, link profile) still let global .sh sites rank, but it is one more thing to manage.
- **Content restrictions exist.** NIC.SH rules prohibit using a .sh name for any purpose that is "sexual or pornographic or that is against the statutory laws of any Nation," and spam leads to suspension — stricter language than open gTLDs carry.
- **A territory-tied namespace.** Like all ccTLDs, .sh answers to its territory's government and chosen [registry](/en/glossary/registry/) operator, not a standardized ICANN gTLD contract.
- **Niche legibility.** Outside developer circles, .sh carries no meaning and may read as a typo of .shop or .show.

## Who can register a .sh domain?

**Registration restrictions: two tiers, very different rules.**

- **Second-level names (`yourname.sh`) are open to everyone.** The [NIC.SH registration rules](https://www.nic.sh/rules.htm#:~:text=An%20applicant%20may%20reside%20in%20any%20legal%20jurisdiction) state plainly that "an applicant may reside in any legal jurisdiction." Names are allocated first come, first served, and registrants must supply accurate, verifiable contact details.
- **Third-level names (`.co.sh`, `.com.sh`, `.net.sh`, `.nom.sh`, `.org.sh`, `.gov.sh`, `.edu.sh`) are reserved for Saint Helena.** A third-level applicant "must be resident in the St. Helena Island," with at least one nameserver physically on the island. Remarkably, the registry offers these [free of charge to Saint Helena residents and companies](https://www.nic.sh/free-domain-for-saint-helena-residents.htm) — individuals qualify with a British Overseas Territories passport for Saint Helena, companies with a local company-registry certificate; .gov.sh and .edu.sh are limited to recognized government and educational institutions.

Single-letter .sh names are reserved, and policy requires working nameservers at registration time. The zone supports [DNSSEC](/en/glossary/dnssec/), [WHOIS privacy](/en/glossary/whois-privacy/) handling depends on your [registrar](/en/glossary/registrar/), and the authoritative policy source is the [NIC.SH rules page](https://www.nic.sh/rules.htm).

## .sh pricing and value

.sh is priced as a boutique ccTLD rather than a commodity extension, and the usual dynamics apply: **first-year and renewal pricing can differ**, short or high-demand strings may carry premium fees, and registrar margin varies. The paradoxical bargain sits at the third level — for actual Saint Helena residents, names under .co.sh and its siblings are free. This page quotes no figures; check live pricing when you register.

## Reputation and email deliverability

.sh has a **strong niche reputation**: its most visible tenants are respected open-source projects, so within the developer world the suffix signals craft rather than spam, and registry policy explicitly makes spamming grounds for suspension or deletion. For email, the TLD itself is rarely the deciding factor — mailbox providers weigh **SPF, DKIM, DMARC, and sender reputation** far more heavily than the suffix. A properly authenticated .sh sender should deliver normally; the main consideration is audience legibility.

## Branding and naming tips

- **Make the name a command.** The best .sh names read like something you'd type: a short verb or tool name that doubles as your install mnemonic.
- **Complete a word across the dot.** English words ending in "-sh" (*wa.sh*, *cra.sh*, *fla.sh* patterns) make compact [domain hacks](/en/blog/domain-hacks-explained/).
- **Say it out loud.** ".sh" is pronounced "dot ess-aitch" by some and "shh" by others; make sure your name survives both readings.
- **Match the audience.** If your users don't know what a shell script is, the pun is wasted — pick .sh for terminal-native products, not general consumer plays.

## How to register a .sh domain at Namefi

1. **Search** for your desired `.sh` name to check availability.
2. **Choose** the exact name and review its term (and whether it is classified premium).
3. **Register** and configure [DNS](/en/glossary/dns/).

[Namefi](https://namefi.io) is an [ICANN](/en/glossary/icann/)-accredited registrar bridging Web2 and Web3: alongside standard registration and fast DNS, you can optionally [tokenize your domain](/en/blog/what-are-tokenized-domains/) for provable on-chain ownership and easier transfers. New to extensions? Start with [what is a TLD](/en/blog/what-is-a-tld/).

## Frequently asked questions

### Can anyone register a .sh domain?

Yes, at the second level. NIC.SH policy states that an applicant may reside in any legal jurisdiction, so anyone worldwide can register name.sh. Only third-level names such as co.sh or org.sh are restricted to Saint Helena residents, who can claim them free of charge.

### Does a .sh domain affect SEO?

Google does not include .sh on its published list of ccTLDs treated as generic, so by default it can be read as targeting Saint Helena. In practice you can shape your international audience through content language, hreflang, and where you earn links, but a globally neutral extension avoids the question entirely.

### Who runs the .sh domain?

IANA lists the Government of Saint Helena as the sponsor and Internet Computer Bureau Ltd as the registry operator, running the NIC.SH registry. Internet Computer Bureau was acquired by Afilias in 2017 alongside .io and .ac, and Afilias later became part of Identity Digital.

### Why do developer tools use .sh domains?

Because .sh is also the file extension for Unix shell scripts, the suffix reads as a command-line in-joke. Projects such as Homebrew at brew.sh, Oh My Zsh at ohmyz.sh, and the Bun runtime at bun.sh use it to signal a terminal-native developer audience.

## Related resources

- [What is a TLD?](/en/blog/what-is-a-tld/)
- [Domain hacks explained](/en/blog/domain-hacks-explained/)
- [ccTLD market share by registration volume](/en/blog/cctld-market-share-by-registration-volume/)
- [Domain terminology guide](/en/blog/domain-terminology-guide/)
- Glossary: [ccTLD](/en/glossary/cctld/), [domain hack](/en/glossary/domain-hack/), [registry](/en/glossary/registry/), [DNSSEC](/en/glossary/dnssec/)
- Compare TLDs: [.io](/en/tld/io/), [.dev](/en/tld/dev/), [.ai](/en/tld/ai/), [.gg](/en/tld/gg/), [.fm](/en/tld/fm/)

## Sources and further reading

- IANA — [IANA root-zone entry for .sh](https://www.iana.org/domains/root/db/sh.html)
- Google Search Central — [does not include .sh](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=en#:~:text=Google%20treats%20some%20ccTLDs%20%28such%20as%20.tv%20and%20.me%29%20as%20gTLDs)
- domainincite.com — [paid $70.17 million in cash](https://domainincite.com/23650-afilias-bought-io-for-70-million#:~:text=%2470.17%20million%20cash)
- identity.digital — [rebranded as Identity Digital](https://identity.digital/company)
- brew.sh — [brew.sh](https://brew.sh/)
- ohmyz.sh — [ohmyz.sh](https://ohmyz.sh/)
- bun.sh — [bun.sh](https://bun.sh/)
- nic.sh — [NIC.SH registration rules](https://www.nic.sh/rules.htm#:~:text=An%20applicant%20may%20reside%20in%20any%20legal%20jurisdiction)
- nic.sh — [free of charge to Saint Helena residents and companies](https://www.nic.sh/free-domain-for-saint-helena-residents.htm)
