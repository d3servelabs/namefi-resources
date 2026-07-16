---
title: Secure Multi-Party Computation
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A cryptographic technique letting several parties jointly compute a result from their private inputs without revealing those inputs to each other.
keywords: ['secure multi-party computation', 'mpc', 'smpc', 'threshold signature', 'threshold custody']
also_known_as: ['MPC', 'SMPC']
level: 1
sources:
  - https://en.wikipedia.org/wiki/Secure_multi-party_computation
  - https://www.fireblocks.com/what-is-mpc
relatedArticles:
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/fully-homomorphic-encryption/
  - /en/glossary/trusted-execution-environment/
  - /en/glossary/private-key/
  - /en/glossary/hardware-wallet/
---

**Secure multi-party computation** (MPC, sometimes SMPC) lets several parties jointly compute a function over their combined inputs without any party revealing its individual input to the others—only the final result is shared. Security holds as long as the number of dishonest participants stays below a defined threshold, replacing a single trusted custodian with a "trust the majority of these N parties" assumption. The most common blockchain application is threshold-signature custody: a [private key](/en/glossary/private-key/) is split into shares distributed across independent parties or devices, and the complete key is never assembled in one place, even at signing time—so compromising one share leaves an attacker with nothing usable. This makes MPC an alternative or complement to a [hardware wallet](/en/glossary/hardware-wallet/) for institutions that need multiple approvers before a transaction can be signed. It differs from the [zero-knowledge proof](/en/glossary/zero-knowledge-proof/), which proves a fact about data held by one party, and from [fully homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) and the [trusted execution environment](/en/glossary/trusted-execution-environment/), which protect a single party's computation rather than splitting trust across several. MPC-based threshold signing already secures many institutional wallets holding tokenized assets, including NFT-based tokenized domains, without concentrating custody in any single key.
