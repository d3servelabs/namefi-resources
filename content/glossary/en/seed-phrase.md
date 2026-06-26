---
title: Seed Phrase (Recovery Phrase, Mnemonic)
date: '2026-05-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A list of 12 or 24 words that encodes a wallet's master key; anyone holding it controls the wallet, so it is the one thing you must back up.
keywords: ['seed phrase', 'recovery phrase', 'mnemonic phrase', 'wallet backup', 'BIP39', '12 words', '24 words', 'crypto recovery']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /en/blog/do-multisig-wallets-actually-improve-security/
  - /en/blog/selling-domains-as-nfts/
  - /en/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/private-key/
  - /en/glossary/web3/
  - /en/glossary/wallet/
  - /en/glossary/tokenized-domain/
  - /en/glossary/tokenize/
---

A **seed phrase** — also called a **recovery phrase** or **mnemonic phrase** — is a human-readable list of 12 or 24 words that encodes the master private key for a [wallet](/en/glossary/wallet/). The format is standardized by [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) and is used by most modern wallets (MetaMask, Ledger, Trezor, Rabby, Coinbase Wallet, etc.). With the seed phrase, you can restore the wallet — and any assets in it, including [tokenized domains](/en/blog/what-are-tokenized-domains/) — on any compatible device. Without it, lost device access usually means permanently lost funds, because there is no central authority to issue a "password reset." Best practices: write the seed phrase on paper or a metal backup, store at least two copies in separate physical locations, and **never** type it into any computer, cloud document, password manager that touches the cloud, chat, or AI assistant. See [Recovering a Tokenized Domain After Wallet Loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) for the full operational guide.
