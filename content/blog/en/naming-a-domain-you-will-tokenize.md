---
title: "Minting a Domain as an NFT Skips the Registry's IDN Checks"
date: '2026-09-01'
language: en
tags: ['idn', 'punycode', 'confusable-domains', 'ens', 'tokenized-domains', 'namehash']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-tokenization
format: guide
description: Registries run confusable-character checks at registration under ICANN policy. Minting that same domain as an NFT happens entirely outside that check.
ogImage: ../../assets/naming-a-domain-you-will-tokenize-og.jpg
keywords: ['idn domain nft', 'punycode nft', 'confusable domain names', 'homograph domain', 'ICANN IDN guidelines', 'ENS normalization', 'ENSIP-15', 'namehash case sensitivity', 'xn-- domain', 'tokenized domain security', 'whole-script confusables', 'domain nft minting risk', 'unicode domain names', 'namefi']
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/how-to-tokenize-your-com/
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/ens-vs-dns-domain-flipping/
  - /en/blog/selling-domains-as-nfts/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/blockchain-concepts/
relatedGlossary:
  - /en/glossary/idn/
  - /en/glossary/ens/
  - /en/glossary/erc-721/
  - /en/glossary/icann/
  - /en/glossary/hash-function/
---

Say you own `café.com`. Before it was ever registerable, that label passed through a check ordinary ASCII domains never touch: the registry verified it against the exact list of characters [ICANN](/en/glossary/icann/) lets that name use, and against whether it visually collides with a name someone else already holds. Now you want to [tokenize it as an NFT](/en/blog/what-are-tokenized-domains/). You call a smart contract, sign a transaction, and a token representing `café.com` lands in your wallet. No registry sat in that path. No IDN table was consulted. No confusable-character check ran. The protection built into domain registration over two decades of standards work does not extend to the minting step — not because anyone disabled it, but because minting was never inside its scope.

That gap is the actual risk in naming a domain you plan to tokenize. It has nothing to do with keeping the name short — neither the NFT metadata standard nor the marketplaces that read it impose any length limit worth designing around. The real seam is narrower: a non-ASCII label is silently re-encoded for DNS into an ASCII string that looks nothing like it, visually identical characters from other scripts create a spoofing risk Unicode itself treats as a security category, and a hash function does not forgive a capital letter the way DNS does. Each is a documented protocol fact, not a style tip, and each behaves differently once a name leaves the registry's custody and becomes a token.

## Same label, two strings, two audiences

