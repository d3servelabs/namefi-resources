---
title: Hardware Wallet
date: '2026-05-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A dedicated offline device that stores a wallet's private keys and signs transactions on-device, so the keys never touch an internet-connected computer.
keywords: ['hardware wallet', 'cold wallet', 'Ledger', 'Trezor', 'GridPlus', 'Keystone', 'secure element', 'self-custody']
level: 1
sources:
  - https://ethereum.org/en/wallets/
relatedArticles:
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /en/blog/do-multisig-wallets-actually-improve-security/
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/how-to-tokenize-your-com/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/wallet/
  - /en/glossary/private-key/
  - /en/glossary/web3/
  - /en/glossary/registrar/
  - /en/glossary/erc-721/
---

A **hardware wallet** is a small dedicated device — typically with a screen and one or two buttons — that stores a [wallet](/en/glossary/wallet/)'s private keys offline and signs transactions on the device itself, so the keys never touch an internet-connected computer. Common examples include Ledger, Trezor, GridPlus Lattice, and Keystone. Because the signing operation happens inside the device's secure element, malware on a connected laptop cannot extract the key; the worst it can do is trick the user into approving a malicious transaction on the device screen — which is why "verify on device" matters.
