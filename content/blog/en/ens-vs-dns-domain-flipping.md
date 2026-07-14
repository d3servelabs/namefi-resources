---
title: "ENS vs DNS Domain Flipping: What's Different"
date: '2026-06-24'
language: en
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "How flipping ENS .eth names differs from flipping traditional DNS domains: ownership, liquidity, renewal, gas, and what each is good for."
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'flipping ENS domains', 'ENS domain flipping', '.eth domain investing', 'flipping .eth names', 'ENS vs traditional domains', 'on-chain domain flipping', 'NFT domain liquidity', 'ENS renewal fees', 'ERC-721 domains', 'web3 domain flipping', 'sell ENS on OpenSea', 'ENS expiry grace period', 'tokenized domain flipping', 'ENS gas fees']
relatedArticles:
  - /en/blog/onchain-domain-flipping/
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/onchain-domain-marketplaces-compared/
  - /en/blog/selling-domains-as-nfts/
  - /en/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /en/topics/domain-investing/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

If you flip domains, you have probably watched the [ENS](/en/glossary/ens/) market from the sidelines and wondered whether it is the same game with a new coat of paint. It isn't. Flipping a `.eth` name and flipping a traditional `.com` rhyme — buy a good string cheap, sell it to someone who needs it more — but almost everything underneath is different: who can see your ownership, how a sale settles, what you pay to hold the name, and what "owning" it even means. This post walks the real differences so you can decide where your time and capital actually belong.

One clarification first, because the space is muddy. ENS `.eth` names are not the same thing as **tokenized DNS domains**. A `.eth` name lives entirely [on-chain](/en/glossary/on-chain/) and does not resolve in a normal browser without a resolver or bridge. A tokenized `.com` is a real [ICANN](/en/glossary/icann/) domain that *also* carries an on-chain token — it resolves everywhere a `.com` does. We dig into that three-way split in [tokenized domain vs web3 domain](/en/blog/tokenized-domain-vs-web3-domain/) and in the [ENS vs Unstoppable vs tokenized DNS](/en/blog/ens-vs-unstoppable-vs-tokenized-dns/) comparison. This article is specifically about ENS `.eth` flipping versus traditional DNS flipping — keep the third category in mind, because it borrows the best traits of both.

## What you're actually buying

