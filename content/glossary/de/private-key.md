---
title: Privater Schlüssel
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Die geheime Zahl, die ein Blockchain-Konto kontrolliert und dessen Transaktionen signiert; sie darf niemals weitergegeben werden.
keywords: ['privater schlüssel', 'signing key', 'wallet-schlüssel', 'geheimer schlüssel', 'blockchain-konto']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /de/blog/onchain-domain-custody-and-recovery/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/do-multisig-wallets-actually-improve-security/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/public-key/
  - /de/glossary/wallet/
  - /de/glossary/web3/
  - /de/glossary/registrar/
  - /de/glossary/blockchain/
---

Ein **privater Schlüssel** ist die geheime Zahl – 256 Bit auf den meisten Blockchains – die ein Konto kontrolliert: Er erzeugt die digitalen Signaturen, die jede Transaktion von der Adresse autorisieren, und er darf niemals Ihre Kontrolle verlassen. Verlieren Sie ihn, verlieren Sie Ihre Assets dauerhaft; geben Sie ihn preis, kann jeder Ihre [Wallet](/de/glossary/wallet/) leeren. Die meisten Nutzer handhaben den rohen Schlüssel nie direkt und schützen ihn stattdessen durch eine [Seed-Phrase](/de/glossary/seed-phrase/) – ein menschenlesbare Merkphrase, die ihn deterministisch regeneriert. Sein Gegenstück, der [öffentliche Schlüssel](/de/glossary/public-key/), wird aus ihm abgeleitet und kann offen geteilt werden.
