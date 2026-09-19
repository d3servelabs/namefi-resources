---
title: BGV
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: BGV is a homomorphic encryption scheme for exact modular arithmetic on encrypted integers.
keywords: ['BGV', 'exact homomorphic encryption', 'encrypted modular arithmetic']
level: 1
sources:
  - https://github.com/microsoft/SEAL
  - https://github.com/openfheorg/openfhe-development
relatedArticles:
  - /en/blog/top-fhe-schemes/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-scaling-approaches/
relatedGlossary:
  - /en/glossary/fully-homomorphic-encryption/
  - /en/glossary/bfv/
  - /en/glossary/ckks/
  - /en/glossary/tfhe/
  - /en/glossary/cryptographic-security/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**BGV** is a [homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) scheme that evaluates exact modular additions and multiplications on encrypted integers. Like [BFV](/en/glossary/bfv/), it is useful when the result must be exact; libraries differ in their implementation and bootstrapping support. [CKKS](/en/glossary/ckks/) instead supports approximate numerical computation.
