---
title: BFV
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: BFV is a homomorphic encryption scheme for exact modular arithmetic on encrypted integers.
keywords: ['BFV', 'exact homomorphic encryption', 'encrypted integers']
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
  - /en/glossary/bgv/
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

**BFV** is a [homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) scheme for exact arithmetic on encrypted integers modulo a chosen plaintext modulus. It suits bounded sums and products where approximate answers are unacceptable. Unlike [CKKS](/en/glossary/ckks/), BFV does not natively target approximate real-number arithmetic.
