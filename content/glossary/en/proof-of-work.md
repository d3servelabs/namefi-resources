---
title: Proof of Work
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A consensus mechanism where miners compete to solve a computational puzzle to earn the right to add the next block.
keywords: ['proof of work', 'pow', 'bitcoin mining', 'hash puzzle', 'mining difficulty']
also_known_as: ['PoW']
level: 1
sources:
  - https://bitcoin.org/bitcoin.pdf
  - https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/
relatedArticles:
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-privacy-technologies/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/consensus-mechanism/
  - /en/glossary/proof-of-stake/
  - /en/glossary/blockchain/
  - /en/glossary/ethereum/
  - /en/glossary/hardware-wallet/
---

**Proof of Work** (PoW) is a [consensus mechanism](/en/glossary/consensus-mechanism/) in which miners compete to be the first to find a hash value below a target threshold, repeatedly hashing candidate block data until one succeeds. Finding a valid hash is deliberately expensive — it requires real computing power and electricity — while verifying a found solution is cheap, so the cost of the search itself is what deters attackers from rewriting history. Nodes treat the chain with the most accumulated work as the correct one, and a transaction becomes more irreversible as more blocks are mined on top of it, a property called probabilistic finality. Bitcoin introduced PoW in 2009 and remains its largest deployment; pre-2022 [Ethereum](/en/glossary/ethereum/) also used it before switching to [Proof of Stake](/en/glossary/proof-of-stake/). PoW's high energy use is the main trade-off weighed against newer [consensus mechanisms](/en/glossary/consensus-mechanism/) securing [blockchain](/en/glossary/blockchain/) networks today.
