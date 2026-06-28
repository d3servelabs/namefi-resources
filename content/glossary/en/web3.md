---
title: Web3
date: '2025-06-30'
language: en
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: A vision of the internet on public blockchains where users own their data, assets, and identity through their own keys, not platform accounts.
keywords: ['Web3', 'decentralized web', 'blockchain internet', 'user ownership', 'peer-to-peer', 'decentralization', 'cryptocurrency', 'smart contracts', 'DeFi', 'NFT']
level: 2
sources:
  - https://ethereum.org/en/web3/
  - https://web3.foundation/about/
  - https://en.wikipedia.org/wiki/Web3
  - https://www.wired.com/story/web3-blockchain-decentralization-explained/
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/registry/
  - /en/glossary/tld/
---

**Web3** (also written *Web 3.0*) is a proposed paradigm for the internet in which core infrastructure runs on public [blockchain](/en/glossary/blockchain/) networks, allowing participants to own and control their data, digital assets, and online identities through cryptographic keys rather than accounts managed by centralised platforms.

## How Web3 differs from Web1 and Web2

The term is commonly explained through a three-generation model of the web:

- **Web1 (≈ 1991–2004)** — static, read-only pages. Users consumed content published by webmasters; there was little interactivity or user-generated material.
- **Web2 (≈ 2004–present)** — the participatory, platform-driven web. Social networks, search engines, and cloud services let anyone publish and interact, but the underlying data, identities, and monetisation flows are owned and controlled by a small number of large platforms (Google, Meta, Amazon, and their peers).
- **Web3 (proposed)** — a read/write/own web. Users hold their own keys, carry their identity and assets across applications without a central custodian, and interact through open protocols rather than proprietary APIs.

The phrase was [coined by Ethereum co-founder Gavin Wood in 2014](https://ethereum.org/en/web3/) to describe a suite of technologies he believed were necessary to build a less trust-dependent internet. It gained mainstream attention in the 2020–2022 period alongside the growth of [DeFi](/en/glossary/defi/) and NFT markets.

## Core technologies

Web3 applications are typically built on some combination of the following:

- **[Smart contracts](/en/glossary/smart-contract/)** — self-executing code deployed [on-chain](/en/glossary/on-chain/) that enforces rules without a centralised operator. They are the foundational primitive for decentralised applications (dApps).
- **Public blockchains** — permissionless, append-only ledgers (Ethereum being the most widely used for general-purpose applications) that provide a shared source of truth without a trusted intermediary.
- **Cryptographic wallets** — software (or hardware) that manages private keys and signs transactions. A [wallet](/en/glossary/wallet/) address functions as a universal, portable identity across compatible applications.
- **Tokens and tokenisation** — the ability to [tokenize](/en/glossary/tokenize/) assets, including fungible currencies, governance rights, or unique digital objects (NFTs), as entries on a public ledger that any application can read and verify.
- **Decentralised storage** — protocols such as IPFS and Arweave that replicate content across many nodes so no single entity can censor or remove it.
- **[DAOs](/en/glossary/dao/) (Decentralised Autonomous Organisations)** — on-chain entities whose rules and treasury are governed collectively by token holders rather than a board of directors.

## Identity and naming

One of the structural differences between Web2 and Web3 is the treatment of identity. In Web2, an identity is a username and password stored in a company's database — the platform can deactivate it at any time. In Web3, identity is derived from a public/private key pair controlled by the holder.

Human-readable naming layers, such as the [Ethereum Name Service (ENS)](/en/glossary/ens/), map cryptographic addresses to readable names (e.g. `alice.eth`) in a registry that lives entirely on-chain. These names can serve as payment addresses, login identifiers, and decentralised website pointers simultaneously, without any central authority able to revoke them so long as the owner controls the corresponding key.

The Web3 Foundation, [established by Gavin Wood and others](https://web3.foundation/about/), funds research and development of decentralised and fair internet infrastructure, with particular emphasis on interoperability protocols.

## Criticisms and open questions

Web3 is [contested among technologists and economists](https://www.wired.com/story/web3-blockchain-decentralization-explained/). Frequently cited concerns include:

- **Scalability** — public blockchains process far fewer transactions per second than centralised databases, and fees spike under load. Layer-2 networks (rollups, sidechains) mitigate this but add complexity.
- **User experience** — managing private keys, gas fees, and transaction confirmations is significantly harder than logging in with a social account. Seed-phrase loss means permanent loss of assets, with no account-recovery path.
- **Recentralisation** — in practice, much of the Web3 ecosystem depends on a small number of infrastructure providers (e.g. Infura and Alchemy for RPC access, OpenSea for NFT liquidity, a handful of stablecoin issuers). Critics argue this recreates the power concentrations Web3 aimed to eliminate, only with different incumbents.
- **Speculation and financialisation** — the market cycles around cryptocurrencies and NFTs have led observers to question whether token-based incentives produce sustainable ecosystems or primarily reward early holders.
- **Energy consumption** — proof-of-work blockchains historically had large carbon footprints; Ethereum's 2022 transition to proof-of-stake reduced its energy use by [approximately 99.95%](https://ethereum.org/en/energy-consumption/), though some proof-of-work chains remain significant consumers.
- **Regulatory uncertainty** — whether tokens constitute securities, how DAOs are treated as legal entities, and cross-border enforcement of smart-contract disputes remain unresolved in most jurisdictions.

Proponents counter that many of these are engineering problems that improve over time, and that the baseline of trustless, open protocols is worth the present trade-offs.

## Relevance to domains

Traditional domain names operate through a centralised hierarchy maintained by ICANN and delegated to registries and registrars — the owner of a domain name ultimately depends on a registrar keeping the record active. Web3 introduces an alternative model: on-chain name registries where ownership is encoded as a token held in the owner's wallet, with no registrar able to revoke it unilaterally.

This affects several aspects of how domains function:

- **Censorship resistance** — a domain whose ownership record lives on a public blockchain cannot be seized through a registrar policy change or court order targeting the registrar.
- **Composability** — on-chain names can be read and acted upon by smart contracts, enabling payment routing, decentralised website resolution, and credential issuance within a single identifier.
- **Secondary markets** — because on-chain names are tokens, they can be transferred peer-to-peer or sold through decentralised markets without requiring a registrar to facilitate the transfer.
- **Interoperability** — standards such as ENS allow a single name to resolve across multiple applications (wallets, browsers, dApps) without each application needing to query a proprietary API.

The trade-off is that blockchain-based names have limited resolution in the conventional DNS, require the owner to manage their own keys, and depend on the continued operation of the underlying chain.