Every [internationalized domain name](/en/glossary/idn/) has two representations once it goes beyond plain ASCII. The one you read — `café.com` — is called a U-label. The one DNS actually stores and transmits is an A-label: a string built entirely from letters, digits, and hyphens, using an encoding called Punycode that the IETF standardized to [uniquely and reversibly transform a Unicode string into an ASCII string](https://www.rfc-editor.org/rfc/rfc3492#section-1:~:text=It%20uniquely%20and%20reversibly%20transforms%20a%20Unicode%20string%20into%20an%20ASCII%20string). Run the algorithm on `café` and the output is `xn--caf-dma` — every A-label produced this way starts with the `xn--` prefix, so `café.com` becomes `xn--caf-dma.com` at the protocol layer.

Those two strings surface in different places, and that split is exactly where trouble hides:

- **The [DNS](/en/glossary/dns/) resolver and the zone file** only ever see and compare the A-label. The registry that issues the domain requires it: when both forms are submitted, [the registry MUST ensure that the A-label form is in lowercase](https://www.rfc-editor.org/rfc/rfc5891#section-4.2.1:~:text=MUST%20ensure%20that%20the%20A%2Dlabel%20form%20is%20in%20lowercase), converts it, and cross-checks it against the U-label before allowing the registration to stand.
- **A browser address bar** un-punycodes the A-label back to `café.com` for display, unless it judges the string suspicious enough to show the raw `xn--caf-dma.com` instead — the entire reason browsers keep that fallback is that the U-label is the form attackers weaponize.
- **An NFT's on-chain metadata** is under no such obligation. [ERC-721](/en/glossary/erc-721/)'s metadata schema defines a plain `name` field that simply [identifies the asset the NFT represents](https://eips.ethereum.org/EIPS/eip-721#specification:~:text=Identifies%20the%20asset%20to%20which%20this%20NFT%20represents), and OpenSea's own documentation says only that [metadata controls the name, media, description, and traits shown for an NFT](https://docs.opensea.io/docs/metadata-standards#:~:text=That%20metadata%20controls%20the%20name%2C%20media%2C%20description%2C%20and%20traits%20shown%20for%20an%20NFT). Neither document requires Punycode encoding, neither requires script validation, and neither imposes a character-count limit — that specific "keep it short" advice you may have read elsewhere has no standard behind it. Whatever string a minting contract writes into `name` is the string a wallet or marketplace will print, unprocessed.

So a tokenized `café.com` can carry the clean U-label in its metadata while the DNS layer underneath it only ever recognizes the A-label. That is not a bug in either system — it is two different protocols, built decades apart, making no promise to reconcile with each other.

## What ICANN actually requires registries to check

The confusable-character protections a domain owner rarely thinks about live in one document: ICANN's [Guidelines for the Implementation of Internationalized Domain Names, version 4.1](https://www.icann.org/en/system/files/files/idn-guidelines-22sep22-en.pdf#page=4), adopted September 2022. It draws a sharp line between what registries **must** do and what they're merely **encouraged** to do, and the line falls exactly where the real risk sits.

| Guideline | What it says | Binding level |
|---|---|---|
| 15 | All code points in a single IDN label must be taken from the same Unicode script, with narrow exceptions for languages with established mixed-script conventions | **Must** |
| 16 | Where mixed scripts are exceptionally allowed, visually confusable characters from different scripts must not be allowed to co-exist without a defined policy | **Must** |
| 14 | Registries are encouraged to consider policies that minimize confusion between IDN labels *within* the same script, arising from homoglyph characters | Encouraged only |
| 17 | Registries are encouraged to apply additional constraints that minimize **Whole-Script Confusables**, as defined by Unicode's own security standards | Encouraged only |

Two of these are hard requirements; two are recommendations a registry is free to skip. That distinction matters because it tells you exactly which spoofing technique is closed off by policy and which one is not.

## What a live registry actually enforces

Verisign, which operates the `.com` and `.net` registries, publishes its own [IDN Registration Rules](https://www.verisign.com/resources/internationalized-domain-names/idn-registration-rules/#:~:text=Verisign%E2%80%99s%20registries%20reject%20the%20commingling%20of%20code%20points%20from%20different%20Unicode%20scripts) implementing ICANN's mandatory guideline: "As a rule, Verisign's registries reject the commingling of code points from different Unicode scripts. That is, if an IDN contains code points from two or more Unicode scripts, then that IDN registration is rejected... This is done to prevent confusable code points of different scripts from appearing in the same IDN." A label mixing a Latin `p` with a Cyrillic `а` (U+0430) — the classic phishing move Unicode's security standard uses as its textbook example, rendering as [`pаypаl`](https://www.unicode.org/reports/tr39/#Mixed_Script_Confusables) next to the genuine `paypal` — is exactly what this rule blocks. It never reaches DNS.

But look at what that rule does *not* cover. It rejects commingling — two scripts inside one label — and says nothing about a label built entirely from a single foreign script that happens to look identical to a Latin one. Unicode's Technical Standard #39 has a name for that: a **whole-script confusable**, illustrated with its own canonical pair — the Latin word [`scope`](https://www.unicode.org/reports/tr39/#def_whole_script_confusables) sitting next to `ѕсоре`, a string built entirely from Cyrillic letters that render, glyph for glyph, the same way. Nothing in Verisign's five rules screens for that: it isn't a commingling violation, since every character in `ѕсоре` genuinely belongs to Cyrillic. And per the table above, catching it is ICANN Guideline 17 — encouraged, not required. A registry is free to implement that check, and equally free not to.

That is the honest version of "registry protection": real, and narrower than it sounds. Cross-script mixing inside a single label is closed off by rule at a major registry. A clean swap into a different script that merely *looks* the same is left to each registry's discretion, and once a label clears registration, whatever protection applied at that moment is the protection it keeps. Minting adds none of its own; the token contract runs no IDN table and consults no registry policy, because it was never built to.

None of this describes an incident that has happened to a specific tokenized domain — there is no public report of a marketplace displaying a raw `xn--` string to a buyer, or of a whole-script confusable being minted to defraud one. It describes the shape of the protocols themselves: the checks that exist, the ones that don't, and where a domain crosses from one to the other.

## The exactness problem: DNS forgives case, hashes do not

A second, unrelated gap sits underneath the first one. DNS has always treated case as decoration. The core specification says it plainly: [no significance is attached to the case](https://www.rfc-editor.org/rfc/rfc1035#section-2.3.1:~:text=Note%20that%20while%20upper%20and%20lower%20case%20letters%20are%20allowed%20in%20domain%20names%2C%20no%20significance%20is%20attached%20to%20the%20case) of a domain name, and `CAFE.com` resolves exactly as `cafe.com` does. That forgiveness is baked so deep into DNS that IDNA2008 — the current internationalization standard — draws the same line for A-labels specifically, requiring that [a pair of A-labels MUST be compared as case-insensitive ASCII](https://www.rfc-editor.org/rfc/rfc5891#section-3.1:~:text=A%20pair%0Aof%20A%2Dlabels%20MUST%20be%20compared%20as%20case%2Dinsensitive%20ASCII). But the same sentence draws a second line right next to it, for the Unicode form: [U-labels MUST be compared as-is, without case folding or other intermediate steps](https://www.rfc-editor.org/rfc/rfc5891#section-3.1:~:text=U%2Dlabels%20MUST%20be%20compared%0Aas%2Dis%2C%20without%20case%20folding%20or%20other%20intermediate%20steps). Case-insensitivity was never a property of Unicode text in general — it was a specific, deliberate feature of the ASCII layer.

A cryptographic [hash function](/en/glossary/hash-function/) has no equivalent concept of case at all. Keccak-256, the hash Ethereum uses everywhere, treats a string as a sequence of exact bytes. Running it against "Alice" and "alice" — the two spellings a human would call identical — produces two completely unrelated 32-byte outputs:

```
keccak256("Alice") = 0x81376b9868b292a46a1c486d344e427a3088657fda629b5f4a647822d329cd6a
keccak256("alice") = 0x9c0257114eb9399a2985f8e75dad7600c5d89fe3824ffa99ec1c3eb8bf3b0501
```

That is the whole problem in two lines: a hash is not a name-comparison function, and nothing about hashing a string automatically inherits DNS's decision to ignore case. Any system that mints tokenized names by hashing the raw label inherits that exactness whether it wants to or not.

[Ethereum Name Service](/en/glossary/ens/) ran into this early enough to have to fix it inside its own specification. ENS's namehash algorithm doesn't case-fold anything itself — it is a bare recursive hash, `sha3(namehash(remainder) + sha3(label))` — but the standard requires normalization to run *before* namehash ever sees the string: [the UTS46 normalisation process case-folds labels before hashing them, so two names with different case but identical spelling will produce the same namehash](https://eips.ethereum.org/EIPS/eip-137#name-syntax:~:text=the%20UTS46%20normalisation%20process%20case%2Dfolds%20labels%20before%20hashing%20them%2C%20so%20two%20names%20with%20different%20case%20but%20identical%20spelling%20will%20produce%20the%20same%20namehash). Skip that pre-processing step — hash the raw label the way the two-line example above does — and `Alice.eth` and `alice.eth` become two unrelated on-chain identifiers for what every human reader treats as the same name.

That original UTS46 approach turned out not to be enough. ENS has since published [ENSIP-15](https://docs.ens.domains/ensip/15#motivation), a normalization standard built specifically because, in the spec's own words, [the success of ENS has encouraged spoofing via insertion of zero-width characters, substitution of confusable (look-alike) characters, and mixing incompatible scripts](https://docs.ens.domains/ensip/15#motivation:~:text=Substitution%20of%20confusable%20%28look%2Dalike%29%20characters), among other techniques. That an ecosystem already running case-fold normalization still had to build a dedicated 15-page specification to close further spoofing gaps is the strongest evidence available that this class of risk is real rather than theoretical — protocols do not get rewritten to fix problems that never occurred. And ENSIP-15 is candid about the edges of its own coverage: it states directly that [this ENSIP only addresses single-character confusables](https://docs.ens.domains/ensip/15#security-considerations:~:text=This%20ENSIP%20only%20addresses%20single%2Dcharacter%20confusables), while acknowledging that confusable multi-character sequences exist outside what it defends against.

## What this means before you mint

None of this is a reason to avoid tokenizing a domain that uses accented, Cyrillic, Han, or any other non-Latin characters — DNS was built to carry exactly those names, and IDNA2008 makes that carrying reliable, whether you're [tokenizing a `.com`](/en/blog/how-to-tokenize-your-com/) or [minting a domain to sell](/en/blog/selling-domains-as-nfts/). It is a reason to be precise about what protection travels with the domain and what doesn't:

- **Know both forms of your own label.** Before minting, check the A-label of your domain (any IDN conversion tool will show it) and confirm which string — U-label or A-label — the minting flow writes into the token's `name` field. Regular [DNS keeps working underneath a tokenized domain](/en/blog/dns-on-tokenized-domains/), so this isn't an either/or question — it's a question about what the mint recorded.
- **A whole-script confusable that already cleared registration keeps whatever protection it had at that moment, no more.** If your domain sits in a script where a Latin look-alike exists, that lookalike's registrability wasn't necessarily blocked by a mandatory rule; minting adds no second check.
- **If a platform computes on-chain identifiers from your label, ask whether it normalizes first.** A system that hashes the raw string without an ENS-style normalization pass will treat `Domain.com` and `domain.com` as two unrelated tokens, silently, with no error pointing at the mismatch — a distinct failure mode from [how ENS and DNS diverge more generally](/en/blog/ens-vs-dns-domain-flipping/).
- **Treat "keep the name simple" advice skeptically when it's framed as a display-safety rule.** No documented length or truncation limit exists in the token standard or OpenSea's documentation to justify it. The real risks are the ones above, and they apply regardless of name length.

Namefi's own minting flow sits on this exact seam — it takes a domain that already exists in DNS and turns it into a token, so the DNS-normalization-versus-on-chain-exactness boundary isn't hypothetical, it's what the product has to get right on every mint. That's the honest test for any platform doing this kind of minting, Namefi included: ask what string it writes into token metadata, whether it normalizes a label before hashing it, and whether it can show you the answer rather than asking you to trust it.

## Sources and further reading

- ICANN — [Guidelines for the Implementation of Internationalized Domain Names, Version 4.1](https://www.icann.org/en/system/files/files/idn-guidelines-22sep22-en.pdf) (22 September 2022), Guidelines 14–17, p. 4.
- Verisign — [Internationalized Domain Name Registration Rules](https://www.verisign.com/resources/internationalized-domain-names/idn-registration-rules/) — fetched 2026-09-01.
- Unicode Consortium — [UTS #39: Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/) — Confusable Detection, Mixed-Script Confusables, Whole-Script Confusables.
- IETF — [RFC 3492: Punycode](https://www.rfc-editor.org/rfc/rfc3492) — the encoding behind every `xn--` domain.
- IETF — [RFC 5891: Internationalized Domain Names in Applications (IDNA): Protocol](https://www.rfc-editor.org/rfc/rfc5891) §3.1 and §4.2.1.
- IETF — [RFC 1035: Domain Names — Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) §2.3.1, the original DNS case-insensitivity rule.
- Ethereum — [EIP-137: Ethereum Domain Name Service — Specification](https://eips.ethereum.org/EIPS/eip-137) — the namehash algorithm and its case-fold requirement.
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) — the metadata `name` field.
- ENS — [ENSIP-15: ENS Name Normalization Standard](https://docs.ens.domains/ensip/15) — Motivation, Algorithm, and Security Considerations.
- OpenSea — [Metadata Standards](https://docs.opensea.io/docs/metadata-standards) — fetched 2026-09-01.
