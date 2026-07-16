---
title: Clé Publique
date: '2026-06-22'
language: fr
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: La moitié partageable d''une paire de clés blockchain, dérivée de la clé privée ; utilisée pour recevoir des fonds et vérifier des signatures.
keywords: ['clé publique', 'adresse', 'clé de vérification', 'cryptographie asymétrique', 'compte blockchain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/do-multisig-wallets-actually-improve-security/
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/private-key/
  - /fr/glossary/web3/
  - /fr/glossary/blockchain/
  - /fr/glossary/smart-contract/
  - /fr/glossary/dns/
---

Une **clé publique** est la moitié partageable de la paire de clés cryptographiques d'un compte blockchain. Elle — ou l'adresse qui en est dérivée — peut être publiée librement : c'est là que les autres envoient des tokens ou appellent des contrats intelligents en votre nom. La clé publique est dérivée de la [clé privée](/fr/glossary/private-key/) par une opération mathématique à sens unique sur des courbes elliptiques, de sorte que la partager n'expose jamais le secret qui autorise les transactions. Vérifier une signature numérique avec la clé publique prouve qu'un message a été signé par le détenteur de la clé privée correspondante, ce qui est ainsi que le réseau confirme qu'une transaction est véritablement autorisée.
