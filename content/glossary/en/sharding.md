---
title: Sharding
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A scaling technique that splits a blockchain's validation work across multiple parallel subsets of nodes instead of one.
keywords: ['sharding', 'shard', 'scalability trilemma', 'data availability sampling', 'ethereum sharding']
level: 1
sources:
  - https://vitalik.eth.limo/general/2021/04/07/sharding.html
  - https://ethereum.org/en/developers/docs/data-availability/
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
  - /en/glossary/data-availability/
  - /en/glossary/rollup/
  - /en/glossary/layer-2/
  - /en/glossary/blockchain/
  - /en/glossary/ethereum/
---

**Sharding** is a scaling technique that splits a blockchain's validation work across multiple parallel subsets of nodes, called shards, so that no single node has to process the entire network's transaction load. Vitalik Buterin frames it as a way to satisfy all three legs of the [blockchain](/en/glossary/blockchain/) scalability trilemma—scalability, decentralization, and security—at once, by randomly sampling validators into committees that each verify a different shard in parallel rather than concentrating trust in a small group or a single chain. The technique that makes sharding safe without forcing every node to download every shard's full data is data availability sampling, where light nodes verify small random pieces of a shard's data instead of the whole thing; see [data availability](/en/glossary/data-availability/). Sharding is distinct from [rollups](/en/glossary/rollup/), which scale by moving execution off-chain rather than by splitting the base chain's own validation work. For [tokenized domains](/en/glossary/tokenized-domain/) and other on-chain assets, a sharded base chain's throughput headroom matters most at the [layer 2](/en/glossary/layer-2/) level, where most everyday domain transactions actually settle.
