---
title: TFHE
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: TFHE is a homomorphic encryption family for Boolean and fixed-precision integer operations using frequent ciphertext refresh.
keywords: ['TFHE', 'encrypted Boolean circuits', 'programmable bootstrapping']
also_known_as: ['Fully Homomorphic Encryption over the Torus']
level: 1
sources:
  - https://docs.zama.org/tfhe-rs/get-started/getting-started
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
  - /en/glossary/ckks/
  - /en/glossary/cryptographic-security/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**TFHE**, short for Fully Homomorphic Encryption over the Torus, is a [homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) family suited to encrypted Boolean logic and fixed-precision integer operations. Implementations such as TFHE-rs use programmable bootstrapping to refresh ciphertexts while applying lookup functions. Its operation-by-operation model differs from the packed approximate arithmetic of [CKKS](/en/glossary/ckks/).
