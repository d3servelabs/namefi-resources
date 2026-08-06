---
title: 'What Is the .cn Domain? China''s Country-Code TLD Explained'
date: '2026-08-05'
language: 'en'
priority: P1
tags: ['tld']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'The .cn domain is China''s official ccTLD, run by CNNIC and gated by mandatory real-name verification. Learn the rules, ICP hosting context, and who .cn suits.'
keywords: ['CNNIC registry', '.cn real-name verification', 'ICP license China hosting', '.cn vs .com.cn', 'China ccTLD']
faqs:
  - question: 'Can anyone register a .cn domain?'
    answer: 'Yes, individuals and organizations worldwide can register .cn, but every registrant must pass CNNIC real-name verification by submitting identity documents (a passport for foreign individuals, a certificate of incorporation for foreign companies). There is no nationality restriction, but there is a mandatory identity-check requirement.'
  - question: 'Does a .cn domain affect SEO?'
    answer: 'Google treats .cn as a country-targeted ccTLD for China, not a generic extension, so it signals to search engines that a site is meant for the Chinese market. That helps China-focused sites rank locally but works against sites chasing a global, non-China audience.'
  - question: 'Do I need an ICP license to use a .cn domain?'
    answer: 'Only if you host the site on a server physically located in mainland China. ICP filing is a separate Ministry of Industry and Information Technology requirement tied to server location, not domain registration; a .cn domain hosted outside mainland China does not need an ICP number.'
  - question: 'Who runs the .cn domain?'
    answer: 'The China Internet Network Information Center (CNNIC) is the registry operator for .cn, listed as both registry operator and sponsoring organization in the IANA root-zone database, and it sets the real-name verification and registration rules.'
relatedArticles:
  - /en/blog/cctld-market-share-by-registration-volume/
  - /en/blog/short-llll-and-numeric-domains-chinese-market/
  - /en/blog/what-is-a-tld/
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
  - /en/glossary/idn/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/dnssec/
---

The **.cn domain** is the official [country-code top-level domain](/en/glossary/cctld/) (ccTLD) for the **People's Republic of China**, run by the China Internet Network Information Center (CNNIC). It is one of the world's largest national namespaces, and it is also one of the most procedurally distinctive: every registrant, wherever they live, must clear a mandatory **real-name verification** check before a .cn name goes live. This page covers what .cn is, how CNNIC's identity rules work in practice, the separate ICP-licensing question that trips up newcomers, and who genuinely benefits from registering one.

## .cn at a glance

