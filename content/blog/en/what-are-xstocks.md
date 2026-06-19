---
title: What are xStocks? Why should domainers care?
date: '2025-07-02'
updated: '2026-06-10'
language: en
tags: ['faq', 'domains', 'tokenization']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
format: explainer
description: A clear explainer on xStocks—tokenized stocks (tokenized equities) on Solana, issued by Backed Finance. Learn what xStocks are, how they work, how they differ from traditional stocks, the risks, and how they fit the broader real-world-asset (RWA) tokenization trend that tokenized domains are part of.
keywords: ['xStocks', 'what are xStocks', 'what is xStocks', 'xStocks crypto', 'tokenized stocks', 'tokenized equities', 'was sind xStocks', 'xStocks是什么', '什么是xstocks', 'que son los xStocks', 'unterschied xStocks traditionelle Aktien', 'Backed Finance', 'Kraken xStocks', 'Bybit xStocks', 'Solana tokenized stocks', 'on-chain equities', 'tokenization of real-world assets', 'RWA tokenization', 'tokenized domains', 'domain tokenization', 'Namefi']
---

You may have seen the word **xStocks** on a crypto exchange, in a trading app, or in a headline about "stocks on the blockchain," and wondered what it actually means. Is an xStock a real share? A crypto coin? A bet on a stock price? And what does any of it have to do with domains?

This article answers the **"what"** directly: what xStocks *are*, how they *work*, who *issues* them, how they *differ* from traditional stocks, the *risks* to understand—and why this matters to anyone watching the broader **real-world-asset (RWA) tokenization** trend that [tokenized domains](/en/blog/what-are-tokenized-domains/) are also part of.

> A note up front: **xStocks are not a Namefi product.** We cover them here as an educational example of where asset tokenization is heading. Nothing in this post is financial, legal, or tax advice.

---

## The Short Definition

An **xStock** is a token on a public blockchain that tracks the price of a single real-world stock or ETF—and that is intended to be **backed 1:1** by the underlying share held in custody by the issuer. xStocks are **tokenized stocks** (also called *tokenized equities*): a blockchain-based way to get price exposure to companies like Apple or Tesla without going through a traditional brokerage.

In plain terms:

> An xStock is a crypto token that mirrors the economic value of one share (e.g. `AAPLx` tracks Apple, `TSLAx` tracks Tesla), lives in a self-custodial wallet, and trades on crypto exchanges and decentralized protocols—largely outside traditional market hours.

xStocks are issued by **Backed Assets (a Backed Finance entity)** and run primarily on the **Solana** blockchain as standard SPL tokens. They are distributed through the **xStocks Alliance**—a group that includes exchanges and protocols such as **Kraken**, **Bybit**, and Solana DeFi venues like **Raydium**, **Jupiter**, and **Kamino**. In late 2025, Kraken announced it would **acquire Backed**, the company behind xStocks.

---

## How xStocks Work

The mechanics are simpler than the marketing sometimes makes them sound:

1. **A real share is custodied.** For each xStock token in circulation, the issuer is meant to hold one corresponding real share (or ETF unit) with a regulated custodian—so the supply is collateralized 1:1.
2. **A token is minted on-chain.** That holding is represented as a token (e.g. `AAPLx`) on Solana, which you can hold in a self-custodial wallet like Phantom or Solflare.
3. **It trades nearly around the clock.** Because it's an on-chain token, an xStock can be bought, sold, and moved **24/5** on exchanges—and effectively 24/7 on DeFi protocols—rather than only during the underlying stock market's open hours.
4. **It plugs into DeFi.** xStocks are *composable*: they can be supplied as collateral, paired in liquidity pools, or used in other on-chain strategies, the same way other crypto tokens are.

On **dividends**: xStocks do not pay cash dividends to your wallet. Instead, the issuer reinvests the dividend value into the underlying position and adjusts the token so its value reflects the distribution—an economic pass-through rather than a cash payout.

By early 2026, xStocks had grown into the largest tokenized-equity offering by transaction volume, expanding from an initial ~60 assets at launch (June 2025) toward a catalog of 100+ tokenized stocks and ETFs, with the issuer signaling ambitions to widen coverage further.

---

## How xStocks Differ From Traditional Stocks

This is the question many non-English searchers are really asking—*was sind xStocks*, *xStocks是什么*, *qué son los xStocks*, and especially *"how do xStocks differ from traditional stocks?"* Here's the honest comparison:

| Feature | Traditional Stock | xStock (Tokenized Stock) |
|---|---|---|
| What you legally hold | A share in the company | A token tracking the share's value |
| Voting rights | Yes (typically) | No |
| Dividends | Paid in cash | Reflected in token value, not paid as cash |
| Where it lives | Brokerage account | Self-custodial crypto wallet |
| Trading hours | Exchange hours (e.g. ~6.5 hrs/day) | 24/5 on exchanges, ~24/7 on DeFi |
| Settlement | T+1 (about one business day) | Near-instant on-chain |
| Composable with DeFi | No | Yes |
| Who you rely on | Broker, clearinghouse | Token issuer + custodian + blockchain |

The crucial point: **an xStock is not the share itself.** It gives you *economic exposure* to the share's price (and dividend value) but generally **does not convey shareholder rights** such as voting, and it carries **issuer and custody risk** that you don't have when you hold a share directly through a regulated broker.

---

## Risks and Considerations

xStocks are an interesting innovation, but they are not risk-free, and a balanced explainer has to say so:

- **Issuer & counterparty risk.** Your token's value depends on the issuer actually holding and maintaining the backing shares with its custodians. You take on the issuer's creditworthiness, operational, and solvency risk.
- **No shareholder rights.** No voting; no cash dividends; no direct legal claim on the company or its assets in a liquidation.
- **Liquidity risk.** On-chain markets for a given xStock may be thin, making it hard to exit at a fair price when you want to.
- **Regulatory uncertainty.** The legal status of tokenized securities is still evolving and varies by country. xStocks are offered to eligible clients in many jurisdictions but are **not available to U.S. persons** (and not in Canada, the UK, or Australia, among others). In the EU they have been treated within established securities frameworks.
- **Smart-contract & platform risk.** As with any on-chain asset, bugs, exploits, or platform downtime are possible.

Always check current eligibility and the issuer's risk disclosures for your jurisdiction before acting.

---

## Why Should Domainers and Namefi Users Care?

Here's the connection. xStocks aren't a domain story—but they *are* a vivid example of the same megatrend that **tokenized domains** belong to: the **tokenization of real-world assets (RWAs)**.

The pattern is identical across asset classes. Take something traditionally illiquid and locked inside a specialized system—**equities** behind brokerages, **domains** behind registrars—and give it a synchronized on-chain representation. Suddenly that asset becomes:

- **Wallet-native** — you hold it yourself instead of inside a hosted account.
- **Transferable in seconds** — no multi-day settlement or escrow ceremony.
- **Composable** — usable as collateral, in marketplaces, in [DeFi](/en/glossary/defi/).
- **Globally accessible** — tradable across borders, around the clock.

That's exactly what a [tokenized domain](/en/blog/what-are-tokenized-domains/) is: a real, ICANN-recognized domain (like `example.com`) whose ownership *also* lives as an NFT in your wallet, kept in sync with the DNS registry. The same mechanics that let an xStock settle in under a second can let a premium `.com` change hands—or be pledged as collateral—just as fast.

If you want to see what that unlocks for domains specifically, we've mapped it out in [Tokenized Domain Use Cases in 2026](/en/blog/tokenized-domain-use-cases-2026/): collateralized lending, fractional ownership, on-chain marketplaces, leasing, and more. xStocks show the broader market validating the *model*; tokenized domains apply that model to one of the internet's oldest and most valuable asset classes.

One important difference worth keeping straight: an xStock is a token that *tracks* an off-chain share you don't directly own, whereas a Namefi-tokenized domain *is* the real domain—the on-chain token and the registry record are two synchronized layers of the **same** asset, not a tracker of something held elsewhere.

---

## Frequently Asked Questions

**What are xStocks?** xStocks are tokenized stocks—blockchain tokens, issued by Backed and running primarily on Solana, that track the price of real stocks and ETFs and are intended to be backed 1:1 by the underlying shares held in custody.

**Was sind xStocks? (What are xStocks, in German intent.)** xStocks are tokenized equities: crypto tokens that mirror the value of real shares (e.g. Apple, Tesla), held in a self-custodial wallet and tradable nearly around the clock.

**xStocks 是什么？/ 什么是 xStocks？ (What are xStocks, in Chinese intent.)** xStocks 是代币化股票（tokenized stocks），即在区块链（主要是 Solana）上发行、按 1:1 锚定真实股票或 ETF 的代币，由 Backed 发行，可在加密钱包中自托管并近乎全天候交易。

**¿Qué son los xStocks? (What are xStocks, in Spanish intent.)** Los xStocks son acciones tokenizadas: tokens en blockchain (principalmente Solana) que replican el valor de acciones reales, respaldados 1:1 por las acciones subyacentes y negociables casi a toda hora.

**Worin liegt der Unterschied zwischen xStocks und traditionellen Aktien? (How do xStocks differ from traditional stocks?)** A traditional stock is legal ownership of a share, with voting rights, cash dividends, and broker/clearinghouse settlement during market hours. An xStock is a token that tracks a share's value: no voting rights, dividends reflected in token value rather than paid as cash, self-custodied in a wallet, settled on-chain near-instantly, and exposed to issuer and custody risk.

**Are xStocks the same as crypto?** xStocks are crypto *tokens*, but unlike Bitcoin or a stablecoin they track an individual equity's price. (For how dollar-pegged tokens differ, see [What Are Stablecoins?](/en/blog/what-are-stablecoins/).)

**Who issues xStocks?** Backed (Backed Finance), distributed via the xStocks Alliance including Kraken and Bybit; Kraken announced plans to acquire Backed in 2025.

**Can U.S. persons buy xStocks?** No—at the time of writing xStocks are not available to U.S. persons, nor in Canada, the UK, or Australia, among other restrictions. Check current eligibility for your jurisdiction.

**Do xStocks give voting rights or cash dividends?** No to voting; dividends are passed through as token-value adjustments rather than cash payouts.

---

## The Bigger Picture

xStocks are a clear signal that **real-world-asset tokenization has gone mainstream**—not as a slogan, but as billions in actual on-chain trading volume. Equities were one of the first big asset classes to make the jump. Domains—globally recognized, decades-proven, and already digital—are a natural next chapter.

If you want to go deeper on the domain side of this trend, start with [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) and then explore [Tokenized Domain Use Cases in 2026](/en/blog/tokenized-domain-use-cases-2026/). To put it into practice, visit [namefi.io](https://namefi.io) and follow us on X at [@namefi_io](https://x.com/namefi_io).

*This explainer is published in English; translated versions can help German, Spanish, and Chinese readers reach the same understanding of what xStocks are and how they relate to the wider tokenization movement.*
