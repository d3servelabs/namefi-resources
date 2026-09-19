---
title: Nova
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Nova is a folding scheme that incrementally proves a sequence of computational steps.
keywords: ['Nova', 'folding scheme', 'incrementally verifiable computation']
level: 1
sources:
  - https://eprint.iacr.org/2021/370
  - https://github.com/microsoft/Nova
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
  - /en/glossary/stark/
  - /en/glossary/halo2/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**Nova** is a folding scheme for incrementally verifiable computation: each new step is combined with an accumulated proof state, so verification work does not grow with the number of steps. A separate compression proof can make the final result easier to check externally. Unlike a standalone [Groth16](/en/glossary/groth16/) proof, Nova's final size and setup assumptions depend on the selected commitment and compression layers.
