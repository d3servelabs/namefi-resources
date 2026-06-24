---
title: ERC-20
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El estándar de Ethereum para tokens fungibles como las stablecoins, complementario al estándar de NFT ERC-721.
keywords: ['ERC-20', 'token fungible', 'estándar de token', 'stablecoin', 'token ethereum']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
---

**ERC-20** es la Propuesta de Mejora de [Ethereum](/es/glossary/ethereum/) que define una interfaz estándar para tokens fungibles —cada unidad es idéntica e intercambiable, igual que los dólares en una cuenta bancaria. Cualquier contrato que implemente las funciones `transfer`, `approve` y `allowance` de ERC-20 es automáticamente compatible con carteras, exchanges y protocolos DeFi sin necesidad de integración personalizada. Las [stablecoins](/es/glossary/stablecoin/) como USDC y USDT son tokens ERC-20, al igual que la mayoría de los tokens de gobernanza y utilidad. ERC-20 contrasta marcadamente con [ERC-721](/es/glossary/erc-721/): un token ERC-721 no es fungible —cada uno tiene un ID único que representa un activo distinto, como un nombre de dominio específico.
