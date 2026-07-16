---
title: What are xStocks? Why should domainers care?
date: '2025-07-02'
updated: '2026-07-14'
language: en
tags: ['faq', 'domains', 'tokenization']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
format: explainer
description: A clear explainer on xStocks—1:1-backed tokenized equities available on supported blockchains. Learn how xStocks work, how they differ from traditional shares, their risks, and how they fit the broader real-world-asset tokenization trend.
keywords: ['xStocks', 'what are xStocks', 'what is xStocks', 'xStocks crypto', 'tokenized stocks', 'tokenized equities', 'was sind xStocks', 'xStocks是什么', '什么是xstocks', 'que son los xStocks', 'unterschied xStocks traditionelle Aktien', 'Backed Finance', 'Kraken xStocks', 'Bybit xStocks', 'Solana tokenized stocks', 'on-chain equities', 'tokenization of real-world assets', 'RWA tokenization', 'tokenized domains', 'domain tokenization', 'Namefi']
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/onchain-domain-flipping/
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/dns/
  - /en/glossary/web3/
  - /en/glossary/tld/
---

You may have seen the word **xStocks** on a crypto exchange, in a trading app, or in a headline about "stocks on the [blockchain](/en/glossary/blockchain/)," and wondered what it actually means. Is an xStock a real share? A crypto coin? A bet on a stock price? And what does any of it have to do with domains?

This article answers the **"what"** directly: what xStocks *are*, how they *work*, who *issues* them, how they *differ* from traditional stocks, the *risks* to understand—and why this matters to anyone watching the broader **real-world-asset (RWA) tokenization** trend that [tokenized domains](/en/blog/what-are-tokenized-domains/) are also part of.

> A note up front: **xStocks are not a Namefi product.** We cover them here as an educational example of where asset tokenization is heading. Nothing in this post is financial, legal, or tax advice.

---

## The Short Definition

An **xStock** is a tokenized representation of a particular stock or ETF that is intended to be **backed 1:1** by the underlying security held in regulated custody. xStocks are **tokenized stocks** (also called *tokenized equities*): a blockchain-based way for eligible users to obtain economic exposure to securities such as Apple or Tesla. The token is not the issuer company's share itself and does not by itself confer ordinary shareholder rights.

In plain terms:

> An xStock is a crypto token that mirrors the economic value of an underlying security (for example, `AAPLx` tracks Apple and `TSLAx` tracks Tesla). On supported chains, it can be held in a self-custodial [wallet](/en/glossary/wallet/) and traded through eligible exchanges or decentralized protocols, subject to venue, liquidity, and jurisdiction restrictions.

Current xStocks product pages identify **Backed Assets (JE) Limited** as the issuer and describe eligible Kraken offerings through **Payward Digital Solutions Ltd.** The official integration page lists live issuance on **Solana, Ethereum, Mantle, TON, and Ink**; chain, venue, and product availability can change. xStocks are distributed through an ecosystem that includes exchanges, wallets, and DeFi protocols. Payward, Kraken's parent company, [closed its acquisition of Backed in January 2026](https://blog.kraken.com/news/kraken-2025-financials).

---

## How xStocks Work

The mechanics are simpler than the marketing sometimes makes them sound:

1. **A real share is custodied.** For each xStock token in circulation, the issuer is meant to hold one corresponding real share (or ETF unit) with a regulated custodian—so the supply is collateralized 1:1.
2. **A token is minted on-chain.** That holding is represented as a token (e.g. `AAPLx`) on a supported blockchain and can be held in a compatible self-custodial wallet.
3. **Trading hours depend on the venue.** Kraken describes xStocks trading as **24/5**, while on-chain venues can operate continuously; actual execution still depends on liquidity, market conditions, and platform access.
4. **Some venues integrate xStocks into DeFi.** Depending on the token and protocol, xStocks may be paired in liquidity pools, accepted as [collateral](/en/glossary/collateral/), or used in other on-chain strategies. Support is protocol-specific, not automatic.

On **dividends**: xStocks do not send a cash dividend to the holder's wallet. The [official xStocks integration documentation](https://xstocks.com/partner) says corporate actions use a token-rebasing mechanism; for a dividend, the holder's token balance increases while the token price is not adjusted upward to represent the distribution. Splits and other corporate actions are also reflected through the rebasing design.

