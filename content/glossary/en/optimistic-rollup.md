---
title: Optimistic Rollup
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A rollup that assumes off-chain transactions are valid by default and relies on a fraud-proof challenge window instead of cryptographic proofs.
keywords: ['optimistic rollup', 'fraud proof', 'challenge window', 'rollup', 'layer 2', 'arbitrum', 'optimism', 'base']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/
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
  - /en/glossary/zk-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/layer-2/
  - /en/glossary/ethereum/
---

An **optimistic rollup** is a type of [rollup](/en/glossary/rollup/) that "assume[s] offchain transactions are valid and don't publish proofs of validity for batches of transactions," relying instead on a fraud-proof challenge system to catch errors. After a batch of transactions is posted to layer 1, a challenge window—commonly around seven days—opens during which anyone running a full node can dispute the batch with a fraud proof; if unchallenged, the batch is treated as final. That window is why withdrawing funds from an optimistic rollup back to [Ethereum](/en/glossary/ethereum/) normally takes about a week, unlike a [ZK rollup](/en/glossary/zk-rollup/), which finalizes as soon as its validity proof is verified. Arbitrum, Optimism, and Base are the largest optimistic rollups by usage. For [tokenized domains](/en/glossary/tokenized-domain/) held on an optimistic rollup, that challenge window is a practical detail worth knowing: a transfer can be usable immediately on the rollup but not fully final against layer 1 until the window closes.
