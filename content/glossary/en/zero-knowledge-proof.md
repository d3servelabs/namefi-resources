---
title: Zero-Knowledge Proof
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A cryptographic method that lets one party prove a statement is true without revealing any information beyond its validity.
keywords: ['zero-knowledge proof', 'zkp', 'zk proof', 'zk-snark', 'zk rollup', 'validity proof']
also_known_as: ['ZK Proof', 'ZKP']
level: 1
sources:
  - https://ethereum.org/en/zero-knowledge-proofs/
  - https://ethereum.org/en/developers/docs/scaling/zk-rollups/
relatedArticles:
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/fully-homomorphic-encryption/
  - /en/glossary/secure-multiparty-computation/
  - /en/glossary/trusted-execution-environment/
  - /en/glossary/cryptographic-security/
  - /en/glossary/hash-function/
---

A **zero-knowledge proof** (ZKP, also called a ZK proof) lets a prover convince a verifier that a statement is true without revealing the statement's underlying data, satisfying three properties: completeness (valid inputs always pass), soundness (invalid inputs cannot be faked), and zero-knowledge itself (the verifier learns nothing beyond validity). ZK-rollups are the largest blockchain application, batching transactions off-chain and posting a single validity proof that a base layer verifies cheaply, while Zcash-style shielded payments use zk-SNARKs to hide transaction amounts and addresses while still proving correctness. Generating a proof is computationally expensive, but verifying one is fast, which is why ZKPs pair well with a [hash function](/en/glossary/hash-function/)-based commitment scheme for compact on-chain checks. Related privacy techniques include [fully homomorphic encryption](/en/glossary/fully-homomorphic-encryption/), [secure multi-party computation](/en/glossary/secure-multiparty-computation/), and [trusted execution environments](/en/glossary/trusted-execution-environment/), each trading off performance and trust assumptions differently. As tokenized assets like domains move on-chain, ZKPs are the primitive most likely to let owners prove eligibility or solvency for a transaction without exposing their full holdings, extending the [cryptographic security](/en/glossary/cryptographic-security/) model already protecting wallet keys.
