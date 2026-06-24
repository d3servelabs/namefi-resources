---
title: Frappe
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Créer un nouveau token sur une blockchain — pour un domaine, émettre le NFT qui représente sa propriété.
keywords: ['frappe', 'minting', 'création de NFT', 'émission de token', 'on-chain']
also_known_as: ['Frapper']
level: 1
sources:
  - https://ethereum.org/en/nft/
---

La **frappe** (aussi appelée *frapper* un token) est l'acte d'écrire un nouvel enregistrement de token sur une [blockchain](/fr/glossary/blockchain/) — analogue à la frappe d'une pièce de monnaie, sauf que la « monnaie » est une fonction de [contrat intelligent](/fr/glossary/smart-contract/) qui crée une entrée dans l'état on-chain du contrat et l'attribue à une adresse propriétaire. Pour la tokenisation de domaines, la frappe est l'étape cruciale où un nom DNS réel devient un actif natif de la blockchain : un contrat intelligent appelle `mint`, créant un [NFT](/fr/glossary/nft/) [ERC-721](/fr/glossary/erc-721/) dont l'identifiant de token correspond à un domaine spécifique. À partir de ce moment, le domaine peut être transféré de pair à pair, listé sur une place de marché NFT, ou utilisé en DeFi sans toucher au flux de travail habituel du bureau d'enregistrement. La frappe nécessite du [gas](/fr/glossary/gas/) pour payer le calcul, et le processus de [tokenisation](/fr/glossary/tokenize/) implique également le verrouillage de l'enregistrement du bureau d'enregistrement afin que le propriétaire on-chain contrôle la configuration DNS. Une fois frappé, le NFT est la source de vérité pour la propriété ; brûler (détruire) le NFT restitue le contrôle au système d'enregistrement conventionnel.