| Fact | Detail |
| --- | --- |
| TLD type | Country-code TLD (ccTLD) for the People's Republic of China |
| Registry operator | [China Internet Network Information Center (CNNIC)](https://www.iana.org/domains/root/db/cn.html) |
| Year delegated | 1990 |
| IDN support | Yes — a parallel Chinese-script ccTLD, [.中国](https://www.iana.org/domains/root/db/xn--fiqs8s.html), was delegated in 2010 |
| DNSSEC | Supported |
| Registration restrictions | **Real-name verification required** for every registrant — identity documents must be submitted and approved before activation |
| Best for | Businesses and brands targeting mainland Chinese users; entities that already need a China-market presence |

## What is .cn?

.cn is the [ccTLD](/en/glossary/cctld/) assigned to China under ISO 3166-1 (country code CN), delegated through the [IANA root-zone database](https://www.iana.org/domains/root/db/cn.html), which lists CNNIC as both the registry operator and sponsoring organization. Unlike a borderless [gTLD](/en/glossary/gtld/) such as [.com](/en/tld/com/), .cn is administered under Chinese domain-name policy rather than a standard ICANN registry agreement — the norm for every ccTLD.

Google does **not** treat .cn as one of the small set of ccTLDs it re-classifies as generic (that list — .ad, .ai, .as, .bz, .cc, .cd, .co, .dj, .fm, .io, .la, .me, .ms, .nu, .sc, .sr, .su, .tv, .tk, .ws — is published in [Google Search Central's guidance on managing multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=en#:~:text=We%20also%20treat%20some%20vanity%20ccTLDs%20%28such%20as%20.tv%20and%20.me%29%20as%20gTLDs)). .cn is absent from it, so it is treated as a country-targeted signal for China — useful when that is exactly your audience, less useful otherwise.

## History of .cn

.cn was delegated to China in **1990**, making it one of the earlier ccTLDs in the DNS root, and it has since grown into one of the largest national namespaces by registration volume (see our [ccTLD market-share breakdown](/en/blog/cctld-market-share-by-registration-volume/) for how it compares to .de, .uk, and other leaders). CNNIC governs the space today, and its rules have tightened over time rather than loosened:

- A **2012 rule change** from the Ministry of Industry and Information Technology (MIIT) expanded who could register a .cn name — eligibility had previously covered organizations only; the amended rules explicitly extended registration to "any natural person or organization that can independently bear civil liabilities."
- CNNIC's current **[Implementing Rules of Domain Name Registration](https://www.cnnic.com.cn/PublicS/fwzxxgzcfg/201907/t20190726_70776.htm)** require identity materials from every applicant, and registrants must attest to the "authenticity, accuracy and integrity" of what they submit.
- Since **August 1, 2022**, CNNIC has run random real-name-verification audits across the registered base; domains that fail are placed on **serverHold** until they pass.
- China's Chinese-script IDN ccTLD, **[.中国](https://www.iana.org/domains/root/db/xn--fiqs8s.html)**, was delegated in 2010, giving Chinese-market registrants a native-script counterpart to the Latin .cn string.

## How people use .cn

- **China-market businesses and brands** that want a locally recognized, government-registered namespace for mainland users.
- **Media and information portals** — some of China's largest web properties sit on .cn's second-level structure (see below).
- **Government and institutional sites** — .gov.cn and other restricted second levels are reserved for qualifying bodies.
- **Regional and provincial identity** — .cn supports geographic second levels such as `bj.cn` (Beijing) and `sh.cn` (Shanghai).
- **Buyers already navigating China's other market-specific naming conventions** — pinyin-friendly, numeric, and "lucky number" strings carry cultural weight in the Chinese domain market generally (see our piece on [short, LLLL, and numeric domains in the Chinese market](/en/blog/short-llll-and-numeric-domains-chinese-market/)).

**Who it's not ideal for:** anyone who wants an instant, paperwork-free registration — the real-name check adds a verification step most gTLDs don't require — and anyone building a brand aimed primarily at a non-China, global audience, since Google reads .cn as China-targeted.

## Notable sites using .cn

- **[sina.com.cn](https://www.sina.com.cn/)** — Sina Corporation's flagship Chinese-language news and information portal, in continuous operation since 1996.
- **[people.com.cn](https://en.wikipedia.org/wiki/People%27s_Daily)** — the online presence of *People's Daily*, one of China's largest state-run newspapers, run under the com.cn second level.
- **[gov.cn](https://www.gov.cn/)** — the official portal of China's central government, administered under the State Council General Office.

## .cn vs other domains

| Factor | .cn | [.com](/en/tld/com/) | .com.cn (native second level) |
| --- | --- | --- | --- |
| Type | ccTLD (country-targeted) | Legacy gTLD | .cn second-level, restricted to commercial entities |
| Registrant restriction | Real-name verification, open globally | Open, no verification | Real-name verification plus commercial-entity documentation |
| Geo signal to Google | China-targeted | Generic | China-targeted |
| Registrant identity check | Required | None | Required |

Choose **.com** for a globally neutral default that avoids any China-specific geo-signal. Choose **.cn** when the flat top-level string and a China-facing audience matter more than sector labeling. Choose **.com.cn** when you specifically want to signal a commercial entity operating in China under the native second-level structure many established Chinese brands use.

## Why choose .cn?

- **Direct China market signal.** For businesses genuinely serving mainland Chinese users, .cn is the most literal way to say so.
- **Identity-verified namespace.** The mandatory real-name check, while it adds friction, also means the .cn zone carries less of the throwaway-registration profile that plagues some unrestricted low-cost gTLDs.
- **Native-script option available.** The .中国 IDN sibling lets Chinese-market brands run a fully native-script address alongside the Latin .cn name.
- **Long-established namespace.** Delegated in 1990 and used by major media and government sites, .cn carries decades of institutional legitimacy.

## Things to consider

- **Real-name verification is not optional.** Every registrant must submit and clear identity documentation before the name resolves normally; skipped or failed verification can result in serverHold.
- **ICP filing is a separate hurdle if you host in China.** Registering .cn does not by itself authorize hosting inside mainland China.
- **Geo-targeted, not global.** Search engines read .cn as China-specific, which can work against sites that want to rank internationally.
- **Extra paperwork for foreign registrants.** Registrar guidance from providers such as [Gandi](https://news.gandi.net/en/2021/11/new-cn-verification-rules-starting-january-1-2022-what-impact-will-it-have-on-your-domain-names/) notes foreign individuals typically verify with a passport and foreign companies with a certificate of incorporation — plan for that step before you register.

## Who can register a .cn domain?

**Registration restrictions: real-name verification required.** .cn is open to registrants worldwide — there is no nationality bar — but CNNIC's [Implementing Rules of Domain Name Registration](https://www.cnnic.com.cn/PublicS/fwzxxgzcfg/201907/t20190726_70776.htm) require every applicant to submit identity materials before the name is fully activated. In practice, registrars commonly ask foreign individuals for a passport and foreign companies for a certificate of incorporation. Since August 2022, CNNIC also runs random verification audits on already-registered names, and any domain that fails is set to serverHold until it passes.

This is distinct from **ICP filing** (Internet Content Provider registration with China's Ministry of Industry and Information Technology), required only when a site is **hosted on a server physically located in mainland China** — a .cn domain hosted outside mainland China does not need an ICP number to resolve.

DNSSEC is supported at the registry level, and [WHOIS](/en/glossary/whois/) data is tied to the verified registrant identity rather than offered anonymously.

## .cn pricing and value

.cn pricing follows the same general dynamics as most ccTLDs rather than any fixed figure: **first-year and renewal pricing typically differ**, so budget for the standing renewal rate, and **premium, short, numeric, or culturally significant strings** can carry materially higher costs given the strong Chinese-market preference for lucky-number and pinyin-friendly names (see our [Chinese-market domain pricing piece](/en/blog/short-llll-and-numeric-domains-chinese-market/)). This page intentionally quotes no specific numbers — check current rates at the point of registration.

## Reputation and email deliverability

.cn does not carry the documented spam-abuse reputation associated with some unrestricted, ultra-cheap new gTLDs — real-name verification raises the cost of bulk, anonymous registration. That said, mail and security systems outside China sometimes apply extra scrutiny to .cn-originating traffic because it is a less familiar namespace to non-Chinese recipients. As with any domain, proper SPF, DKIM, and DMARC configuration matters more to deliverability than the extension itself.

## Branding and naming tips

- **Consider Chinese-market naming conventions.** Short, pinyin-friendly strings and numerically "lucky" combinations carry real cultural and pricing weight — see our [short and numeric domains guide](/en/blog/short-llll-and-numeric-domains-chinese-market/).
- **Decide between .cn and .中国 early.** If your audience is primarily Chinese-script literate, the IDN sibling may be worth securing alongside the Latin string.
- **Plan for verification in your launch timeline.** Real-name checks are not instant; build the documentation and review window into your project plan.
- **Confirm your hosting plan before you register.** Whether you need ICP filing depends entirely on where the site is hosted, not on registering the domain.

## How to register a .cn domain at Namefi

1. **Search** for your desired `.cn` name and confirm availability.
2. **Prepare identity documents** — a passport for individuals or incorporation certificate for organizations — ahead of time to keep real-name verification moving quickly.
3. **Register** and complete CNNIC's identity verification.
4. **Configure [DNS](/en/glossary/dns/)** and, if hosting inside mainland China, pursue ICP filing separately.

[Namefi](https://namefi.io) is an [ICANN-accredited registrar](/en/glossary/accredited-registrar/) that bridges Web2 and Web3, with transparent pricing and the option to hold eligible domains as [tokenized assets](/en/blog/what-are-tokenized-domains/) for provable ownership and easier transfers.

## Frequently asked questions

### Can anyone register a .cn domain?

Yes, individuals and organizations worldwide can register .cn, but every registrant must pass CNNIC real-name verification by submitting identity documents (a passport for foreign individuals, a certificate of incorporation for foreign companies). There is no nationality restriction, but there is a mandatory identity-check requirement.

### Does a .cn domain affect SEO?

Google treats .cn as a country-targeted ccTLD for China, not a generic extension, so it signals to search engines that a site is meant for the Chinese market. That helps China-focused sites rank locally but works against sites chasing a global, non-China audience.

### Do I need an ICP license to use a .cn domain?

Only if you host the site on a server physically located in mainland China. ICP filing is a separate Ministry of Industry and Information Technology requirement tied to server location, not domain registration; a .cn domain hosted outside mainland China does not need an ICP number.

### Who runs the .cn domain?

The China Internet Network Information Center (CNNIC) is the registry operator for .cn, listed as both registry operator and sponsoring organization in the IANA root-zone database, and it sets the real-name verification and registration rules.

## Related resources

- [ccTLD market share by registration volume](/en/blog/cctld-market-share-by-registration-volume/)
- [Short, LLLL, and numeric domains: the Chinese-market premium](/en/blog/short-llll-and-numeric-domains-chinese-market/)
- [What is a TLD?](/en/blog/what-is-a-tld/)
- [Domain terminology guide](/en/blog/domain-terminology-guide/)
- Glossary: [ccTLD](/en/glossary/cctld/), [IDN](/en/glossary/idn/), [registrar](/en/glossary/registrar/), [ICANN](/en/glossary/icann/), [DNSSEC](/en/glossary/dnssec/)
- Compare TLDs: [.com](/en/tld/com/), [.jp](/en/tld/jp/), [.kr](/en/tld/kr/), [.in](/en/tld/in/)

## Sources and further reading

- IANA — [China Internet Network Information Center (CNNIC)](https://www.iana.org/domains/root/db/cn.html)
- IANA — [.中国](https://www.iana.org/domains/root/db/xn--fiqs8s.html)
- Google Search Central — [Google Search Central's guidance on managing multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=en#:~:text=We%20also%20treat%20some%20vanity%20ccTLDs%20%28such%20as%20.tv%20and%20.me%29%20as%20gTLDs)
- cnnic.com.cn — [Implementing Rules of Domain Name Registration](https://www.cnnic.com.cn/PublicS/fwzxxgzcfg/201907/t20190726_70776.htm)
- sina.com.cn — [sina.com.cn](https://www.sina.com.cn/)
- en.wikipedia.org — [people.com.cn](https://en.wikipedia.org/wiki/People%27s_Daily)
- gov.cn — [gov.cn](https://www.gov.cn/)
- news.gandi.net — [Gandi](https://news.gandi.net/en/2021/11/new-cn-verification-rules-starting-january-1-2022-what-impact-will-it-have-on-your-domain-names/)
