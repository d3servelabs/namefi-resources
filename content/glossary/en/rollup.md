---
title: Rollup
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A layer 2 scaling technique that executes transactions off the main chain and posts the compressed data and result back to it.
keywords: ['rollup', 'layer 2', 'optimistic rollup', 'zk rollup', 'scaling', 'l2']
level: 1
sources:
  - https://l2beat.com/scaling/summary
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/optimistic-rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/layer-2/
  - /en/glossary/ethereum/
---

A **rollup** is a [layer 2](/en/glossary/layer-2/) network that executes transactions off the main chain (layer 1) and then periodically posts a compressed state commitment—along with the underlying transaction data—back to it, so the rollup's state can always be reconstructed and verified from layer 1 alone. L2BEAT, the leading tracker of these networks, defines rollups as systems whose state commitments are "validated by either Validity Proofs or... accepted optimistically and can be challenged via [a] Fraud Proof mechanism," which is exactly the split between [ZK rollups](/en/glossary/zk-rollup/) and [optimistic rollups](/en/glossary/optimistic-rollup/). Because the data lands on the base chain, a rollup inherits its parent chain's security rather than depending on a separate validator set the way a sidechain does. Arbitrum, Optimism, Base, zkSync, and Starknet are all rollups built on [Ethereum](/en/glossary/ethereum/). For [tokenized domains](/en/glossary/tokenized-domain/), rollups are what make routine actions—transfers, DNS updates, sub-domain issuance—affordable, since executing off the base chain can cut fees by 10–100x.
