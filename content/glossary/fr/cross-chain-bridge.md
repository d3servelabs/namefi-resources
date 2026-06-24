---
title: Pont inter-chaînes
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un protocole qui déplace des jetons ou des messages entre des blockchains qui ne peuvent pas communiquer nativement entre elles.
keywords: ['pont', 'inter-chaînes', 'interopérabilité', 'pont de jetons', 'multi-chaîne']
also_known_as: ['Pont']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
---

Un **pont inter-chaînes** (aussi appelé *pont*) est un protocole qui verrouille un actif sur une [blockchain](/fr/glossary/blockchain/) et frappe un jeton représentatif sur une autre, permettant à la valeur et aux données de se déplacer entre des réseaux qui ne partagent aucun canal de communication natif. Le schéma le plus courant est « verrouiller et frapper » : vous déposez un jeton dans un contrat de pont sur la chaîne source, et un gardien ou un oracle décentralisé instruit un contrat correspondant sur la chaîne de destination pour émettre un équivalent enveloppé. Les ponts connectent le réseau principal [Ethereum](/fr/glossary/ethereum/) aux rollups de [couche 2](/fr/glossary/layer-2/) comme Optimism ou Base, et à des chaînes entièrement séparées comme Polygon ou Solana. Parce que les ponts détiennent de grands réserves d'actifs verrouillés, ils constituent des cibles d'attaque de grande valeur — plusieurs ont subi des exploits à neuf chiffres. Pour les domaines tokenisés, le pontage permet à un NFT émis sur Ethereum de se déplacer vers une couche 2 moins coûteuse pour des transferts à faible coût, puis de revenir au réseau principal pour être utilisé comme garantie DeFi.
