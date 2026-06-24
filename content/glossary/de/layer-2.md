---
title: Layer 2
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Ein Netzwerk auf einer Blockchain, das Transaktionen schneller und günstiger macht, wie Base auf Ethereum.
keywords: ['layer 2', 'rollup', 'skalierung', 'optimistic rollup', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
---

Ein **Layer 2** (L2) ist ein Netzwerk, das Transaktionen außerhalb der Haupt-[Blockchain](/de/glossary/blockchain/) (Layer 1) ausführt und dann komprimierte Beweise oder Daten an diese zurücksendet, wodurch die Sicherheit der übergeordneten Chain geerbt wird, während Kosten und Latenz drastisch sinken. Die zwei dominanten Designs sind Optimistic Rollups – die Transaktionen als gültig annehmen und ein Betrugsnachweisfenster erlauben – und ZK-Rollups, die mit jedem Stapel einen kryptografischen Gültigkeitsbeweis einreichen. Netzwerke wie Base, Optimism, Arbitrum und zkSync sind L2s auf [Ethereum](/de/glossary/ethereum/). Das Verlagern von Berechnungen auf einen L2 kann [Gas](/de/glossary/gas/)-Gebühren um das 10- bis 100-Fache reduzieren, wodurch Mikrotransaktionen und häufige Asset-Transfers wirtschaftlich tragfähig werden. Für tokenisierte Domain-Operationen – routinemäßige Transfers, DNS-Konfigurationsaktualisierungen, Subdomain-Ausgaben – bedeutet die Ausführung auf einem L2, dass Nutzer Cent statt Dollar zahlen, während die Herkunft des Assets an Ethereum Mainnet verankert bleibt. Eine [Cross-Chain-Bridge](/de/glossary/cross-chain-bridge/) bewegt Assets zwischen L1 und L2, wenn nötig.
