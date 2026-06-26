---
title: "Onchain Domain Flipping: Trading ENS and Tokenized Domains"
date: '2026-06-24'
language: en
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "How onchain domain flipping works — trading ENS and tokenized domains as wallet-held, NFT-liquid assets, and how it differs from registrar flipping."
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['onchain domain flipping', 'flipping ENS domains', 'tokenized domain flipping', 'trading tokenized domains', 'domain NFT flipping', 'flip web3 domains', 'ENS domain investing', 'NFT domain marketplace', 'sell domains as NFTs', 'onchain domain trading', 'ERC-721 domains', 'wallet-held domains', 'atomic domain settlement', 'tokenized domain liquidity', 'web3 domain flipping']
relatedArticles:
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/selling-domains-as-nfts/
  - /en/blog/onchain-domain-marketplaces-compared/
  - /en/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /en/topics/domain-investing/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/tld/
  - /en/glossary/icann/
  - /en/glossary/dns/
  - /en/glossary/web3/
---

Domain flipping has a familiar shape: buy a name low, find a buyer who needs it, sell high. The classic version of that trade runs through [registrars](/en/glossary/registrar/), aftermarket marketplaces, and an escrow agent who holds the money while the transfer clears. Onchain domain flipping is the same buy-low-sell-high instinct moved onto a [blockchain](/en/glossary/blockchain/), where the name itself is a token you hold in a [wallet](/en/glossary/wallet/) and can trade like any other [NFT](/en/glossary/nft/).

That single change — name as token — rewrites almost every step of the trade. Custody, listing, and settlement stop being account-level operations at a registrar and become onchain transactions you control directly. This guide explains what onchain domain flipping actually is, draws the important line between the two very different kinds of "onchain name" you can flip, and walks the full arc of the trade: acquire, custody, list, settle. It's the onchain pillar of the broader [domain flipping](/en/blog/domain-flipping/) playbook.

## What "onchain domain flipping" means

In a normal flip, ownership lives in a registrar's database. You log into an account, the registrar's records say you control the name, and moving it to a buyer means an account-to-account or registrar-to-registrar [transfer](/en/glossary/atomic-transfer/) that the registrar mediates. The asset is real, but you never hold it yourself — you hold an account that points at it.

Onchain flipping replaces that account with a [token](/en/glossary/tokenize/). The name is represented as an NFT under the [ERC-721](/en/glossary/erc-721/) standard, which Ethereum's spec describes as a [standard API for NFTs within smart contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) — and which its own summary calls a standard interface for [non-fungible tokens, also known as deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). That word, "deeds," is the whole idea: the token is the title to the name, sitting in your wallet, not a receipt for a record someone else keeps. Whoever holds the token controls the name, and transferring control is a [smart-contract](/en/glossary/smart-contract/) call rather than a support ticket.

That property is why onchain names trade like a liquid asset class. They list on the same [NFT marketplaces](/en/glossary/marketplace/) as art and collectibles, settle in minutes, and carry a public, auditable ownership history. The flip itself looks less like a registrar transfer and more like [domain trading](/en/glossary/domain-trading/) on rails built for digital assets.

## Two kinds of onchain name — don't conflate them

