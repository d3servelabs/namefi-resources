---
title: "Selling Domains as NFTs: Onchain Liquidity"
date: '2026-06-24'
language: en
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: "How selling a domain as an NFT works: listing mechanics, Seaport and OpenSea, buyer-restricted private sales, royalties, and gas and scam traps."
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['sell domain as NFT', 'domain NFT', 'tokenized domain sale', 'onchain domain liquidity', 'list domain NFT OpenSea', 'Seaport protocol', 'buyer restricted listing', 'private NFT listing', 'NFT royalties domains', 'ERC-721 domain', 'atomic transfer domain', 'sell tokenized domain', 'gas fees NFT sale', 'NFT domain scams', 'domain flipping onchain']
---

A traditional domain sale has a trust problem baked into it. The seller doesn't want to push the transfer before the money lands; the buyer doesn't want to wire funds before the name shows up in their account. The whole [escrow](/en/glossary/escrow/) industry exists to stand between those two reflexes. Selling a domain as an [NFT](/en/glossary/nft/) rearranges that standoff. When ownership of a real ICANN domain is also an [on-chain](/en/glossary/on-chain/) token, the name becomes a thing you can list, price, and hand over inside the same transaction that moves the money — no middleman holding the asset in the dark hours between payment and transfer.

This guide is about that liquidity layer: what actually happens when you list a [domain](/en/glossary/domain-trading/) NFT, how the marketplace plumbing works, when to use a buyer-restricted private listing instead of an open one, how royalties behave, and the gas and scam traps that quietly eat into onchain sales. It's a spoke in the broader [domain flipping](/en/blog/domain-flipping/) series, and it assumes you already know what a tokenized name is — if not, start with [what are tokenized domains](/en/blog/what-are-tokenized-domains/).

## What you're actually selling

First, a precision point this whole post depends on. A tokenized domain is not the same animal as an [ENS](/en/glossary/ens/) name or an Unstoppable name, and selling them is not the same act.