The catalog and reported volume have continued to change since the initial 60-asset launch. Use the [current xStocks product list](https://xstocks.com/products) and the issuer's legal documents for the current instruments, contracts, and terms rather than relying on a fixed count in an article.

---

## How xStocks Differ From Traditional Stocks

This is the question many non-English searchers are really asking—*was sind xStocks*, *xStocks是什么*, *qué son los xStocks*, and especially *"how do xStocks differ from traditional stocks?"* Here's the honest comparison:

| Feature | Traditional Stock | xStock (Tokenized Stock) |
|---|---|---|
| What you legally hold | A share in the company | A token tracking the share's value |
| Voting rights | Yes (typically) | No |
| Dividends | Commonly paid in cash | Passed through by increasing token balance through rebasing, not as wallet cash |
| Where it lives | Brokerage account | Self-custodial crypto wallet |
| Trading hours | Exchange and broker hours | Venue-dependent; 24/5 on Kraken and potentially continuous on-chain |
| Settlement | T+1 (about one business day) | Near-instant on-chain |
| Composable with DeFi | No | Yes |
| Who you rely on | Broker, clearinghouse | Token issuer + custodian + blockchain |

The crucial point: **an xStock is not the share itself.** It gives you *economic exposure* to the share's price (and dividend value) but generally **does not convey shareholder rights** such as voting, and it carries **issuer and custody risk** that you don't have when you hold a share directly through a regulated broker.

---

## Risks and Considerations

xStocks are an interesting innovation, but they are not risk-free, and a balanced explainer has to say so:

- **Issuer & counterparty risk.** Your token's value depends on the issuer actually holding and maintaining the backing shares with its custodians. You take on the issuer's creditworthiness, operational, and solvency risk.
- **No ordinary shareholder rights.** No voting or direct shareholder claim against the underlying public company. Separate contractual token and redemption rights, if any, depend on the issuer's prospectus and applicable terms.
- **Liquidity risk.** On-chain markets for a given xStock may be thin, making it hard to exit at a fair price when you want to.
- **Legal and eligibility restrictions.** Tokenized-security rules and offering terms vary by country and venue. The current xStocks site says the products are unavailable to U.S. persons and restricted in Canada, the UK, Australia, and sanctioned jurisdictions. Eligibility and offering entities can change, so consult the applicable prospectus and risk disclosure.
- **Smart-contract & platform risk.** As with any on-chain asset, bugs, exploits, or platform downtime are possible.

Always check current eligibility and the issuer's risk disclosures for your jurisdiction before acting.

---

## Why Should Domainers and Namefi Users Care?

Here's the connection. xStocks aren't a domain story—but they *are* a vivid example of the same megatrend that **tokenized domains** belong to: the **tokenization of real-world assets (RWAs)**.

The broad pattern is similar across asset classes, but the legal and operational mechanics are not identical. A specialized off-chain system—securities custody for **equities**, registrar and registry records for **domains**—can be coordinated with an on-chain token layer. Depending on the product and its agreements, that layer may make the asset:

- **Wallet-native** — you hold it yourself instead of inside a hosted account.
- **Faster to settle on-chain** — while any separate legal, registrar, registry, compliance, payment, or [escrow](/en/glossary/escrow/) steps still apply.
- **Potentially composable** — when a marketplace, lender, or [DeFi](/en/glossary/defi/) protocol supports that token.
- **Accessible through more venues** — subject to product, jurisdiction, liquidity, and platform restrictions.

A [tokenized domain](/en/blog/what-are-tokenized-domains/) uses an NFT as a token-control layer coordinated with an [ICANN](/en/glossary/icann/) domain's off-chain registration and DNS records. Possession or transfer of that NFT is not, by itself, unconditional legal title or proof that every registrar, [registry](/en/glossary/registry/), policy, contact, or agreement step has completed. On-chain settlement can be fast, but it is only one part of a supported domain transfer or collateral workflow.

If you want to see the domain workflows this model may support, [Tokenized Domain Use Cases in 2026](/en/blog/tokenized-domain-use-cases-2026/) discusses collateralized lending, [fractional ownership](/en/glossary/fractional-ownership/), on-chain marketplaces, [leasing](/en/glossary/leasing/), and their limits. Availability depends on product support, agreements, policy, and counterparties.

One important difference worth keeping straight: an xStock represents exposure backed by a security held in custody. A Namefi domain NFT is instead a token-control record coordinated with a particular domain registration. It is not merely a price tracker, but neither does the token alone replace the registrar, registry, registration agreement, applicable policy, disputes, or legal rights. Namefi's [Terms of Service](https://namefi.io/tos) expressly preserve those limits and allow specified platform actions involving domain NFTs.

---

## Frequently Asked Questions

**What are xStocks?** xStocks are blockchain tokens issued by Backed Assets (JE) Limited that represent particular stocks and ETFs and are intended to be backed 1:1 by the underlying securities held in custody. The current product supports multiple blockchains; availability depends on chain, venue, and jurisdiction.

**Was sind xStocks? (What are xStocks, in German intent.)** xStocks are tokenized equities: crypto tokens that mirror the value of real shares (e.g. Apple, Tesla), held in a self-custodial wallet and tradable nearly around the clock.

**xStocks 是什么？/ 什么是 xStocks？ (What are xStocks, in Chinese intent.)** xStocks 是代币化股票（tokenized stocks），即在受支持的区块链上发行、以托管的真实股票或 ETF 作为 1:1 支持的代币，由 Backed Assets (JE) Limited 发行；可用链、平台、交易时间和地区资格以现行条款为准。

**¿Qué son los xStocks? (What are xStocks, in Spanish intent.)** Los xStocks son representaciones tokenizadas de acciones y ETF, respaldadas 1:1 por los valores subyacentes en custodia y emitidas en cadenas compatibles; la disponibilidad depende de la plataforma y la jurisdicción.

**Worin liegt der Unterschied zwischen xStocks und traditionellen Aktien? (How do xStocks differ from traditional stocks?)** A traditional stock is legal ownership of a share, normally with shareholder rights and broker/clearinghouse settlement. An xStock is a tokenized representation: it does not provide voting rights, passes dividends through by increasing token balances via rebasing instead of paying wallet cash, and adds issuer, custody, smart-contract, liquidity, and venue risk.

**Are xStocks the same as crypto?** xStocks are crypto *tokens*, but unlike Bitcoin or a [stablecoin](/en/glossary/stablecoin/) they track an individual equity's price. (For how dollar-pegged tokens differ, see [What Are Stablecoins?](/en/blog/what-are-stablecoins/).)

**Who issues xStocks?** Current official product pages identify Backed Assets (JE) Limited as issuer. Payward closed its acquisition of Backed in January 2026, and eligible offerings are distributed through Kraken and other ecosystem venues under their applicable terms.

**Can U.S. persons buy xStocks?** No—at the time of writing xStocks are not available to U.S. persons, nor in Canada, the UK, or Australia, among other restrictions. Check current eligibility for your jurisdiction.

**Do xStocks give voting rights or cash dividends?** They do not provide ordinary shareholder voting rights or pay wallet cash dividends. The official design passes dividend benefits through by increasing token balances via rebasing.

---

## The Bigger Picture

xStocks are evidence that **real-world-asset tokenization is attracting material market activity**. The provider reports substantial exchange and on-chain transaction volume, but those figures are provider metrics and change over time. Equities and domains remain different asset classes with different rights, controls, and failure modes; the useful comparison is the addition of an on-chain coordination layer, not legal equivalence.

If you want to go deeper on the domain side of this trend, start with [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) and then explore [Tokenized Domain Use Cases in 2026](/en/blog/tokenized-domain-use-cases-2026/). To put it into practice, visit [namefi.io](https://namefi.io) and follow us on X at [@namefi_io](https://x.com/namefi_io).

## Sources and further reading

- xStocks — [Partner integration and current technical FAQ](https://xstocks.com/partner) (supported chains, restrictions, and dividend rebasing)
- xStocks — [Current product list](https://xstocks.com/products) (issuer disclosure and current instruments)
- Kraken — [2025 full-year financial highlights](https://blog.kraken.com/news/kraken-2025-financials) (January 2026 closing of the Backed acquisition)
- Namefi — [Terms of Service](https://namefi.io/tos) (domain-token limits, ICANN compliance, and platform rights)

*This explainer is published in English; translated versions can help German, Spanish, and Chinese readers reach the same understanding of what xStocks are and how they relate to the wider tokenization movement.*
