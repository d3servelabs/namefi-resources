---
title: "Appraising ENS and Tokenized Domains: Reading Onchain Comps"
date: '2026-06-24'
language: en
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: "How to appraise ENS and tokenized domains using onchain comps, floor-versus-premium reasoning, and ENS club factors — and why it differs from DNS."
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['appraise ENS domains', 'ENS domain valuation', 'tokenized domain appraisal', 'onchain comps', 'domain comparable sales', 'NameBio comps', 'ENS floor price', 'ENS 999 club', 'ENS 10k club', 'how to value an ENS name', 'tokenized domain value', 'web3 domain appraisal', 'ERC-721 domain value', 'onchain sales history', 'domain floor vs premium']
---

Appraisal is the skill that decides whether a flip makes money. Sourcing tells you what's for sale and selling turns a name into a check, but the number in the middle — what a name is actually worth — is where the margin lives. That's true for a `.com` and it's true onchain, except the onchain world hands you something the [DNS](/en/glossary/dns/) aftermarket never could: a public, timestamped record of nearly every sale. This is the appraisal chapter of the broader [domain flipping](/en/blog/domain-flipping/) playbook, focused on the two assets you trade in [onchain domain flipping](/en/blog/onchain-domain-flipping/) — [ENS](/en/glossary/ens/) names and tokenized ICANN domains.

The method is the same one professional appraisers and real-estate agents use: comps. As Wikipedia defines them, [comparables (or comps) is a real estate appraisal term referring to properties with characteristics that are similar to a subject property whose value is being sought](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property). Domains have no ticker price, so you reason from what similar names recently sold for. The onchain twist is that "recently sold for" stops being a rumor and becomes a verifiable fact.

## Where the comps come from

