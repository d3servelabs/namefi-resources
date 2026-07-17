---
title: Hash Function
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A one-way function that turns any input into a fixed-size fingerprint, used to chain blocks and detect tampering.
keywords: ['hash function', 'cryptographic hash function', 'SHA-256', 'Keccak-256', 'hashing', 'collision resistance']
also_known_as: ['Cryptographic Hash Function']
level: 1
sources:
  - https://developer.bitcoin.org/devguide/block_chain.html
  - https://ethereum.org/en/developers/docs/accounts/
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
  - /en/glossary/merkle-tree/
  - /en/glossary/digital-signature/
  - /en/glossary/public-key/
  - /en/glossary/blockchain/
  - /en/glossary/cryptographic-security/
---

A **hash function** (also called a cryptographic hash function) takes an input of any size and deterministically produces a fixed-size output, or digest, such that changing even one bit of the input scrambles the output completely and finding two inputs with the same digest is computationally infeasible. Bitcoin chains its blocks by embedding the double SHA-256 hash of each block header inside the next one, so altering any past block would change its hash and break every block after it. Ethereum uses a related function, Keccak-256, to derive account addresses from [public keys](/en/glossary/public-key/) and to build its [Merkle trees](/en/glossary/merkle-tree/). This tamper-evidence is also what underpins [cryptographic security](/en/glossary/cryptographic-security/) for a tokenized domain: the [NFT](/en/glossary/nft/) representing ownership is committed into the same hash-secured chain state as every other on-chain asset.
