---
title: 'What Is the .eth Name? The ENS Web3 Name Explained'
date: '2026-06-15'
language: 'en'
tags: ['tld']
authors: ['namefiteam']
draft: false
description: '.eth is not an ICANN domain but an Ethereum Name Service (ENS) name held as an NFT on-chain. Learn how it works, who can register one, and its real limits.'
keywords: ['.eth domains', 'what is .eth', 'ENS domain', 'Ethereum Name Service', '.eth name NFT', 'register .eth', 'is .eth a real domain', '.eth vs DNS domain']
faqs:
  - question: 'Can anyone register a .eth name?'
    answer: 'Yes. Registering a .eth name is permissionless and open to anyone with an Ethereum wallet and enough ETH to cover the annual rent plus gas. There is no credential check, no identity verification, and no ICANN-accredited registrar involved; the rules are enforced entirely by the ENS smart contracts on Ethereum.'
  - question: 'Is a .eth name a real domain that works in browsers?'
    answer: 'Not in the DNS sense. A .eth name does not resolve in ordinary browsers without a Web3 resolver, extension, or gateway. It is an Ethereum Name Service name used mainly to label wallet addresses and decentralized content, not a substitute for a conventional .com or .org website.'
  - question: 'Is a .eth name owned forever like an NFT?'
    answer: 'A .eth name is an ERC-721 NFT, but ownership is a paid annual registration, not a one-time purchase. You must renew it each year by paying rent in ETH. If it expires, a 90-day grace period applies, after which it can be re-registered by anyone via a declining-price premium auction.'
  - question: 'Why are short .eth names so expensive to register?'
    answer: 'The ENS .eth registrar charges annual rent by name length: roughly 5 USD per year for names of five or more characters, about 160 USD for four-character names, and about 640 USD for three-character names, paid in ETH. Shorter names are deliberately priced higher because they are scarce and in high demand.'
---

