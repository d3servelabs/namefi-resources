---
title: Digital Signature
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: Cryptographic proof, generated with a private key, that a transaction was authorized by the account owner and hasn't been altered.
keywords: ['digital signature', 'ECDSA', 'EdDSA', 'BLS signature', 'transaction signing', 'signature verification']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://eips.ethereum.org/EIPS/eip-2537
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
  - /en/glossary/private-key/
  - /en/glossary/public-key/
  - /en/glossary/hash-function/
  - /en/glossary/wallet/
  - /en/glossary/cryptographic-security/
---

A **digital signature** is cryptographic proof that a message or transaction was authorized by the holder of a specific [private key](/en/glossary/private-key/), without ever exposing that key. The signer runs the private key and the transaction data through a signing algorithm; anyone can then verify the result against the matching [public key](/en/glossary/public-key/) to confirm authenticity, and any change to the signed data invalidates the signature. Bitcoin and Ethereum use ECDSA over the secp256k1 curve for account signatures; other designs use EdDSA for deterministic signing or BLS signatures, which can be aggregated so a network can verify thousands of signatures — such as validator attestations — as one compact operation. A tokenized domain's transfers and DNS updates are authorized the same way: a valid digital signature from the [wallet](/en/glossary/wallet/) holding the domain's [NFT](/en/glossary/nft/) is what proves the owner approved the change.
