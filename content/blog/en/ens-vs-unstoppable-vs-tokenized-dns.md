---
title: "ENS vs Unstoppable vs Tokenized DNS Domains"
date: '2026-06-24'
language: en
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS vs Unstoppable Domains vs tokenized ICANN DNS, compared on browser resolvability, renewals, and who actually controls the name."
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS vs Unstoppable Domains', 'ENS vs tokenized domains', 'Unstoppable Domains vs ENS', 'web3 domains comparison', 'tokenized DNS domains', 'ENS domain flipping', '.eth domains', '.crypto domains', 'do web3 domains resolve in browsers', 'ENS renewal fees', 'Unstoppable Domains no renewal', 'ICANN vs web3 domains', 'who controls a web3 domain', 'tokenized domain vs web3 domain', 'NFT domains compared']
---

If you are flipping names on-chain, the first decision is which kind of "on-chain name" you are even trading. The three categories most people lump together are not the same asset, and the differences decide whether the name resolves in a browser, whether you owe a renewal next year, and who actually controls it. This guide compares the three head-to-head: [ENS](/en/glossary/ens/) (`.eth`), [Unstoppable Domains](https://unstoppabledomains.com) (`.crypto`, `.x`, `.nft`), and tokenized real ICANN [DNS](/en/glossary/dns/) domains (the `.com`/`.io`/`.xyz` names you can [tokenize](/en/glossary/tokenize/) on [Namefi](https://namefi.io)).

They overlap in one way: each puts name ownership in your [wallet](/en/glossary/wallet/) as a token. They diverge on everything that matters for resale. If you only remember one thing, remember this: ENS and Unstoppable names live *outside* the ICANN root, while a tokenized DNS domain *is* an ICANN domain with a token bolted on. That single fact cascades into resolvability, renewals, and control.

## What each one actually is

![Editorial illustration of three name-token cards on small pedestals side by side — a hexagon .eth-style token, a rounded Web3 name badge, and a classic globe ICANN-domain card, in equal billing](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS** is a naming system on [Ethereum](/en/glossary/ethereum/). The official docs describe it plainly: [ENS maps human-readable names like 'alice.eth' to machine-readable identifiers such as Ethereum addresses](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names), content hashes, and metadata. A `.eth` name is issued as a token on Ethereum, and you [transfer their name just like with any other ERC721 token](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token) — so it is, mechanically, an [ERC-721](/en/glossary/erc-721/) [NFT](/en/glossary/nft/). Critically, `.eth` is not delegated by ICANN; it is a namespace ENS created on-chain.

**Unstoppable Domains** sells blockchain-native names like `.crypto`, `.x`, `.nft`, and `.dao`. These [domain names can also be minted as a non-fungible token (NFT) on the Ethereum blockchain](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token), and the company stores them in your wallet — its support docs say [Web3 domains are stored in your crypto wallet as digital assets (NFTs) and are fully owned by you](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets). Like `.eth`, these TLDs are not part of the ICANN root.

**Tokenized DNS domains** are different in kind. The underlying asset is an ordinary ICANN domain — `example.com`, `yourname.io` — registered through an accredited [registrar](/en/glossary/registrar/), with an on-chain token minted to mirror its ownership. We unpack the mechanics in [what are tokenized domains](/en/blog/what-are-tokenized-domains/), but the short version: it is one name with two synchronized layers, not a new namespace. For the broader category framing, see [tokenized domain vs web3 domain](/en/blog/tokenized-domain-vs-web3-domain/).

## Browser resolvability: does the name just work?

![Editorial illustration of three stacked browser address-bar windows — the top shows a green checkmark while the other two need a small puzzle-piece gateway plugin before they resolve](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

This is the cleanest dividing line, and for a flipper it is often the whole ballgame, because resolvability is what most end buyers are actually paying for.

A tokenized `.com` resolves everywhere a normal `.com` does — every browser, every email client, every CDN and certificate authority — because it *is* a normal `.com`. Nothing special is required of the visitor.

ENS and Unstoppable names do not clear that bar on their own. Unstoppable is candid that its names need help: [you can download our extension for domain resolution on Chrome & Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download), and they resolve natively only in a handful of crypto-friendly browsers like Brave and Opera. ENS `.eth` names are the same story in standard browsers without a resolver, gateway, or extension. That is not a knock on the engineering — it is a deliberate design choice that buys these systems freedom to iterate outside ICANN. But it changes who your buyer is: you are selling primarily into the [web3](/en/glossary/web3/) and wallet-native audience, not the general market that expects a name to load in plain Chrome.

One nuance worth knowing: ENS bridges *toward* DNS rather than away from it. Its docs note that [ENS supports DNS names, allowing users to import DNS names into ENS](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names) via [DNSSEC](/en/glossary/dnssec/). So a `.com` owner can project their real name into ENS — but that is the DNS name doing the resolving in the regular internet, with ENS adding an on-chain identity layer. It does not make `.eth` itself resolve in a standard browser.

## Renewals: do you owe money next year?

The renewal model is where the three diverge in a way that directly hits your carrying cost — and where a flipper can get a nasty surprise.

ENS `.eth` names carry an annual fee. The official registrar docs are explicit on pricing: [a 5+ letter .eth will cost you 5 USD per year. A 4 letter 160 USD per year, and a 3 letter 640 USD per year](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you), and [this fee is paid in ETH](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH). Miss it and there is a grace window, after which, per ENS, [90 days after a name expires (aka after the grace period), the name will go into a Temporary Premium Auction](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires). For short, valuable `.eth` names the renewal is a real line item.

Unstoppable Domains markets the opposite model: a one-time purchase. Its docs say Web3 domains [can't be taken away, don't require renewals, and are yours for life](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life). No annual bill is attractive for a buy-and-hold flipper, though "for life" is a claim about the protocol's intent, not an ICANN guarantee — these names exist only as long as the resolution infrastructure that reads them does.

Tokenized DNS domains follow normal ICANN economics: you pay a registrar's annual renewal, and gTLD registrations max out at a 10-year term. That is a recurring cost, but it is the same well-understood cost every `.com` investor already budgets for. The tokenization does not add a second renewal — the token tracks the one DNS registration underneath.

## Who actually controls the name

![Editorial illustration of three control panels each with a renewal clock and a key — one key held fully by a user hand, the other two reaching into a tall registry tower](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

"Self-custody" gets used loosely across all three, so be precise about what control means at each layer.

For ENS and Unstoppable, on-chain control is genuinely yours: hold the [private key](/en/glossary/private-key/), hold the name, with no registrar able to claw it back through a support ticket. That is the real appeal of [custodial ownership](/en/glossary/custodial-ownership/) being replaced by wallet custody. The catch is that "the name" only means something inside the resolution systems that honor it. If you control the token but the only places that resolve it are a browser extension and some dApps, your control is real but its *reach* is bounded by adoption.

For a tokenized DNS domain, control is layered. The token in your wallet governs on-chain ownership and transfer; the underlying name remains a real ICANN domain, which means it stays subject to renewal, ICANN policy, and [UDRP](/en/glossary/udrp/) disputes — the same rules every `.com` lives under. A reputable tokenization platform keeps the two layers in lockstep, so transferring the token moves the domain, with DNS continuity so the live site does not blink during a handover. You get wallet-native control *and* a name the entire internet already recognizes. The tradeoff is honest: you are not "outside the system," because the asset is a real domain that answers to real-world rules. We go deeper on the custody question in [recovering a tokenized domain after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/).

## Liquidity and where they sell

Because all three are [ERC-721](/en/glossary/erc-721/)-style NFTs (or close to it), they can list on NFT [marketplaces](/en/glossary/marketplace/) and transfer with an [atomic](/en/glossary/atomic-transfer/) buyer-pays-and-receives swap — no third-party [escrow](/en/glossary/escrow/) agent holding the asset mid-deal. That shared plumbing is exactly what makes on-chain names appealing to flip, and it is covered in [how tokenized marketplaces replace escrow](/en/blog/how-tokenized-marketplaces-replace-escrow/).

The buyer pools differ, though. ENS has the deepest secondary market of the three — premium `.eth` names have traded for serious money. CoinGecko records that [the most expensive crypto domain ever sold was "paradigm.eth", which sold for $1.51 million (420 ETH) on October 9, 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for), and The Block reported that [the Ethereum Name Service (ENS) domain 000.eth was purchased for 300 ETH ($315,000)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH). Those are real numbers, but treat them as outliers, the same way `Voice.com` is an outlier in the DNS world — they tell you a ceiling exists, not what a typical name fetches. Any "floor price" figure you see quoted is a moving estimate, not a fact.

Tokenized DNS domains tap a different and larger buyer universe: anyone who wants a real, universally resolvable domain *plus* wallet-native ownership. That is the audience that wants a name to load in any browser, run email, and carry an SSL certificate — without giving up the option to sell it as an NFT.

## Which one to flip

There is no single winner; there is a fit for your buyer.

- **Flip ENS `.eth`** if you are selling to a crypto-native audience that values short numeric or word names as on-chain identity, and you are comfortable carrying the annual renewal on anything worth holding.
- **Flip Unstoppable names** if your buyer wants a no-renewal, wallet-first web3 identity and resolvability in standard browsers is not their priority. See [premium web3 TLDs](/en/blog/premium-web3-tlds/) for how that namespace is valued.
- **Flip tokenized DNS domains** if you want the largest buyer pool and a name that *works* — a real ICANN `.com`/`.io`/`.xyz` you can hold, program, and sell on-chain, while it resolves for everyone. Start with [how to tokenize your .com](/en/blog/how-to-tokenize-your-com/), and if you are weighing platforms, [choosing a domain tokenization platform](/en/blog/choosing-a-domain-tokenization-platform/) walks the criteria.

For the bigger picture on why any of this beats the old escrow-and-trust model, the [domain flipping](/en/blog/domain-flipping/) hub ties the whole skill stack together, and [why tokenize domains](/en/blog/why-tokenize-domains/) covers the upside in depth. Whichever category you trade, know which asset is in your wallet before you quote a price — because resolvability, renewals, and control are not details, they are the product.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- ENS Docs — [ENS protocol: maps human-readable names to addresses](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- ENS Docs — [ETH Registrar: .eth transfers like any other ERC721 token; annual pricing (5 / 160 / 640 USD per year); fee paid in ETH; 90-day grace](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- ENS Docs — [ENS supports importing DNS names via DNSSEC](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Unstoppable Domains Support — [Web3 domains stored as NFTs in your wallet; no renewals, yours for life; browser extension required for Chrome & Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap — [Unstoppable Domains minted as NFTs on the Ethereum blockchain](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research — [Most expensive crypto domains: paradigm.eth sold for $1.51 million (420 ETH), Oct 9 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block — [000.eth purchased for 300 ETH ($315,000), second-largest ENS sale](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
