---
title: PLONK
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: PLONK is a zero-knowledge proof system that reuses an updatable setup across circuits within a configured size limit.
keywords: ['PLONK', 'universal SNARK', 'updatable setup']
level: 1
sources:
  - https://eprint.iacr.org/2019/953
  - https://docs.aztec.network/developers/docs/resources/glossary
relatedArticles:
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/groth16/
  - /en/glossary/stark/
  - /en/glossary/halo2/
  - /en/glossary/nova/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**PLONK** is a [zero-knowledge proof](/en/glossary/zero-knowledge-proof/) system built around a universal, updatable structured reference string. Within its configured circuit-size limit, that setup can be reused for different circuits instead of performing a new circuit-specific ceremony as [Groth16](/en/glossary/groth16/) requires. A universal setup is still a setup, not a claim that every PLONK variant is transparent.
