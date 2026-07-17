---
title: ZK Rollup
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A rollup that submits a cryptographic validity proof with every batch of transactions instead of relying on a fraud-proof challenge window.
keywords: ['zk rollup', 'zero-knowledge rollup', 'validity proof', 'zk-snark', 'zk-stark', 'zksync', 'starknet']
also_known_as: ['Zero-Knowledge Rollup', 'Validity Rollup']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/scaling/zk-rollups/
  - https://l2beat.com/scaling/summary
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
  - /en/glossary/rollup/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/layer-2/
  - /en/glossary/ethereum/
---

A **ZK rollup** (also called a Zero-Knowledge Rollup or Validity Rollup) is a type of [rollup](/en/glossary/rollup/) that submits a cryptographic validity proof alongside every batch of transactions rather than assuming validity by default. Because the base chain verifies that proof on-chain, "there are no delays when moving funds from a ZK-rollup to Ethereum... because exit transactions are executed once the ZK-rollup contract verifies the validity proof"—unlike an [optimistic rollup](/en/glossary/optimistic-rollup/), which needs a multi-day fraud-proof challenge window before a withdrawal is final. ZK rollups bundle thousands of transactions per batch and post only minimal summary data to [Ethereum](/en/glossary/ethereum/), using proof systems such as zk-SNARKs or zk-STARKs. zkSync Era, Starknet, and Linea are prominent ZK rollups. The trade-off is computational: generating validity proofs is expensive, and full compatibility with Ethereum's virtual machine is technically harder to build than a fraud-proof system. For [tokenized domains](/en/glossary/tokenized-domain/), a ZK rollup gives the fastest path to layer-1-final ownership transfers of any rollup design.
