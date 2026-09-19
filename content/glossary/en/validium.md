---
title: Validium
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A validium proves off-chain state transitions on a settlement chain but keeps recovery data outside that chain.
keywords: ['validium', 'off-chain data availability', 'validity proof']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/scaling/validium/
  - https://docs.starkware.co/starkex/con_data_availability.html
relatedArticles:
  - /en/blog/top-rollup-types/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-virtual-machines/
relatedGlossary:
  - /en/glossary/rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/volition/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

A **validium** uses a validity proof to let a settlement chain check state transitions, while keeping the data needed to reconstruct balances off that chain. Unlike a [ZK-rollup](/en/glossary/zk-rollup/) or another strict [rollup](/en/glossary/rollup/), its exit guarantee depends on an external [data-availability](/en/glossary/data-availability/) mechanism such as a committee. If that data is withheld, users may be unable to construct withdrawal proofs.
