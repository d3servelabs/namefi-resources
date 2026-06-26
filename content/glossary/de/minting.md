---
title: Prägen
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Das Erstellen eines neuen Tokens auf einer Blockchain – bei einer Domain bedeutet es die Ausgabe des NFT, das deren Eigentümerschaft repräsentiert.
keywords: ['prägen', 'minting', 'NFT-erstellung', 'token-ausgabe', 'on-chain']
also_known_as: ['Mint']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/how-to-tokenize-your-com/
  - /de/blog/onchain-domain-custody-and-recovery/
  - /de/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /de/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/tokenized-domain/
  - /de/glossary/web3/
  - /de/glossary/tokenize/
---

**Prägen** (auch *Mint* genannt) ist der Vorgang, einen neuen Token-Datensatz auf eine [Blockchain](/de/glossary/blockchain/) zu schreiben – analog zum Schlagen einer Münze, außer dass der „Mint" eine [Smart-Contract](/de/glossary/smart-contract/)-Funktion ist, die einen Eintrag im On-Chain-Zustand des Contracts erstellt und ihn einer Eigentümeradresse zuweist. Bei der Domain-Tokenisierung ist das Prägen der kritische Schritt, bei dem ein echter DNS-Name zum blockchain-nativen Asset wird: Ein Smart Contract ruft `mint` auf, erstellt ein [ERC-721](/de/glossary/erc-721/)-[NFT](/de/glossary/nft/), dessen Token-ID einer bestimmten Domain zugeordnet ist. Ab diesem Moment kann die Domain Peer-to-Peer übertragen, auf einem NFT-Marktplatz gelistet oder in DeFi genutzt werden, ohne den traditionellen Registrar-Workflow zu berühren. Das Prägen erfordert [Gas](/de/glossary/gas/) für die Berechnung, und der [Tokenisierungs](/de/glossary/tokenize/)-Prozess umfasst auch die Sperrung des Registrar-Datensatzes, damit der On-Chain-Eigentümer die DNS-Konfiguration kontrolliert. Einmal geprägt, ist das NFT die maßgebliche Quelle für Eigentümerschaft; das Verbrennen (Vernichten) des NFT gibt die Kontrolle an das konventionelle Registrierungssystem zurück.
