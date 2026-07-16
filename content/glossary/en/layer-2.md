---
title: Layer 2
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A network built on top of a blockchain to make transactions faster and cheaper, like Base on Ethereum.
keywords: ['layer 2', 'rollup', 'scaling', 'optimistic rollup', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /en/blog/selling-domains-as-nfts/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/what-are-tokenized-domains/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/cross-chain-bridge/
  - /en/glossary/ethereum/
  - /en/glossary/tokenized-domain/
  - /en/glossary/blockchain/
---

A **layer 2** (L2) is a network that executes transactions off the main [blockchain](/en/glossary/blockchain/) (layer 1) and then posts compressed proofs or data back to it, inheriting the parent chain's security while dramatically reducing cost and latency. The two dominant designs are optimistic rollups — which assume transactions are valid and allow a fraud-proof challenge window — and ZK rollups, which post a cryptographic validity proof with every batch. Networks like Base, Optimism, Arbitrum, and zkSync are L2s on top of [Ethereum](/en/glossary/ethereum/). Moving computation to an L2 can reduce [gas](/en/glossary/gas/) fees by 10–100×, making micro-transactions and high-frequency asset transfers economically viable. For [tokenized domain](/en/glossary/tokenized-domain/) operations — routine transfers, DNS configuration updates, sub-domain issuance — executing on an L2 means users pay cents instead of dollars while the asset's provenance remains anchored to Ethereum mainnet. A [cross-chain bridge](/en/glossary/cross-chain-bridge/) moves assets between L1 and L2 when needed.