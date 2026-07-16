---
title: Data Availability
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: The confidence that the data needed to verify a block was actually published and is available to network participants.
keywords: ['data availability', 'da', 'data availability sampling', 'das', 'celestia', 'eigenda', 'rollup data']
also_known_as: ['DA']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/data-availability/
  - https://celestia.org/what-is-celestia/
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
  - /en/glossary/sharding/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/layer-2/
---

**Data availability** (DA) is the confidence a network can have that the data required to verify a block was actually published and is available to anyone who wants to check it—not just summarized or promised. It matters most for [rollups](/en/glossary/rollup/) and light clients, which rely on strong data guarantees without downloading and storing every byte of transaction data themselves; a rollup operator that posts an invalid state commitment without making the underlying data available could go undetected. **Data availability sampling** (DAS) solves this efficiently: a light node downloads only small, randomly selected pieces of a block's data and, using erasure coding, can still become confident the full data was published. Dedicated DA layers such as Celestia and EigenDA now let rollups post their data somewhere cheaper than [Ethereum](/en/glossary/ethereum/) mainnet while still getting a data-availability guarantee. Rollups that use an external DA layer instead of posting to layer 1 are sometimes called validiums or optimiums. For [tokenized domains](/en/glossary/tokenized-domain/), the DA layer a rollup chooses is part of what determines how strongly a domain NFT's ownership history is anchored and verifiable.