![Editorial illustration of an appraiser figure with a magnifying glass reading a transparent on-chain ledger of recent comparable-sale price tags flowing out of a blockchain cube](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

For traditional domains, the canonical comp database is [NameBio](https://namebio.com/), a searchable archive of historical [domain](/en/glossary/domain-trading/) sales you can filter by keyword, extension, price, and date. It is the closest the DNS aftermarket has to a public price feed: you search for names like the one you're appraising, look at what they actually closed at, and build a defensible range from the evidence rather than a gut feeling. Treat the headline numbers as estimates — reported sales skew toward the ones worth reporting, and a database of closed deals can't tell you about the names that never sold — but as a starting point it beats every automated appraisal tool, which is why our guide to [how to value a domain name](/en/blog/how-to-value-a-domain-name/) leans on [comparable sales](/en/glossary/comparable-sales/) over algorithms.

Onchain, the comp data is even better, and it's free. Because an ENS name or a tokenized domain is an [NFT](/en/glossary/nft/) under the [ERC-721](/en/glossary/erc-721/) standard — which Ethereum's spec describes as a [standard API for NFTs within smart contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) — every transfer and sale is written to a public ledger. Marketplaces surface this directly: ENS names are [non-fungible tokens (NFTs) and can be sold on NFT marketplaces like OpenSea](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=ENS%20names%20are%20also%20non%2Dfungible%20tokens), and those marketplaces show you the full sale history, current listings, and floor for a collection without anyone having to self-report. The appraisal raw material — what did the last ten comparable names actually trade for — is sitting onchain, auditable, no paywall.

## Floor versus premium

![Editorial illustration of a price chart with a flat floor baseline of many equal small name-tiles and a few standout premium tiles rising high above the line](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

The single most useful frame for an onchain appraisal is floor versus premium, and it maps cleanly onto how these assets actually trade.

The **floor** is the cheapest available name in a recognizable category — the lowest ask in a [marketplace](/en/glossary/marketplace/) collection. For a class of similar names (say, five-letter `.eth` names or random four-digit numbers), the floor is your baseline: it's roughly what a generic, undifferentiated member of that set is worth right now. Floors move with the market and with hype, so any floor you quote is a snapshot, not a constant.

The **premium** is everything a specific name commands above that floor — for being shorter, a real dictionary word, a recognized brand, or a low number. Most of an appraiser's work is justifying the premium: the floor you can read off a screen, but the gap between the floor and what `crypto.eth` would fetch is a judgment call you defend with comps. The discipline is to anchor on the floor first, then argue the premium up from comparable sales, rather than starting from a dream number and working down.

ENS makes this concrete because its own registration pricing is tiered by length. Per the ENS docs, a [5+ letter .eth will cost you 5 USD per year](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), while four- and three-character names cost more to register by design. That protocol-level scarcity signal — shorter names cost more to even hold — tells you where the premium concentrates before you look at a single sale.

## ENS rarity and club factors

![Editorial illustration of ENS-style name tokens being sorted into rarity tiers as ranked badge shelves — a three-digit tier, a four-digit tier, a palindrome, and a short-name](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENS has a quirk no DNS extension shares: organized rarity tiers. The "clubs" are sets of names defined purely by shape, and membership is a strong, legible driver of value.

The best-known are the numeric clubs. The 999 Club is the 1,000 three-digit names from `000.eth` to `999.eth`; the 10k Club is the 10,000 four-digit names from `0000.eth` to `9999.eth`. Because the supply of each is fixed and tiny, they trade like a collectible series with a visible floor and a thin premium tail. Numbers are also language-neutral and hard to mistype, which is part of why they became a speculative market of their own. The same logic extends to short letter strings, palindromes, and emoji names: the rarer and more legible the pattern, the thicker the premium over floor.

The ceiling sales show how far the premium tail runs. The biggest ENS sale on record is `paradigm.eth`, which The Block reports was [purchased in October 2021 for 420 ETH (about $1.5 million at the time)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH), and `000.eth` — the lead member of the 999 Club — [was purchased for 300 ETH ($315,000)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH), [making it the second-largest sale measured in both ether and dollars](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale). Those are outliers and they're priced in ETH, so the dollar figure swings with the token — but they anchor the top of the curve. When you appraise a club name, you're locating it on a distribution whose floor and ceiling are both observable onchain. For where these names sit relative to other onchain assets, see [premium Web3 TLDs](/en/blog/premium-web3-tlds/) and the broader [ENS vs Unstoppable vs tokenized DNS](/en/blog/ens-vs-unstoppable-vs-tokenized-dns/) comparison.

## Appraising a tokenized ICANN domain is a DNS appraisal

Here's the line you must not blur. A tokenized ICANN domain is not an ENS name with a different label — it's a real `.com`, `.xyz`, or `.io` whose ownership is mirrored as a token, while the underlying name keeps resolving everywhere. As our explainer on [what tokenized domains are](/en/blog/what-are-tokenized-domains/) puts it, these are real DNS domains that *also* have an onchain layer, not a parallel namespace. The practical consequence for appraisal: you value a tokenized `.com` the way you value any `.com` — with DNS comps from NameBio and the usual fundamentals of length, keyword demand, and extension strength — because the buyer is paying for a universally resolvable name, not a wallet handle.

So the comp set splits cleanly. To appraise `acme.eth`, you pull ENS sales and club floors, because its value is crypto-native identity. To appraise a tokenized `acme.com`, you pull `.com` comps, because its value is a real website address that happens to settle onchain. Conflating the two is the most common appraisal error in this space — a tokenized `.com` and an `.eth` of the same root word are different products with different buyers and very different comps. We walk the trading-side version of this distinction in [ENS vs DNS domain flipping](/en/blog/ens-vs-dns-domain-flipping/), and the mechanics of why tokenization changes the trade in [how tokenization changes domain flipping](/en/blog/how-tokenization-changes-domain-flipping/).

## How onchain appraisal differs from DNS appraisal

The inputs rhyme, but four things genuinely differ once a name is a token.

**Comp data is verifiable, not reported.** A NameBio entry is a sale someone chose to disclose; an onchain sale is a [smart contract](/en/glossary/smart-contract/) event anyone can read. That removes a layer of trust and makes wash-trading the new thing to watch for instead of unreported deals.

**There's a live floor.** DNS names don't have a floor price; each is its own negotiation. A collection of onchain names does, and a moving floor changes the appraisal hour to hour in a way a `.com` valuation never does.

**Liquidity is structural.** A tokenized name settles in a single [atomic transfer](/en/glossary/atomic-transfer/) when the buyer pays — no escrow agent, no transfer window — which makes onchain [domain liquidity](/en/glossary/domain-liquidity/) higher and comps fresher. That's the same mechanism that lets you sell a name [as an NFT](/en/blog/selling-domains-as-nfts/) without a middleman; we cover it in [how tokenized marketplaces replace escrow](/en/blog/how-tokenized-marketplaces-replace-escrow/).

**Crypto-denominated prices add a second variable.** Most onchain comps are quoted in ETH. A name "worth 5 ETH" can swing thousands of dollars on token moves alone, so always note whether you're appraising in ETH or fiat — they tell different stories, and treating an ETH floor as a stable dollar number is how appraisals go wrong.

The throughline: onchain appraisal gives you better data and a faster market, but the core craft is unchanged. Anchor on the floor, justify the premium with real comparable sales, and price the right comp set for the right asset. A tokenized `.com` on a platform like [Namefi](https://namefi.io) is appraised as the real domain it is; an `.eth` is appraised as the onchain collectible it is. Get the comp set right and the rest is arithmetic.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- Wikipedia — [Comparables (the comps method of appraisal by similar recent sales)](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio — [searchable database of historical domain name sales](https://namebio.com/)
- Ethereum Improvement Proposals — [ERC-721: Non-Fungible Token Standard (standard API for NFTs within smart contracts)](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)
- ENS Documentation — [.eth registrar pricing by name length (5+ letter = $5/year)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block — [000.eth sold for 300 ETH ($315,000); paradigm.eth for 420 ETH (~$1.5M, Oct 2021); ENS names as NFTs on OpenSea](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
