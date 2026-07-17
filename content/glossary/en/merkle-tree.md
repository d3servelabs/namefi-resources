---
title: Merkle Tree
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A tree of hashes that commits to a large dataset in one root hash, letting anyone verify a single item with a short proof.
keywords: ['merkle tree', 'hash tree', 'merkle root', 'merkle proof', 'merkle branch', 'SPV']
also_known_as: ['Hash Tree']
level: 1
sources:
  - https://developer.bitcoin.org/devguide/block_chain.html
  - https://developer.bitcoin.org/devguide/operating_modes.html
relatedArticles:
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-scaling-approaches/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/hash-function/
  - /en/glossary/digital-signature/
  - /en/glossary/blockchain/
  - /en/glossary/on-chain/
  - /en/glossary/cryptographic-security/
---

A **Merkle tree** (or hash tree) repeatedly pairs and hashes data items — transactions, account balances, or other records — until a single hash, the Merkle root, represents the entire set. Bitcoin stores this root in every block header, and Ethereum stores three separate roots covering state, transactions, and receipts. The payoff is that proving one item belongs to the set only requires that item plus a short "Merkle branch" of sibling hashes, not the entire dataset — the technique behind lightweight (SPV) clients that verify a transaction without downloading the full [blockchain](/en/glossary/blockchain/). This same structure secures [on-chain](/en/glossary/on-chain/) domain ownership: a tokenized domain's record is committed into the chain's state tree, so its ownership can be verified with a compact proof rather than a full copy of the ledger.