![Editorial illustration of two different onchain name assets side by side — a wallet-identity chip with a token versus a globe and deed certificate ringed with NFTs](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

The single most important thing to get right before you trade is that "onchain domain" covers two genuinely different assets that behave differently for a flipper.

The first is the [Web3](/en/glossary/web3/)-native name, the archetype being [ENS](/en/glossary/ens/) (`.eth`). These names live entirely on Ethereum. They are not part of the [ICANN](/en/glossary/icann/) root, so `vitalik.eth` does not resolve in an ordinary browser without a resolver or bridge. Their value is as wallet identity and crypto-native naming. ENS is also openly a registration market: per the ENS docs, a [5+ letter .eth will cost you 5 USD per year](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), with four- and three-letter names priced higher by design, and once registered a name can be moved [just like with any other ERC721 token](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token). That low, transparent registration floor is exactly why short, premium `.eth` names became a speculative market of their own.

The second is the **tokenized ICANN domain** — a real `.com`, `.xyz`, or `.io` whose ownership is mirrored as an NFT while the underlying DNS name keeps resolving everywhere. As our explainer on [what tokenized domains are](/en/blog/what-are-tokenized-domains/) lays out, these are real DNS domains that *also* have an onchain representation, not a parallel namespace. For a flipper the distinction is concrete: a tokenized `.com` carries the universal resolvability, email, and certificate support of the traditional internet, while an ENS name carries crypto-native utility but needs a bridge to behave like a website. They can both be flipped onchain; they are not the same product, and a buyer is paying for different things in each. We compare the families directly in [tokenized domain vs Web3 domain](/en/blog/tokenized-domain-vs-web3-domain/).

A third bucket — Web3 TLDs from platforms like Unstoppable Domains — sits closer to ENS than to tokenized ICANN names; the [premium Web3 TLDs](/en/blog/premium-web3-tlds/) guide covers where those fit. Keep the three straight and you'll price each correctly.

## How it differs from registrar-aftermarket flipping

![Editorial illustration of atomic settlement — coins and an NFT token interlocking like puzzle pieces between two hands, with a greyed-out escrow agent set aside](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

The mechanics diverge most sharply at settlement, which is where traditional flips get nervous. In the registrar world the buyer and seller face a standoff: the seller won't transfer before getting paid, the buyer won't pay before receiving the name, and a third-party [escrow](/en/glossary/escrow/) agent has to stand in the middle holding both sides. We unpack that classic workflow in [domain escrow explained](/en/blog/domain-escrow-explained/).

Onchain, that standoff can collapse into a single atomic transaction. Marketplace protocols built for NFTs let payment and transfer happen together or not at all. OpenSea's order protocol, Seaport, describes itself as a [marketplace protocol for safely and efficiently buying and selling NFTs](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), and the practical effect is that the buyer's payment and the seller's token swap in one settlement step. No agent holds the asset mid-deal — the contract enforces the swap. That's the mechanism we mean when we say tokenized marketplaces [replace escrow](/en/blog/how-tokenized-marketplaces-replace-escrow/).

The other big differences:

- **Custody is yours.** Instead of an account at a registrar, the asset sits in your wallet. That removes platform lock-in and account-seizure risk, but it hands you the full weight of [key management](/en/glossary/custodial-ownership/) — lose the keys, lose the name.
- **Liquidity is broader.** A tokenized name can list on general NFT marketplaces alongside every other ERC-721 asset, not just domain-specific aftermarkets, which widens the pool of eyeballs and bids.
- **Provenance is public.** Every prior sale and transfer is visible onchain, so a buyer can verify history without trusting a marketplace's word — useful for appraisal and for proving a name isn't stolen.

## The trade, step by step: acquire, custody, list, settle

![Editorial illustration of a four-step onchain flip flow — a magnifier over a name tag, a key and wallet, a marketplace storefront, and a circular coin-for-token swap](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### Acquire

You source onchain names the same way you source any flip — looking for mispriced assets — but the channels differ. ENS names come from the ENS registration market or secondary NFT marketplaces; the floor is transparent because anyone can read the registration fee onchain. Tokenized ICANN domains come from registering or [tokenizing a real `.com`](/en/blog/how-to-tokenize-your-com/) you already believe is undervalued, or buying one already tokenized. The discipline is identical to the rest of [domain trading](/en/glossary/domain-trading/): don't fall in love with a name no one will buy, and don't overpay on the way in, because the entry price sets your whole margin.

### Custody

This is the step with no equivalent in registrar flipping, and the one new flippers underestimate. Once the name is an NFT, *you* are the custody system. A hot wallet is convenient for active trading but is the most exposed; a hardware wallet or a [multi-sig](/en/glossary/multi-sig/) arrangement trades some convenience for far better protection of a name you're holding for months. Whether multi-sig is the right answer is a real question — we weigh it in [do multi-sig wallets actually improve security](/en/blog/do-multisig-wallets-actually-improve-security/). And because a lost key can mean a lost name, have a recovery plan before you need one; [recovering a tokenized domain after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) covers what's possible and what isn't.

### List

Listing an onchain name is a marketplace action, not a "for sale" landing page on a parked domain. You set a fixed buy-now price or open an auction directly on an NFT marketplace, and the listing is itself an onchain (or marketplace-signed) order that any buyer can fill. For tokenized ICANN domains you also keep the option of a normal sales-page funnel — the difference is that the close runs through a token swap rather than an escrow handoff. For tokenized names specifically, [DNS continuity](/en/blog/dns-on-tokenized-domains/) matters here: a well-built tokenized domain keeps resolving cleanly through the handover, so a live site doesn't go dark mid-sale.

### Settle

Settlement is the payoff for all the onchain plumbing. The buyer fills your order, payment and token transfer execute together, and ownership moves in one confirmed transaction. For an ENS name that's the end of it — the new holder now controls the `.eth` name. For a tokenized ICANN domain the token transfer is the deed, and the platform keeps the underlying DNS registration in sync so the buyer ends up controlling a real, resolvable domain. Either way, neither party had to move first, and no agent held the asset in between.

## What the numbers look like

Onchain flipping is still a portfolio game, not a lottery — most names you hold won't sell, and the wins fund the carry. But the headline sales show why the category gets attention. The most expensive ENS name sold to date, per The Block, was [paradigm.eth, which was purchased in October 2021 for 420 ETH (about $1.5 million at the time)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH); the same report notes [000.eth was purchased for 300 ETH ($315,000)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH) in July 2022.

Treat those as outliers, not a business model — the same reality check that applies to `.com` mega-sales applies double here, with the added wrinkle that onchain name prices ride crypto-market volatility. A floor measured in ETH can halve in dollar terms without a single name changing hands. Sober appraisal, not the highlight reel, is what keeps an onchain portfolio in the black.

## Where Namefi fits

The clean version of an onchain flip — wallet-held title, atomic settlement, no escrow standoff — is exactly the workflow [Namefi](https://namefi.io) is built to deliver for *real* ICANN domains. Tokenized ownership makes control of a `.com` auditable and transferable like an NFT, while DNS continuity keeps the name resolving through the handover, so a flipper gets the onchain liquidity without giving up the universal resolvability buyers actually pay for. If you want to bring a name you already own into this model, the walkthrough is in [how to tokenize your .com](/en/blog/how-to-tokenize-your-com/), and the platform trade-offs are in [choosing a domain tokenization platform](/en/blog/choosing-a-domain-tokenization-platform/).

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard (NFTs "also known as deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ENS Documentation — [ETH Registrar (registration pricing; transfer as an ERC-721 token)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea — [Seaport (marketplace protocol for safely and efficiently buying and selling NFTs)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block — [ENS domain 000.eth sells for 300 ETH; paradigm.eth remains the largest ENS sale at 420 ETH](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
