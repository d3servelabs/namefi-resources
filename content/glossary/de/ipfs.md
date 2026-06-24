---
title: IPFS
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Ein Peer-to-Peer-Protokoll, das Dateien anhand ihres Inhalts adressiert und dezentrale Web-Daten hostet.
keywords: ['IPFS', 'Inhaltsadressierung', 'Peer-to-Peer', 'dezentraler Speicher', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
---

**IPFS** (auch *InterPlanetary File System* genannt) ist ein Peer-to-Peer-Hypermedia-Protokoll, das Dateien anhand ihres Inhalts-Hashs identifiziert – einem Content Identifier (CID) – anstatt anhand des Serverstandorts. Halten zwei Knoten dieselbe Datei vor, erzeugen sie denselben CID, sodass das Netzwerk sie beim nächstgelegenen Knoten abrufen kann. Dieses Inhaltsadressierungsmodell ist das Gegenteil von HTTP, bei dem eine URL auf einen bestimmten Server zeigt, der offline gehen kann. In [Web3](/de/glossary/web3/)-Anwendungen ist IPFS eine Standard-Off-Chain-Datenschicht: NFT-Metadaten, Kunstwerke und Dokumente werden auf IPFS gespeichert, damit sie nicht dauerhaft an die teure [Blockchain](/de/glossary/blockchain/) gebunden sind – stattdessen enthält der [On-Chain](/de/glossary/on-chain/)-Datensatz den unveränderlichen CID. Für tokenisierte Domains kann IPFS eine dezentrale Website hosten, die aufgelöst wird, wenn jemand über ein IPFS-fähiges Gateway oder eine Browsererweiterung verfügt, und dabei herkömmliche DNS-Server vollständig umgeht.
