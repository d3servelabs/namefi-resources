---
title: Public Key
date: '2026-06-22'
language: en
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: The shareable half of a blockchain key pair, derived from the private key; used to receive funds and verify signatures.
keywords: ['public key', 'address', 'verification key', 'asymmetric cryptography', 'blockchain account']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/do-multisig-wallets-actually-improve-security/
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/private-key/
  - /en/glossary/web3/
  - /en/glossary/blockchain/
  - /en/glossary/smart-contract/
  - /en/glossary/dns/
---

A **public key** is the shareable half of a [blockchain](/en/glossary/blockchain/) account's cryptographic key pair. It — or the address derived from it — is safe to publish openly: it is where others send tokens or call smart contracts on your behalf. The public key is derived from the [private key](/en/glossary/private-key/) through one-way elliptic-curve math, so sharing it never exposes the secret that authorizes transactions. Verifying a digital signature against the public key proves that a message was signed by the holder of the matching private key, which is how the network confirms a transaction is genuinely authorized.
