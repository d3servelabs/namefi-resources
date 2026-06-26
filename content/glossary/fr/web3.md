---
title: Web3
date: '2025-06-30'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Une vision d'internet sur des blockchains publiques où les utilisateurs possèdent données, actifs et identité via leurs propres clés, sans comptes de plateforme.
keywords: ['Web3', 'web décentralisé', 'internet blockchain', 'propriété utilisateur', 'pair-à-pair', 'décentralisation', 'cryptomonnaie', 'contrats intelligents', 'DeFi', 'NFT']
level: 2
sources:
  - https://ethereum.org/en/web3/
  - https://web3.foundation/about/
  - https://en.wikipedia.org/wiki/Web3
  - https://www.wired.com/story/web3-blockchain-decentralization-explained/
relatedArticles:
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/icann/
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/registry/
  - /fr/glossary/tld/
---

**Web3** (aussi écrit *Web 3.0*) est un paradigme proposé pour internet dans lequel l'infrastructure de base fonctionne sur des réseaux [blockchain](/fr/glossary/blockchain/) publics, permettant aux participants de posséder et de contrôler leurs données, actifs numériques et identités en ligne grâce à des clés cryptographiques, plutôt que via des comptes gérés par des plateformes centralisées.

## En quoi le Web3 diffère du Web1 et du Web2

Le terme s'explique généralement à travers un modèle en trois générations du web :

- **Web1 (≈ 1991–2004)** — pages statiques, en lecture seule. Les utilisateurs consommaient le contenu publié par des webmasters ; il y avait peu d'interactivité ou de contenu généré par les utilisateurs.
- **Web2 (≈ 2004–présent)** — le web participatif et axé sur les plateformes. Les réseaux sociaux, les moteurs de recherche et les services cloud permettent à chacun de publier et d'interagir, mais les données sous-jacentes, les identités et les flux de monétisation sont détenus et contrôlés par un petit nombre de grandes plateformes (Google, Meta, Amazon et leurs pairs).
- **Web3 (proposé)** — un web lecture/écriture/propriété. Les utilisateurs détiennent leurs propres clés, transportent leur identité et leurs actifs d'une application à l'autre sans dépositaire central, et interagissent via des protocoles ouverts plutôt que des API propriétaires.

