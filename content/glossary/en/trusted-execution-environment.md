---
title: Trusted Execution Environment
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A hardware-isolated region of a processor that runs code and holds data securely, shielded from the rest of the system including the operating system.
keywords: ['trusted execution environment', 'tee', 'secure enclave', 'intel sgx', 'confidential computing']
also_known_as: ['TEE', 'Secure Enclave']
level: 1
sources:
  - https://en.wikipedia.org/wiki/Software_Guard_Extensions
  - https://oasis.net/technology
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
  - /en/glossary/secure-multiparty-computation/
  - /en/glossary/cryptographic-security/
  - /en/glossary/smart-contract/
---

A **trusted execution environment** (TEE, often called a secure enclave) is an isolated, hardware-protected region of a processor where code and data run encrypted in memory, invisible to every other process on the machine, including the operating system and any hypervisor. Intel's SGX is the best-known implementation, protecting enclave contents from higher-privilege software, though it and similar technologies remain vulnerable to side-channel attacks that have repeatedly been demonstrated by security researchers—meaning a TEE's guarantee rests on trusting the chip vendor's hardware rather than pure mathematics. On blockchains, projects like Oasis Protocol run [smart contract](/en/glossary/smart-contract/) logic inside enclaves so computation stays confidential from server operators while still producing a verifiable proof of correct execution, achieving near-native speed unlike the heavier computation required by [fully homomorphic encryption](/en/glossary/fully-homomorphic-encryption/). Compared with the [zero-knowledge proof](/en/glossary/zero-knowledge-proof/) or [secure multi-party computation](/en/glossary/secure-multiparty-computation/), a TEE trades cryptographic certainty for performance, making it a pragmatic middle ground for confidential computing today. TEEs extend the same [cryptographic security](/en/glossary/cryptographic-security/) mindset—protecting secrets with hardware and math rather than institutional trust—that also underlies wallet key management for tokenized assets.
