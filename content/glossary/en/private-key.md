---
title: Private Key
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The secret number that controls a blockchain account and signs its transactions; it must never be shared.
keywords: ['private key', 'signing key', 'wallet key', 'secret key', 'blockchain account']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/do-multisig-wallets-actually-improve-security/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/public-key/
  - /en/glossary/wallet/
  - /en/glossary/web3/
  - /en/glossary/registrar/
  - /en/glossary/blockchain/
---

A **private key** is the secret number — 256 bits on most blockchains — that controls an account: it produces the digital signatures that authorize every transaction from the address, and it must never leave your control. Lose it and you lose your assets permanently; expose it and anyone can drain your [wallet](/en/glossary/wallet/). Most users never handle the raw key directly, protecting it instead through a [seed phrase](/en/glossary/seed-phrase/) — a human-readable mnemonic that deterministically regenerates it. Its counterpart, the [public key](/en/glossary/public-key/), is derived from it and is safe to share openly.
