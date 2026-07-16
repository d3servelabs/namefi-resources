---
title: Cross-Chain-Bridge
date: '2026-06-22'
language: de
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Ein Protokoll, das Token oder Nachrichten zwischen Blockchains überträgt, die nativ nicht miteinander kommunizieren können.
keywords: ['Bridge', 'Cross-Chain', 'Interoperabilität', 'Token-Bridge', 'Multi-Chain']
also_known_as: ['Bridge']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/tokenize-your-com-to-flip-it/
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/tokenized-domain-use-cases-2026/
  - /de/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/tokenized-domain/
  - /de/glossary/ethereum/
  - /de/glossary/web3/
  - /de/glossary/tokenize/
  - /de/glossary/registrar/
---

Eine **Cross-Chain-Bridge** (auch *Bridge* genannt) ist ein Protokoll, das einen Vermögenswert auf einer [Blockchain](/de/glossary/blockchain/) sperrt und einen repräsentativen Token auf einer anderen prägt, sodass Werte und Daten über Netzwerke hinweg bewegt werden können, die keinen nativen Kommunikationskanal teilen. Das häufigste Muster ist „Lock-and-Mint": Man hinterlegt einen Token in einem Bridge-Vertrag auf der Quellchain, und ein Verwahrer oder ein dezentrales Orakel weist einen entsprechenden Vertrag auf der Zielchain an, ein verpacktes Äquivalent auszustellen. Bridges verbinden das [Ethereum](/de/glossary/ethereum/)-Mainnet mit [Layer-2](/de/glossary/layer-2/)-Rollups wie Optimism oder Base sowie mit völlig eigenständigen Chains wie Polygon oder Solana. Da Bridges große Pools gesperrter Vermögenswerte halten, sind sie hochwertige Angriffsziele – mehrere haben neunstellige Exploits erlitten. Für tokenisierte Domains ermöglicht Bridging, dass ein auf Ethereum ausgegebenes NFT auf eine günstigere Layer-2 für kostengünstige Transfers wechselt und dann für DeFi-Sicherheiten wieder ins Mainnet zurückkehrt.
