---
title: Consensus Mechanism
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The rules a blockchain's participants follow to agree on a single, shared transaction history without a central authority.
keywords: ['consensus mechanism', 'blockchain consensus', 'sybil resistance', 'proof of work', 'proof of stake', 'finality']
level: 1
sources:
  - https://bitcoin.org/bitcoin.pdf
  - https://ethereum.org/en/developers/docs/consensus-mechanisms/
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
  - /en/glossary/proof-of-work/
  - /en/glossary/proof-of-stake/
  - /en/glossary/blockchain/
  - /en/glossary/ethereum/
  - /en/glossary/on-chain/
---

A **consensus mechanism** is the set of rules a [blockchain](/en/glossary/blockchain/)'s participants follow to agree on a single, shared history of transactions without a central authority deciding what counts as valid. It solves two problems at once: preventing the same unit of value from being spent twice, and letting mutually distrusting participants — including some who may act dishonestly — settle on one canonical ledger. Every mechanism answers this by defining who gets to propose the next block and what stops an attacker from proposing many fake identities to seize control, a property known as Sybil resistance. Common designs include [Proof of Work](/en/glossary/proof-of-work/), which uses computational cost, and [Proof of Stake](/en/glossary/proof-of-stake/), which uses an economic bond. On [Ethereum](/en/glossary/ethereum/) and other chains, the consensus mechanism in place determines how quickly and how absolutely an [on-chain](/en/glossary/on-chain/) asset transfer — including a tokenized domain sale — becomes final.
