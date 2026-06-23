---
title: Private Key / Public Key
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The cryptographic key pair behind a wallet — the public key receives, the private key authorizes.
keywords: ['private key', 'public key', 'cryptography', 'wallet security', 'asymmetric encryption']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
---

A **private key / public key** pair is the cryptographic foundation of every blockchain account. The public key (or its derived address) is safe to share openly — it is where others send tokens or call smart contracts on your behalf. The private key is a 256-bit secret that must never leave your control; it produces the digital signatures that authorize every transaction from your address. Lose it and you lose your assets permanently; expose it and anyone can drain your [wallet](/en/glossary/wallet/). Most users protect the private key indirectly through a [seed phrase](/en/glossary/seed-phrase/) — a human-readable mnemonic that deterministically regenerates the key. [Hardware wallets](/en/glossary/hardware-wallet/) store the private key in a dedicated secure chip, keeping it offline and reducing [cryptographic security](/en/glossary/cryptographic-security/) risks from malware. For tokenized domain ownership, the private key is effectively the deed: whoever signs with it controls the NFT — and therefore the DNS configuration — of every domain in that wallet. Namefi's architecture means ownership is enforced by math, not by a registrar's password-reset flow. *Source: Ethereum Developer Documentation — Accounts.*
