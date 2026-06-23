---
title: Layer 2 (Rollup)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A network built on top of a blockchain to make transactions faster and cheaper, like Base on Ethereum.
keywords: ['layer 2', 'rollup', 'scaling', 'optimistic rollup', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
---

A **layer 2** (L2) is a network that executes transactions off the main [blockchain](/en/glossary/blockchain/) (layer 1) and then posts compressed proofs or data back to it, inheriting the parent chain's security while dramatically reducing cost and latency. The two dominant designs are optimistic rollups — which assume transactions are valid and allow a fraud-proof challenge window — and ZK rollups, which post a cryptographic validity proof with every batch. Networks like Base, Optimism, Arbitrum, and zkSync are L2s on top of [Ethereum](/en/glossary/ethereum/). Moving computation to an L2 can reduce [gas](/en/glossary/gas/) fees by 10–100×, making micro-transactions and high-frequency asset transfers economically viable. For tokenized domain operations — routine transfers, DNS configuration updates, sub-domain issuance — executing on an L2 means users pay cents instead of dollars while the asset's provenance remains anchored to Ethereum mainnet. A [cross-chain bridge](/en/glossary/cross-chain-bridge/) moves assets between L1 and L2 when needed. Namefi leverages L2 infrastructure to make domain tokenization practical for everyday registrants, not just large portfolio holders. *Source: Ethereum Foundation — Layer 2.*
