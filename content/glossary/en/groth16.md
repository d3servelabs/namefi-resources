---
title: Groth16
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Groth16 is a pairing-based proof system with three-group-element proofs and circuit-specific setup parameters.
keywords: ['Groth16', 'pairing-based SNARK', 'circuit-specific setup']
level: 1
sources:
  - https://eprint.iacr.org/2016/260
  - https://github.com/iden3/snarkjs
relatedArticles:
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/plonk/
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

**Groth16** is a pairing-based [zero-knowledge proof](/en/glossary/zero-knowledge-proof/) system whose proofs contain three group elements. Its short proofs and efficient verification require parameters generated specifically for each circuit. Unlike [PLONK](/en/glossary/plonk/), changing the circuit requires a new circuit-specific setup.
