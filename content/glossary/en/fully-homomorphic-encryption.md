---
title: Fully Homomorphic Encryption
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: An encryption scheme that allows computation directly on encrypted data, producing an encrypted result without ever decrypting the inputs.
keywords: ['fully homomorphic encryption', 'fhe', 'confidential computing', 'encrypted computation', 'lattice cryptography']
also_known_as: ['FHE']
level: 1
sources:
  - https://www.zama.org/introduction-to-homomorphic-encryption
  - https://cofhe-docs.fhenix.zone/
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
  - /en/glossary/secure-multiparty-computation/
  - /en/glossary/trusted-execution-environment/
  - /en/glossary/cryptographic-security/
  - /en/glossary/smart-contract/
---

**Fully homomorphic encryption** (FHE) is a cryptographic technique that lets a computer perform arithmetic directly on encrypted data and return an encrypted result that decrypts to the same answer as running the same operation on the plaintext—so the party doing the computing never sees the underlying values. Built on lattice-based mathematics, FHE schemes are considered resistant to attacks from future quantum computers, which is drawing interest for long-term data protection. On blockchains, FHE lets a [smart contract](/en/glossary/smart-contract/) move tokens or evaluate logic on encrypted balances without ever exposing the amounts involved, unlike a standard public ledger where every value is readable. It is the strongest privacy guarantee among current techniques because nothing is ever decrypted during processing, but it is also the most computationally expensive, which is why FHE-based chains currently apply it selectively rather than to every transaction. It complements other privacy primitives such as the [zero-knowledge proof](/en/glossary/zero-knowledge-proof/), [secure multi-party computation](/en/glossary/secure-multiparty-computation/), and the [trusted execution environment](/en/glossary/trusted-execution-environment/), each offering a different balance of speed and trust. For tokenized assets, FHE points toward a future where ownership and transaction logic can be verified without any party—including the platform operator—seeing the underlying values, extending the same [cryptographic security](/en/glossary/cryptographic-security/) principles already protecting private keys.
