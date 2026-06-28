---
title: Cross-Chain Bridge
date: '2026-06-22'
language: en
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: A protocol that moves tokens or messages between blockchains that cannot natively talk to each other.
keywords: ['bridge', 'cross-chain', 'interoperability', 'token bridge', 'multi-chain']
also_known_as: ['Bridge']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/tokenized-domain-use-cases-2026/
  - /en/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/tokenized-domain/
  - /en/glossary/ethereum/
  - /en/glossary/web3/
  - /en/glossary/tokenize/
  - /en/glossary/registrar/
---

A **bridge** (or cross-chain bridge) is a protocol that locks an asset on one [blockchain](/en/glossary/blockchain/) and mints a representative token on another, enabling value and data to move across networks that share no native communication channel. The most common pattern is "lock-and-mint": you deposit a token into a bridge contract on the source chain, and a custodian or decentralized oracle instructs a matching contract on the destination chain to issue a wrapped equivalent. Bridges connect [Ethereum](/en/glossary/ethereum/) mainnet to [layer-2](/en/glossary/layer-2/) rollups like Optimism or Base, and to entirely separate chains like Polygon or Solana. Because bridges hold large pools of locked assets, they are high-value attack targets — several have suffered nine-figure exploits. For tokenized domains, bridging enables an NFT issued on Ethereum to move to a cheaper layer-2 for low-cost transfers, then back to mainnet for [DeFi](/en/glossary/defi/) [collateral](/en/glossary/collateral/).
