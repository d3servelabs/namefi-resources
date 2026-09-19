---
title: STARK
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A STARK is a transparent, hash-based proof system for verifying computations without a trusted setup ceremony.
keywords: ['STARK', 'transparent proof', 'scalable transparent argument']
also_known_as: ['Scalable Transparent Argument of Knowledge']
level: 1
sources:
  - https://eprint.iacr.org/2018/046
  - https://docs.starknet.io/learn/protocol/intro
relatedArticles:
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/groth16/
  - /en/glossary/plonk/
  - /en/glossary/hash-function/
  - /en/glossary/zk-rollup/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

A **STARK**, short for Scalable Transparent Argument of Knowledge, is a proof system that uses public randomness rather than a secret setup trapdoor. Its assumptions rely largely on [hash functions](/en/glossary/hash-function/). STARK proofs are generally larger than pairing-based proofs such as [Groth16](/en/glossary/groth16/), but they avoid a trusted setup ceremony and can verify large computations efficiently.