- An **[ENS](https://ens.domains) `.eth` name** lives entirely on Ethereum. It resolves through ENS-aware [wallets](/en/glossary/wallet/) and apps, not in a plain browser address bar, and ENS prices registration by length — per the ENS docs, [a `5+` letter `.eth` will cost you `5 USD` per year](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), with [a `4` letter `160 USD` per year](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year) and [a `3` letter `640 USD` per year](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year).
- An **Unstoppable name** (`.crypto`, `.x`, and friends) is a [Web3](/en/glossary/web3/) name minted outside the ICANN root.
- A **tokenized ICANN domain** is the one this series cares about: a real `example.com` that resolves in every browser, *plus* a token in your wallet that represents control of it. We compare the three head-to-head in [tokenized domain vs web3 domain](/en/blog/tokenized-domain-vs-web3-domain/).

The marketplace mechanics below apply to any of them, because they're all NFTs. But the *value* you're transferring is wildly different. When you sell an ENS name, the buyer gets an onchain-only identity. When you sell a tokenized `.com`, the buyer gets a universally resolvable business asset whose DNS keeps working through the handover. Don't let a slick listing flow trick you into pricing one like the other.

## How a domain NFT becomes liquid

Almost every domain NFT you'll trade is an [ERC-721](/en/glossary/erc-721/) token — the standard Wikipedia describes as [a technical framework, defining a set of rules and interfaces for creating and managing unique, non-fungible tokens (NFTs) on the Ethereum blockchain](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique). Being a standard token is what makes it liquid: any [marketplace](/en/glossary/marketplace/), wallet, or [smart contract](/en/glossary/smart-contract/) that speaks ERC-721 can list it, escrow it, or lend against it without your name being a special case.

That standardization is the whole liquidity story. A traditional domain only sells where a registrar or a domain marketplace lets it sell. A domain NFT sells anywhere ERC-721 is understood — which today is most of the NFT economy. That's the structural reason tokenization changes the trade, covered more fully in [how tokenization changes domain flipping](/en/blog/how-tokenized-marketplaces-replace-escrow/).

## Listing on a marketplace: Seaport and OpenSea

![Editorial illustration of a balance scale showing a domain NFT token on one side and a stack of coins on the other, joined by an interlocking chain link at the center under a marketplace awning](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

The dominant rails for NFT sales are [Seaport](https://docs.opensea.io/docs/seaport) and [OpenSea](https://opensea.io), and it helps to understand they're two different layers. Seaport is the protocol; OpenSea is one storefront on top of it. Per OpenSea's own docs, [Seaport is a marketplace protocol for safely and efficiently buying and selling NFTs on the blockchain](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), and [Seaport powers the OpenSea website](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website) — every order on OpenSea runs through it.

The mental model that matters for a seller is Seaport's two-sided structure: an **offer** and a **consideration**. The offer is what you put up (your domain NFT). The consideration is what you require in return (a price in ETH or a stablecoin, plus any fees and royalties routed to other parties). You sign that order once. Nothing moves until a buyer fulfills it, and when they do, the protocol settles both sides in a single atomic step — your token and their payment swap in the same transaction, or neither does. That atomicity is the [atomic transfer](/en/glossary/atomic-transfer/) property that replaces escrow: there is no window where one side has paid and the other hasn't delivered.

Listing in practice is a two-step ritual most sellers do once and then forget:

1. **Approval.** The first time you list from a wallet, you sign an approval letting the marketplace's contract move that token on your behalf when a sale fires. This costs gas; subsequent listings of other tokens in the same collection usually don't.
2. **The listing order.** You sign the actual order — price, currency, duration. On most marketplaces this signature is **gasless**: you're signing a message, not sending a transaction, so creating or canceling a fixed-price listing typically costs nothing until someone buys.

A practical consequence: the buyer, not you, usually pays the gas to execute a fixed-price purchase. OpenSea's seller guide puts it plainly — [Buyers pay gas fees when purchasing a fixed-price item](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item), while [Sellers pay gas fees when accepting offers](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers). So if you list and wait, the buyer eats the gas; if you actively accept an incoming bid, you do. That asymmetry should shape how you sell when the network is congested.

## Buyer-restricted private listings

![Editorial illustration of a domain NFT medallion locked in a glass display case visible to a small crowd, where only one specific person holds the matching golden key to open it](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

An open listing is fine for a commodity name you'd sell to anyone. But a lot of real domain deals are negotiated off-market first — a price agreed over email or a call — and then you just need a clean, trustless way to settle with *that specific buyer*. Listing such a name openly is a mistake: a third party watching the marketplace could snipe it at your agreed price before your buyer clicks.

The fix is a **buyer-restricted (private) listing**, and Seaport supports it natively because the consideration can name a required recipient. On OpenSea you set this in the listing flow: per their guide, you can [reserve the item for a specific buyer. To do so, click Reserve and enter their wallet address](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click). Only that wallet can fulfill the order. Everyone else sees the listing but can't buy it.

This is the onchain equivalent of a brokered, buyer-restricted settlement, and it's the pattern Namefi leans on for offer-driven sales: negotiate the number with a human, then settle it as a private listing so the agreed buyer — and only that buyer — can complete the atomic swap. You get the off-market deal's privacy *and* the onchain deal's no-escrow finality. Get the destination wallet address right, though: a single wrong character and you've reserved your five-figure name for an address nobody controls.

## Royalties: do they survive the sale?

Some domain NFTs carry a royalty — a percentage routed to the original issuer or a creator on every resale. The standard here is [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981), which exists, in its own words, so that contracts can [signal a royalty amount to be paid to the NFT creator or rights holder every time the NFT is sold or re-sold](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold).

Two things every flipper should internalize. First, EIP-2981 only *signals* a royalty; it doesn't *enforce* one. Whether the royalty is actually paid depends on the marketplace's policy, and the industry spent 2022–2023 making most royalties optional. Don't model your returns assuming a royalty will be honored on the next hop — it may not be. Second, royalties cut both ways for a flipper: a royalty you pay on the way out is a real cost on your margin, and any platform fee stacks on top. OpenSea's guide notes the storefront [typically charges a 1% fee to the seller](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller), and creator earnings, when they apply, come out of your proceeds too. Read the fee breakdown the marketplace shows before you confirm — those are estimates of *your* take-home, and they're the number that decides whether the flip was worth it.

## Gas and scam pitfalls to avoid

![Editorial illustration of a wallet protected under a glass dome with a shield, surrounded by warning-flagged hazards: a gas pump dripping a coin, a phishing hook snagging a signature-approval document, and a clipboard showing a swapped address](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

Onchain liquidity is real, but it comes with a new failure surface. The two big ones are gas and fraud.

**Gas.** Ethereum charges for computation. Per ethereum.org, [Gas refers to the unit that measures the amount of computational effort required to execute specific operations on the Ethereum network](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort), and it's paid in ETH. For a four-figure name on a congested day, the approval-plus-settlement gas can be a meaningful slice of your margin — and on a low-value name it can exceed the sale entirely. Two defenses: do your approval when the network is quiet, and consider listing on a lower-fee chain. This is one reason tokenized domains on Base, not just Ethereum mainnet, matter for flippers working smaller names.

**Scams.** The onchain world has its own con catalog, and domain NFTs are squarely in scope:

- **Wallet-address swaps.** Malware and clipboard hijackers silently replace a pasted address. Always verify the first and last characters of any buyer or recipient address against a second source before you sign.
- **Malicious "approval" signatures.** A fake marketplace or a phishing site may ask you to sign an approval that grants a contract sweeping power over your tokens. If you don't understand exactly what a signature authorizes, don't sign it. Treat any unexpected approval request as hostile.
- **Counterfeit listings.** Scammers mint look-alike tokens and list them as if they were the real tokenized domain. Buyers should verify the contract address against the issuer's published one; sellers should make sure their genuine listing is the one buyers find. This is partly why custody and provenance matter — see [recovering a tokenized domain after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) and the case for a [multi-sig](/en/glossary/multi-sig/) setup in [do multi-sig wallets actually improve security](/en/blog/do-multisig-wallets-actually-improve-security/).
- **Fake "support."** Nobody legitimate will DM you first asking for a seed phrase or a "validation" signature. The seed phrase never leaves your control. Full stop.

The throughline: onchain settlement removes counterparty risk from the *trade* and replaces it with operational risk in *your wallet*. The escrow agent is gone, and so is the human who used to catch a typo'd transfer. That responsibility is now yours.

## Where this leaves a flipper

Selling a domain as an NFT turns a name into something genuinely liquid: an ERC-721 token you can list gaslessly, settle atomically, reserve for a specific buyer, and move across a deep marketplace ecosystem instead of a single registrar's aftermarket. The escrow standoff that defines traditional sales largely dissolves. What it asks in return is onchain literacy — knowing what you're signing, what gas will cost, and which counterparties are real.

For the bigger picture on how tokenized names change the economics of the trade, the hub at [domain flipping](/en/blog/domain-flipping/) is the place to start, and [why tokenize domains](/en/blog/why-tokenize-domains/) makes the case for adding the onchain layer in the first place. If you want to try a sale end to end on a real, browser-resolvable name, [Namefi](https://namefi.io) is built for exactly this — a tokenized `.com` you can list and settle onchain while the DNS keeps resolving through the handoff.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- OpenSea Docs — [Seaport (marketplace protocol; powers OpenSea; offer/consideration model)](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [How to sell NFTs (reserve for a specific buyer; who pays gas; 1% seller fee)](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721 (non-fungible token standard on Ethereum)](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Ethereum Improvement Proposals — [EIP-2981 (NFT Royalty Standard)](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- ENS Docs — [.eth registration pricing by length ($5 / $160 / $640 per year)](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [Gas and fees (definition of gas)](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