L'expression a été [forgée par le co-fondateur d'Ethereum Gavin Wood en 2014](https://ethereum.org/en/web3/) pour décrire un ensemble de technologies qu'il estimait nécessaires à la construction d'un internet moins dépendant de la confiance. Elle a gagné une attention grand public lors de la période 2020–2022, portée par l'essor des marchés [DeFi](/fr/glossary/defi/) et NFT.

## Technologies de base

Les applications Web3 sont généralement construites sur une combinaison des éléments suivants :

- **[Contrats intelligents](/fr/glossary/smart-contract/)** — du code auto-exécutable déployé [on-chain](/fr/glossary/on-chain/) qui applique des règles sans opérateur centralisé. Ce sont les briques fondamentales des applications décentralisées (dApps).
- **Blockchains publiques** — des registres sans permission, en ajout seul (Ethereum étant le plus utilisé pour les applications générales), qui fournissent une source de vérité partagée sans intermédiaire de confiance.
- **Portefeuilles cryptographiques** — des logiciels (ou matériels) qui gèrent les clés privées et signent les transactions. L'adresse d'un [portefeuille](/fr/glossary/wallet/) fonctionne comme une identité universelle et portable entre applications compatibles.
- **Jetons et tokenisation** — la capacité de [tokeniser](/fr/glossary/tokenize/) des actifs, y compris des monnaies fongibles, des droits de gouvernance ou des objets numériques uniques (NFT), sous forme d'entrées sur un registre public que toute application peut lire et vérifier.
- **Stockage décentralisé** — des protocoles comme IPFS et Arweave qui répliquent le contenu sur de nombreux nœuds afin qu'aucune entité unique ne puisse le censurer ou le supprimer.
- **[DAO](/fr/glossary/dao/) (Organisations Autonomes Décentralisées)** — des entités on-chain dont les règles et la trésorerie sont gouvernées collectivement par les détenteurs de jetons plutôt que par un conseil d'administration.

## Identité et nommage

L'une des différences structurelles entre le Web2 et le Web3 est le traitement de l'identité. Dans le Web2, une identité est un nom d'utilisateur et un mot de passe stockés dans la base de données d'une entreprise — la plateforme peut la désactiver à tout moment. Dans le Web3, l'identité est dérivée d'une paire de clés publique/privée contrôlée par le titulaire.

Des couches de nommage lisibles par l'être humain, comme l'[Ethereum Name Service (ENS)](/fr/glossary/ens/), associent des adresses cryptographiques à des noms lisibles (par exemple `alice.eth`) dans un registre entièrement on-chain. Ces noms peuvent simultanément servir d'adresses de paiement, d'identifiants de connexion et de pointeurs de sites web décentralisés, sans qu'aucune autorité centrale ne puisse les révoquer tant que le propriétaire contrôle la clé correspondante.

La Web3 Foundation, [fondée par Gavin Wood et d'autres](https://web3.foundation/about/), finance la recherche et le développement d'une infrastructure internet décentralisée et équitable, avec un accent particulier sur les protocoles d'interopérabilité.

## Critiques et questions ouvertes

Le Web3 est [contesté parmi les technologues et les économistes](https://www.wired.com/story/web3-blockchain-decentralization-explained/). Les préoccupations fréquemment citées incluent :

- **Scalabilité** — les blockchains publiques traitent beaucoup moins de transactions par seconde que les bases de données centralisées, et les frais s'envolent en cas de forte charge. Les réseaux de couche 2 (rollups, sidechains) atténuent ce problème mais ajoutent de la complexité.
- **Expérience utilisateur** — gérer des clés privées, des frais de gaz et des confirmations de transactions est bien plus difficile que de se connecter avec un compte social. La perte d'une phrase de récupération entraîne une perte permanente des actifs, sans possibilité de récupération du compte.
- **Recentralisation** — en pratique, une grande partie de l'écosystème Web3 repose sur un petit nombre de fournisseurs d'infrastructure (par exemple Infura et Alchemy pour l'accès RPC, OpenSea pour la liquidité NFT, une poignée d'émetteurs de stablecoins). Les critiques soutiennent que cela recrée les concentrations de pouvoir que le Web3 visait à éliminer, mais avec des acteurs différents.
- **Spéculation et financiarisation** — les cycles de marché autour des cryptomonnaies et des NFT ont conduit des observateurs à s'interroger sur la capacité des incitations basées sur les jetons à produire des écosystèmes durables ou si elles récompensent surtout les détenteurs précoces.
- **Consommation d'énergie** — les blockchains en preuve de travail avaient historiquement une empreinte carbone importante ; la transition d'Ethereum en 2022 vers la preuve d'enjeu a réduit sa consommation d'énergie d'[environ 99,95 %](https://ethereum.org/en/energy-consumption/), même si certaines chaînes en preuve de travail restent de gros consommateurs.
- **Incertitude réglementaire** — la question de savoir si les jetons constituent des valeurs mobilières, comment les DAO sont traités en tant qu'entités juridiques et l'application transfrontalière des litiges liés aux contrats intelligents restent non résolues dans la plupart des juridictions.

Les partisans rétorquent que bon nombre de ces problèmes sont des défis d'ingénierie qui s'améliorent avec le temps, et que la base de protocoles ouverts et sans confiance vaut les compromis actuels.

## Pertinence pour les noms de domaine

Les noms de domaine traditionnels fonctionnent via une hiérarchie centralisée maintenue par l'ICANN et déléguée aux registres et registraires — le propriétaire d'un nom de domaine dépend en définitive d'un registraire pour maintenir l'enregistrement actif. Le Web3 introduit un modèle alternatif : des registres de noms on-chain où la propriété est encodée sous forme de jeton détenu dans le portefeuille du propriétaire, sans qu'aucun registraire ne puisse le révoquer unilatéralement.

Cela affecte plusieurs aspects du fonctionnement des domaines :

- **Résistance à la censure** — un domaine dont l'enregistrement de propriété vit sur une blockchain publique ne peut pas être saisi via un changement de politique de registraire ou une ordonnance judiciaire visant le registraire.
- **Composabilité** — les noms on-chain peuvent être lus et utilisés par des contrats intelligents, permettant le routage des paiements, la résolution de sites web décentralisés et la délivrance de justificatifs au sein d'un même identifiant.
- **Marchés secondaires** — les noms on-chain étant des jetons, ils peuvent être transférés de pair à pair ou vendus sur des marchés décentralisés sans nécessiter l'intervention d'un registraire.
- **Interopérabilité** — des standards tels que l'ENS permettent à un seul nom de se résoudre sur plusieurs applications (portefeuilles, navigateurs, dApps) sans que chaque application n'ait besoin d'interroger une API propriétaire.

Le compromis est que les noms fondés sur la blockchain ont une résolution limitée dans le DNS conventionnel, exigent du propriétaire qu'il gère ses propres clés, et dépendent du bon fonctionnement continu de la chaîne sous-jacente.
