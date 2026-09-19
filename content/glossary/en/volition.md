---
title: Volition
date: '2026-09-19'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Volition combines rollup and validium data-availability modes so users or applications can choose where recovery data lives.
keywords: ['volition', 'rollup mode', 'validium mode', 'data availability choice']
level: 1
sources:
  - https://docs.starkware.co/starkex/con_data_availability.html
  - https://docs.starkware.co/starkex/release_notes/4.5.html
relatedArticles:
  - /en/blog/top-rollup-types/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-virtual-machines/
relatedGlossary:
  - /en/glossary/rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/validium/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

**Volition** is a design in which a system offers both [on-chain](/en/glossary/on-chain/) [rollup](/en/glossary/rollup/) data availability and off-chain [validium](/en/glossary/validium/) data availability. A user or application chooses the mode for a particular asset or state position. The validity proof can cover both modes, but the user's ability to reconstruct state and exit depends on the chosen [data-availability](/en/glossary/data-availability/) path.
