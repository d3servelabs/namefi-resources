---
title: Halo2
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Halo2 is a PLONKish proof framework whose Zcash implementation avoids a trusted setup using inner-product commitments.
keywords: ['Halo2', 'PLONKish', 'inner-product commitment']
level: 1
sources:
  - https://zcash.github.io/halo2/background/pc-ipa.html
  - https://z.cash/learn/what-are-zk-snarks/
relatedArticles:
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/plonk/
  - /en/glossary/groth16/
  - /en/glossary/stark/
  - /en/glossary/nova/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**Halo2** is a circuit and proof framework related to [PLONK](/en/glossary/plonk/). Zcash's implementation uses inner-product commitments that avoid a trusted setup, with logarithmic-size commitment openings. Other Halo2-derived systems can use different commitments, so the setup and verification costs depend on the implementation. Halo2 is used for [zero-knowledge proofs](/en/glossary/zero-knowledge-proof/) in Zcash's Orchard protocol.
