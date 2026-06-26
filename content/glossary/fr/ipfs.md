---
title: IPFS
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un protocole pair-à-pair qui identifie les fichiers par leur contenu, utilisé pour héberger des données web décentralisées.
keywords: ['IPFS', 'adressage par contenu', 'pair-à-pair', 'stockage décentralisé', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/web3/
  - /fr/glossary/dns/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/registrar/
  - /fr/glossary/blockchain/
---

**IPFS** (aussi appelé *InterPlanetary File System*) est un protocole hypermédia pair-à-pair qui identifie les fichiers par leur empreinte de contenu — un identifiant de contenu (CID) — plutôt que par l'emplacement d'un serveur. Si deux nœuds détiennent le même fichier, ils produisent le même CID, de sorte que le réseau peut le récupérer auprès du nœud le plus proche. Ce modèle d'adressage par contenu est l'opposé de HTTP, où une URL pointe vers un serveur spécifique qui peut se déconnecter. Dans les applications [web3](/fr/glossary/web3/), IPFS est une couche de données hors chaîne standard : les métadonnées de NFT, les œuvres et les documents sont stockés sur IPFS afin de ne pas être épinglés en permanence sur la coûteuse [blockchain](/fr/glossary/blockchain/) — l'enregistrement [on-chain](/fr/glossary/on-chain/) conserve uniquement le CID immuable. Pour les domaines tokenisés, IPFS peut héberger un site web décentralisé qui se résout lorsque l'utilisateur dispose d'une passerelle IPFS ou d'une extension de navigateur compatible, contournant entièrement les serveurs DNS conventionnels.