The **.eth name** is one of the best-known identifiers in Web3, but it is widely misunderstood. Despite the dot-suffix, **.eth is not an ICANN domain and not part of the DNS**. It is a name issued by the [Ethereum Name Service (ENS)](https://ens.domains), a set of smart contracts living on the Ethereum blockchain. There is no IANA root-zone entry for .eth and no ICANN registry agreement, because ENS exists entirely outside that system.

If you are deciding whether a .eth name fits your project, the key is to understand what it actually is: a blockchain-native name, held as an NFT, that mainly labels Ethereum addresses and decentralized content. It complements a conventional domain rather than replacing it.

## .eth at a glance

| Fact | Detail |
| --- | --- |
| Type | ENS / Web3 name on Ethereum (not a DNS TLD) |
| Registry / operator | ENS smart contracts on Ethereum, governed by the ENS DAO |
| Year launched | ENS launched May 2017; redesigned permanent .eth registrar in 2019 |
| Name format | ERC-721 NFT; second-level names like `alice.eth` |
| DNSSEC | Not applicable (ENS is on-chain, not DNS) |
| Registration restrictions | Permissionless and open to all — any wallet, paid in ETH |
| Renewal | Annual rent in ETH; 90-day grace period after expiry |
| Resolves in normal browsers | No — requires a Web3 resolver, extension, or gateway |
| Best for | Wallet identity, Web3/DAO branding, on-chain usernames |

## What is .eth?

A .eth name is an [Ethereum Name Service](https://docs.ens.domains/) name. ENS is, in its own words, "a distributed, open, and extensible naming system based on the Ethereum blockchain." Its primary job is to map human-readable names to machine identifiers — most commonly an Ethereum wallet address, but also content hashes, other cryptocurrency addresses, and metadata like an avatar.

This is the critical distinction from a normal top-level domain. A .com or .xyz name is a record in the global DNS, delegated through ICANN and IANA. A .eth name has none of that. The "registry" is not a company filing an ICANN agreement; it is the **ENS registry smart contract** on Ethereum, and issuance rules are enforced by a second contract, the **.eth registrar**. Because the logic is on-chain, no central operator can revoke a correctly held name — but equally, no ordinary DNS resolver knows the name exists. That is why .eth is best described as a **Web3 name**, not a gTLD or ccTLD.

## History of .eth

ENS launched on **May 4, 2017**, proposed by Nick Johnson and built with support from the Ethereum Foundation. The original system distributed names via Vickrey auctions and initially restricted registrations to names of seven characters or longer.

In **May 2019** ENS migrated to the "permanent registrar" still in use today, replacing the auction model with length-based annual pricing and making .eth names tradable ERC-721 NFTs. In **November 2021** ENS decentralized governance by launching the **ENS DAO** and ENS token, so registration revenue now flows to the DAO treasury rather than a private registry. Short and dictionary .eth names have changed hands for large sums on NFT marketplaces, though specific sale figures vary and should be checked against on-chain records before being quoted.

## How people use .eth

A .eth name is used very differently from a website domain. Real, common uses include:

- **Human-readable wallet addresses** — replacing a 42-character `0x…` address with `alice.eth` when sending or receiving ETH and tokens.
- **Web3 identity / usernames** — a single name reused as a login or profile across wallets, dApps, and crypto-social apps.
- **DAO and protocol branding** — teams using a `name.eth` as their on-chain identity and treasury label.
- **Decentralized content** — pointing a name at an IPFS content hash so it can serve a censorship-resistant site through a Web3 gateway.
- **Subname issuance** — projects handing out `you.project.eth` subnames to members.

**Who it's not ideal for:** anyone who needs a conventional, universally reachable website. If your goal is a marketing site, a business email address, or anything a non-crypto visitor must reach by typing it into Chrome or Safari, a .eth name is the wrong tool — you want a DNS domain such as [.com](/en/tld/com), [.io](/en/tld/io), [.ai](/en/tld/ai), or [.app](/en/tld/app).

## Notable uses of .eth

Rather than vanity sites, .eth names are best known as the on-chain identities of prominent Ethereum figures and projects. Ethereum co-founder Vitalik Buterin's `vitalik.eth` is the canonical example, widely used as his public wallet and identity, and many DAOs and Web3 builders maintain a `name.eth` as their primary on-chain handle. Because these are wallet and identity labels rather than hosted websites, .eth identifies an on-chain entity, not a web server.

## .eth vs other domains

| Extension | Type | Where it lives | Typical use |
| --- | --- | --- | --- |
| .eth | ENS / Web3 name | Ethereum blockchain | Wallet identity, on-chain branding |
| [.com](/en/tld/com) | Legacy gTLD (DNS) | Global DNS via ICANN | Any website or business |
| [.xyz](/en/tld/xyz) | New gTLD (DNS) | Global DNS via ICANN | Startups, Web3-adjacent brands |
| [.io](/en/tld/io) | ccTLD used as tech gTLD (DNS) | Global DNS via ICANN | SaaS, developer, crypto projects |

Pick **.eth** when you want a blockchain-native identity for a wallet, DAO, or on-chain app. Pick a **DNS domain** like **.com**, **.xyz**, or **.io** when you need a real, browser-reachable website and email. The two are not interchangeable, and many Web3 teams sensibly hold both — a DNS domain for the public site and a .eth name for on-chain identity.

## Why choose .eth?

- **True self-custody** — a correctly held .eth name lives in your wallet as an NFT; there is no registrar account that can be socially engineered into transferring it.
- **Native Ethereum integration** — wallets and dApps resolve .eth names automatically, turning a cryptic address into something you can read and verify.
- **Permissionless** — anyone can register one in minutes with a wallet and some ETH; no application, credential, or approval.
- **Composability** — because it is a standard ERC-721 NFT, a .eth name can be traded, listed, lent, or used as collateral wherever NFTs are supported.

## Things to consider

The trade-offs are real and worth stating plainly. A .eth name **does not resolve in ordinary browsers** without a Web3 resolver, browser extension, or gateway service, so it cannot serve as a normal website address. Ownership is **rented, not permanent** — you pay annual rent in ETH, and a lapsed name can be lost after its grace period. You also bear **self-custody risk**: lose your wallet's keys and you lose control of the name, with no support desk to recover it. Finally, registration and renewal cost **gas** on top of rent, and short names are expensive by design.

## Who can register a .eth name?

**Registration restrictions: permissionless and open to all.** There is no eligibility gate of any kind — no ICANN-accredited registrar, no identity verification, no trademark sunrise process, and no credential requirement. Anyone with an Ethereum wallet and enough ETH can register an available .eth name directly through the ENS smart contracts.

Because the .eth registrar enforces a **commit-reveal** scheme to prevent front-running, registration is a two-step on-chain process: you submit a commitment, wait at least 60 seconds, then call `register` and pay the rent. Names are issued as ERC-721 NFTs, registration is for a fixed term (commonly one year or more), and renewal is paid annually in ETH — notably, **any wallet can renew a name**, not just the owner. After expiry, a **90-day grace period** lets the current holder renew at the normal price; if they don't, the name enters a 21-day declining-price premium auction and can be claimed by anyone. The authoritative source for these mechanics is the [ENS .eth registrar documentation](https://docs.ens.domains/registry/eth) and the [ENS name-lifecycle support article](https://support.ens.domains/en/articles/8046877-name-lifecycle).

## .eth pricing and value

Pricing dynamics for .eth are unusual because rent is **length-based and denominated in USD but paid in ETH**. Per the ENS registrar, the approximate annual rent is **5 USD for names of five or more characters, 160 USD for four-character names, and 640 USD for three-character names**, with the ETH amount calculated at registration time. On top of rent you always pay Ethereum **gas**, which fluctuates with network conditions. Beyond the protocol price, scarce names (short strings, real words, well-known handles) trade on NFT secondary markets at whatever buyers will pay, entirely independent of the registrar's rent. We do not quote live or promotional figures; always confirm the current rent and gas at the moment of registration.

## Reputation and resolution limitations

This is where honesty matters most. Within crypto, a .eth name is a respected signal of an on-chain identity and is broadly trusted by wallets and dApps. **But it has a reach limitation that DNS domains do not:** it does **not** resolve in ordinary browsers, and it cannot be used as a normal email domain. Visiting a .eth "site" requires a Web3-aware resolver, a browser extension, or a gateway that bridges ENS to HTTP. Outside the Ethereum ecosystem, most people and most software simply cannot reach a bare .eth name. Treat it as an identity layer for Web3 — not a drop-in replacement for a website or business email, where a conventional DNS domain remains essential.

## Branding and naming tips

A .eth name reads as unmistakably crypto-native, which is an asset for a wallet, DAO, or Web3 product and a liability for a mainstream brand. Keep names short and easy to dictate, since they are often shared verbally in crypto communities. Remember the cost curve: three- and four-character names carry steep annual rent, so a memorable five-plus-character name is usually the pragmatic choice. If you are building a brand, the strongest pattern is to **secure the matching DNS domain and the .eth name together** so your public site and your on-chain identity stay consistent.

## How to approach .eth with Namefi

Namefi is an [ICANN-accredited registrar](https://namefi.io) that also supports Web3 and tokenized domains, which makes it a natural home base for builders who live in both worlds:

1. **Secure your brand in DNS** — register the conventional domain your audience will actually type, such as a [.com](/en/tld/com), [.xyz](/en/tld/xyz), or [.dev](/en/tld/dev) name, with transparent pricing.
2. **Tokenize for Web3 ownership** — turn that DNS domain into an on-chain NFT asset on Namefi, getting NFT-grade self-custody and transferability similar to what makes .eth appealing, while keeping a name that still resolves in every browser.
3. **Pair it with your .eth identity** — use a .eth name as your Ethereum-native handle alongside the Namefi-managed domain that serves your real website and email.

[Namefi](https://namefi.io) bridges Web2 and Web3 so you get the best of both: real DNS reachability plus blockchain-native ownership.

## Frequently asked questions

### Can anyone register a .eth name?

Yes. Registering a .eth name is permissionless and open to anyone with an Ethereum wallet and enough ETH to cover the annual rent plus gas. There is no credential check, no identity verification, and no ICANN-accredited registrar involved; the rules are enforced entirely by the ENS smart contracts on Ethereum.

### Is a .eth name a real domain that works in browsers?

Not in the DNS sense. A .eth name does not resolve in ordinary browsers without a Web3 resolver, extension, or gateway. It is an Ethereum Name Service name used mainly to label wallet addresses and decentralized content, not a substitute for a conventional .com or .org website.

### Is a .eth name owned forever like an NFT?

A .eth name is an ERC-721 NFT, but ownership is a paid annual registration, not a one-time purchase. You must renew it each year by paying rent in ETH. If it expires, a 90-day grace period applies, after which it can be re-registered by anyone via a declining-price premium auction.

### Why are short .eth names so expensive to register?

The ENS .eth registrar charges annual rent by name length: roughly 5 USD per year for names of five or more characters, about 160 USD for four-character names, and about 640 USD for three-character names, paid in ETH. Shorter names are deliberately priced higher because they are scarce and in high demand.

## Related resources

- [What is a TLD?](/en/blog/what-is-a-tld)
- [What is a domain?](/en/blog/what-is-domain)
- [What are tokenized domains?](/en/blog/what-are-tokenized-domains)
- [Tokenized domain vs Web3 domain](/en/blog/tokenized-domain-vs-web3-domain)
- [.com domain](/en/tld/com) · [.xyz domain](/en/tld/xyz) · [.io domain](/en/tld/io)
- Glossary: [ENS](/en/glossary/ens) · [NFT](/en/glossary/nft) · [ERC-721](/en/glossary/erc-721) · [Web3](/en/glossary/web3)
