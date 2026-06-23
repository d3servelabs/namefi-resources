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
---

A **hardware wallet** is a small dedicated device — typically with a screen and one or two buttons — that stores a [wallet](/en/glossary/wallet/)'s private keys offline and signs transactions on the device itself, so the keys never touch an internet-connected computer. Common examples include Ledger, Trezor, GridPlus Lattice, and Keystone. Because the signing operation happens inside the device's secure element, malware on a connected laptop cannot extract the key; the worst it can do is trick the user into approving a malicious transaction on the device screen — which is why "verify on device" matters. For high-value assets like [tokenized domains](/en/blog/what-are-tokenized-domains/), most owners use a hot wallet (browser extension) for day-to-day interaction and store the [NFT](/en/glossary/nft/) on a hardware wallet for long-term custody. See [Recovering a Tokenized Domain After Wallet Loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) for how this fits into a broader recovery strategy.