![Editorial illustration of a self-custodied NFT name-token and key inside a wallet held in your hand, versus a leased registrar login and lease document locked by a third party](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

A traditional DNS domain is a registration: you pay an ICANN-accredited [registrar](/en/glossary/registrar/), and your name sits in a registry database. You don't own the string outright — you hold a renewable lease, and the control surface is a registrar login.

An ENS name is different in kind. As the ENS docs put it, [the Ethereum Name Service (ENS) is a distributed, open, and extensible naming system based on the Ethereum blockchain](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain). A registered `.eth` name is an [NFT](/en/glossary/nft/) — specifically an [ERC-721](/en/glossary/erc-721/) token — that lives in your [wallet](/en/glossary/wallet/). The ENS docs are explicit that users [transfer their name just like with any other ERC721 token](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token). ERC-721, the standard underneath it, is [a standard interface for non-fungible tokens, also known as deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds), and it [provides basic functionality to track and transfer NFTs](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs).

So the first difference is custody. With DNS, the registrar holds the keys to your account and the registry holds the authoritative record. With ENS, the [smart contract](/en/glossary/smart-contract/) holds the record and *you* hold the keys. That cuts both ways for a flipper, as we'll see — it removes a middleman from sales but puts the entire burden of [custody](/en/glossary/custodial-ownership/) on your own [seed phrase](/en/glossary/wallet/).

## Ownership is public, on-chain, and auditable

When you buy a `.com`, ownership is semi-private. WHOIS data is often redacted, transfer history is opaque, and a buyer largely has to take your word that the name is clean and unencumbered.

ENS inverts this. Because every registration, transfer, and sale is an on-chain transaction, the full provenance of a name is public and permanent. Anyone can read which [wallet](/en/glossary/wallet/) holds `crypto.eth`, when it last changed hands, and for how much. For a flipper this is double-edged. The upside: due diligence is trivial, fakes are hard, and a buyer can verify your ownership in seconds without an [escrow](/en/glossary/escrow/) agent vouching for it. The downside: your portfolio and your cost basis are visible to competitors, and a wallet that telegraphs "I'm a flipper" can invite worse counter-offers. Traditional domaining lets you stay quiet; ENS does not.

This transparency is the same property that makes on-chain names easier to value and trade programmatically — a theme we pick up in [appraising on-chain domains](/en/blog/appraising-onchain-domains/).

## Secondary-market liquidity: marketplaces, not brokers

![Editorial illustration of a one-step atomic swap at an NFT marketplace storefront versus a slow multi-step escrow path winding through a middleman](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

Here is where ENS genuinely changes the experience. Because a `.eth` name is an ERC-721 token, it is natively compatible with general-purpose NFT [marketplaces](/en/glossary/marketplace/) — OpenSea, Blur, and others — with no special domain-industry plumbing. You list it like any other NFT, and a sale settles through the marketplace's standard [smart contract](/en/glossary/smart-contract/).

That settlement is the headline difference. A traditional domain sale is a multi-day choreography: agree on price, open escrow, the buyer funds it, you push the [transfer](/en/glossary/atomic-transfer/) at the registrar, the registrar confirms, escrow releases. An ENS sale is an [atomic transfer](/en/glossary/atomic-transfer/): the buyer's payment and your token swap in a single transaction, or neither happens. No third party holds the asset mid-deal, which is the same mechanic that makes tokenized-domain sales escrow-free — see [how tokenized marketplaces replace escrow](/en/blog/how-tokenized-marketplaces-replace-escrow/) and the broader [on-chain domain marketplaces compared](/en/blog/onchain-domain-marketplaces-compared/).

Liquidity has a real catch, though. NFT marketplaces are liquid for *NFTs*, but a `.eth` name only sells to a buyer who specifically wants that name and is already crypto-native. A great `.com` can be sold to literally any business on earth; a great `.eth` is sold to the much smaller pool of people who hold ETH, run a wallet, and value an on-chain name. Faster settlement, thinner demand. Don't confuse "instant to transfer" with "easy to sell."

## The renewal and expiry model is not the same

![Editorial illustration of a forgiving grace-period safety net catching a falling domain tag versus a strict Dutch-auction clock with a descending price and a hand sniping the dropped name](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

Both systems charge you to keep a name, but the mechanics diverge in ways that matter to a portfolio.

Traditional DNS runs on registrar and registry terms. A [gTLD](/en/glossary/gtld/) registration can generally be held for up to ten years, but post-expiration handling is not one universal countdown. A registrar may delete an expired registration at different times under its published policy. After deletion, ICANN's [Expired Registration Recovery Policy](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en) generally provides a 30-day Redemption Grace Period for restoration through the deleting registrar, followed by a typical five-day Pending Delete phase if the name is not restored. Retail renewal pricing also varies by registrar: Verisign's [current `.com` fee schedule](https://www.verisign.com/assets/com-registrar-agreement.pdf) sets the underlying registry fee at USD $10.26 per domain-year through October 31, 2026, with Verisign [announcing USD $10.97 effective November 1, 2026](https://investor.verisign.com/news-releases/news-release-details/verisign-reports-first-quarter-2026-results).

ENS uses a length-based annual fee paid in ETH. Per the ENS docs, names of five or more characters cost about USD $5 per year, four-character names about USD $160, and three-character names about USD $640 — the short, scarce strings cost more to discourage hoarding (figures current in the linked documentation; ENS prices are USD-denominated and settled in ETH, so the exact ETH amount moves with the oracle rate). After a name lapses, the ENS docs specify a [90-day grace period](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires) before it becomes available for re-registration with a temporary premium through what the docs call [a 21-day Dutch auction](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction), where the premium starts high and decays toward zero. For a flipper, that public premium phase is both a risk (a lapsed valuable name becomes available to others) and an opportunity (a buyer can choose when the declining premium reaches an acceptable level).

The practical takeaway is not that one system always offers more time. ENS documents a 90-day grace period; DNS recovery timing depends on when the registrar deletes the name and on the applicable registry policy. The operational difference is what follows: an expired `.eth` name enters a visible temporary-premium re-registration process, while a DNS name may also be auctioned under registrar terms before registry deletion or later released after its registry lifecycle. In either system, renew before expiry rather than treating recovery as a portfolio-control mechanism.

## Gas and settlement costs

Traditional domain costs are comparatively predictable: a quoted renewal, occasional transfer fees, and any escrow or marketplace charge. You can forecast a portfolio's annual carry from the registrar's fee table, while still allowing for future price changes.

ENS adds a variable you don't fully control: gas. Registering, renewing, directly transferring, and settling a marketplace sale require on-chain transactions whose network fees move with Ethereum demand. But **not every marketplace action is itself an Ethereum transaction**. OpenSea says a seller may pay gas for the first collection approval, while later listings in that collection are gas-free; for a fixed-price sale the buyer pays settlement gas, whereas a seller pays gas when accepting an offer. A listing can therefore be an off-chain wallet signature even though the eventual sale settles on-chain. See OpenSea's current [gas-fee and payer breakdown](https://support.opensea.io/en/articles/8867014-who-pays-the-gas-fees-on-opensea).

That distinction changes the math on low-value flips. During congestion, gas for an actual renewal or settlement transaction can materially increase the all-in cost of a low-priced name, but the amount depends on the transaction, marketplace flow, payer, and timing. ENS base rent is USD-denominated and paid in ETH; gas is a separate network cost. Quote both at execution time, record who paid each charge, and do not model every listing as if it incurred a fresh on-chain fee.

## What each is good for

Neither is strictly better — they suit different flippers and different names.

**Traditional DNS flipping** wins when your buyer is a *business* rather than a crypto user: an end-user who needs `austinplumbing.com` for a website, email, and Google ranking. The buyer pool is the entire economy, the names work everywhere with zero friction, carry is predictable, and the playbook is mature. The cost is slow, escrow-bound settlement and opaque ownership. Most of the [domain flipping](/en/blog/domain-flipping/) craft — sourcing, [appraisal](/en/blog/how-to-value-a-domain-name/), outreach — was built here.

**ENS flipping** wins when the name's value is *native to crypto*: a clean wallet identity, a protocol or DAO handle, a short collectible string. Settlement is atomic, ownership is self-custodied, and the asset is composable with on-chain apps. The cost is a narrower buyer pool, gas exposure, a public temporary-premium process after the expiry grace period, and total responsibility for your own keys — lose the wallet and the name is gone, which is exactly why [recovering an on-chain name after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) and [multi-sig custody](/en/glossary/multi-sig/) matter so much more here than in DNS.

And there is a third path that doesn't force the choice. A **tokenized DNS domain** — a real `.com` with an on-chain token on top — gives you DNS's universal buyer pool *and* ENS's atomic, escrow-free settlement and self-custody. That's the lane [Namefi](https://namefi.io) is built for: tokenize a name you'd flip anyway, keep it resolving everywhere, and sell it on-chain without the escrow dance. If you're weighing the on-chain side seriously, the cluster pillar [on-chain domain flipping](/en/blog/onchain-domain-flipping/) and [how tokenization changes domain flipping](/en/blog/how-tokenization-changes-domain-flipping/) lay out the full picture, and [selling domains as NFTs](/en/blog/selling-domains-as-nfts/) covers the listing mechanics.

## The bottom line

ENS and DNS flipping share a spirit and almost none of their plumbing. ENS gives you public ownership, NFT-marketplace [liquidity](/en/glossary/domain-trading/), and atomic settlement — at the price of a thinner buyer pool, gas exposure, a public post-grace premium process, and self-custody risk. DNS gives you a universal buyer pool and comparatively forecastable carry — at the price of registrar-specific expiry handling and slower, often escrow-mediated, opaque transfers. The smartest flippers don't pick a tribe; they match the name to the market. And increasingly they reach for tokenized DNS to stop choosing at all.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- ENS Docs — [What is ENS? (distributed naming system on the Ethereum blockchain)](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Docs — [ETH Registrar (.eth names transfer like any ERC721 token; grace period and Dutch auction on expiry; length-based annual fees)](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard ("a standard interface for non-fungible tokens, also known as deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- OpenSea Help Center — [Who pays gas for approvals, listings, fixed-price purchases, and accepted offers](https://support.opensea.io/en/articles/8867014-who-pays-the-gas-fees-on-opensea)
- ICANN — [Expired Registration Recovery Policy (registrar deletion, 30-day RGP, DNS interruption, and fee disclosure)](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en)
- ICANN — [Domain renewal and expiration FAQs (30-day RGP followed by five-day Pending Delete)](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en?6b790461_page=2)
- Verisign — [`.com` registry-registrar agreement and USD $10.26 fee schedule effective September 1, 2024](https://www.verisign.com/assets/com-registrar-agreement.pdf)
- Verisign — [First-quarter 2026 results and announced `.com` registry-fee increase effective November 1, 2026](https://investor.verisign.com/news-releases/news-release-details/verisign-reports-first-quarter-2026-results)
