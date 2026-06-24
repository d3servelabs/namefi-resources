---
title: Layer 2
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un réseau construit au-dessus d''une blockchain pour rendre les transactions plus rapides et moins coûteuses, comme Base sur Ethereum.
keywords: ['layer 2', 'rollup', 'scalabilité', 'rollup optimiste', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
---

Un **layer 2** (L2) est un réseau qui exécute des transactions hors de la [blockchain](/fr/glossary/blockchain/) principale (layer 1) et publie ensuite des preuves ou des données compressées sur celle-ci, héritant de la sécurité de la chaîne parente tout en réduisant considérablement les coûts et la latence. Les deux conceptions dominantes sont les rollups optimistes — qui supposent que les transactions sont valides et permettent une fenêtre de contestation par preuve de fraude — et les ZK rollups, qui publient une preuve de validité cryptographique à chaque lot. Des réseaux comme Base, Optimism, Arbitrum et zkSync sont des L2 construits sur [Ethereum](/fr/glossary/ethereum/). Le déplacement des calculs vers un L2 peut réduire les frais de [gas](/fr/glossary/gas/) de 10 à 100×, rendant les micro-transactions et les transferts d'actifs à haute fréquence économiquement viables. Pour les opérations sur des domaines tokenisés — transferts courants, mises à jour de configuration DNS, émission de sous-domaines — l'exécution sur un L2 permet aux utilisateurs de payer quelques centimes au lieu de quelques dollars, tandis que la provenance de l'actif reste ancrée sur le réseau principal Ethereum. Un [pont inter-chaînes](/fr/glossary/cross-chain-bridge/) déplace les actifs entre L1 et L2 si nécessaire.
