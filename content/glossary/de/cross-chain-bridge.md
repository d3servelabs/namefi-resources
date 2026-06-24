---
title: Cross-Chain-Bridge
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Ein Protokoll, das Token oder Nachrichten zwischen Blockchains überträgt, die nativ nicht miteinander kommunizieren können.
keywords: ['Bridge', 'Cross-Chain', 'Interoperabilität', 'Token-Bridge', 'Multi-Chain']
also_known_as: ['Bridge']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
---

Eine **Cross-Chain-Bridge** (auch *Bridge* genannt) ist ein Protokoll, das einen Vermögenswert auf einer [Blockchain](/de/glossary/blockchain/) sperrt und einen repräsentativen Token auf einer anderen prägt, sodass Werte und Daten über Netzwerke hinweg bewegt werden können, die keinen nativen Kommunikationskanal teilen. Das häufigste Muster ist „Lock-and-Mint": Man hinterlegt einen Token in einem Bridge-Vertrag auf der Quellchain, und ein Verwahrer oder ein dezentrales Orakel weist einen entsprechenden Vertrag auf der Zielchain an, ein verpacktes Äquivalent auszustellen. Bridges verbinden das [Ethereum](/de/glossary/ethereum/)-Mainnet mit [Layer-2](/de/glossary/layer-2/)-Rollups wie Optimism oder Base sowie mit völlig eigenständigen Chains wie Polygon oder Solana. Da Bridges große Pools gesperrter Vermögenswerte halten, sind sie hochwertige Angriffsziele – mehrere haben neunstellige Exploits erlitten. Für tokenisierte Domains ermöglicht Bridging, dass ein auf Ethereum ausgegebenes NFT auf eine günstigere Layer-2 für kostengünstige Transfers wechselt und dann für DeFi-Sicherheiten wieder ins Mainnet zurückkehrt.
