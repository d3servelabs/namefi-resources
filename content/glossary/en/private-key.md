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
---

A **private key** is the secret number — 256 bits on most blockchains — that controls an account: it produces the digital signatures that authorize every transaction from the address, and it must never leave your control. Lose it and you lose your assets permanently; expose it and anyone can drain your [wallet](/en/glossary/wallet/). Most users never handle the raw key directly, protecting it instead through a [seed phrase](/en/glossary/seed-phrase/) — a human-readable mnemonic that deterministically regenerates it. Its counterpart, the [public key](/en/glossary/public-key/), is derived from it and is safe to share openly.
