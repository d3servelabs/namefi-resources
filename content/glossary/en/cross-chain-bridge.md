---
title: Bridge (Cross-Chain)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A protocol that moves tokens or messages between blockchains that cannot natively talk to each other.
keywords: ['bridge', 'cross-chain', 'interoperability', 'token bridge', 'multi-chain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
---

A **bridge** (or cross-chain bridge) is a protocol that locks an asset on one [blockchain](/en/glossary/blockchain/) and mints a representative token on another, enabling value and data to move across networks that share no native communication channel. The most common pattern is "lock-and-mint": you deposit a token into a bridge contract on the source chain, and a custodian or decentralized oracle instructs a matching contract on the destination chain to issue a wrapped equivalent. Bridges connect [Ethereum](/en/glossary/ethereum/) mainnet to [layer-2](/en/glossary/layer-2/) rollups like Optimism or Base, and to entirely separate chains like Polygon or Solana. Because bridges hold large pools of locked assets, they are high-value attack targets — several have suffered nine-figure exploits. For tokenized domains, bridging enables an NFT issued on Ethereum to move to a cheaper layer-2 for low-cost transfers, then back to mainnet for DeFi collateral. Namefi's cross-chain strategy allows domain NFTs to settle where economics are best without sacrificing the security of the underlying Ethereum trust anchor. *Source: Ethereum Developer Documentation — Bridges.*
