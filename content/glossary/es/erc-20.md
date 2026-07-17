---
title: ERC-20
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: El estándar de Ethereum para tokens fungibles como las stablecoins, complementario al estándar de NFT ERC-721.
keywords: ['ERC-20', 'token fungible', 'estándar de token', 'stablecoin', 'token ethereum']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
relatedArticles:
  - /es/blog/the-badgerdao-frontend-attack/
  - /es/blog/onchain-domain-flipping/
  - /es/blog/selling-domains-as-nfts/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/ethereum/
  - /es/glossary/erc-721/
  - /es/glossary/stablecoin/
  - /es/glossary/wallet/
  - /es/glossary/web3/
---

**ERC-20** es la Propuesta de Mejora de [Ethereum](/es/glossary/ethereum/) que define una interfaz estándar para tokens fungibles —cada unidad es idéntica e intercambiable, igual que los dólares en una cuenta bancaria. Cualquier contrato que implemente las funciones `transfer`, `approve` y `allowance` de ERC-20 es automáticamente compatible con carteras, exchanges y protocolos DeFi sin necesidad de integración personalizada. Las [stablecoins](/es/glossary/stablecoin/) como USDC y USDT son tokens ERC-20, al igual que la mayoría de los tokens de gobernanza y utilidad. ERC-20 contrasta marcadamente con [ERC-721](/es/glossary/erc-721/): un token ERC-721 no es fungible —cada uno tiene un ID único que representa un activo distinto, como un nombre de dominio específico.
