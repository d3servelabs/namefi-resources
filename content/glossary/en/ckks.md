---
title: CKKS
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: CKKS is a homomorphic encryption scheme for approximate arithmetic on encrypted real or complex numbers.
keywords: ['CKKS', 'approximate homomorphic encryption', 'encrypted real numbers']
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
  - /en/glossary/bgv/
  - /en/glossary/tfhe/
  - /en/glossary/cryptographic-security/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**CKKS** is a [homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) scheme for approximate arithmetic on encrypted real or complex values. It can pack many values for vector-style numerical work, but rounding and approximation are inherent to the result. Workloads that require exact modular integer answers usually use [BFV](/en/glossary/bfv/) or [BGV](/en/glossary/bgv/) instead.
