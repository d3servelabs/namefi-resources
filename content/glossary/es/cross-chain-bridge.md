---
title: Puente entre cadenas
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Un protocolo que transfiere tokens o mensajes entre blockchains que no pueden comunicarse de forma nativa entre sí.
keywords: ['puente', 'entre cadenas', 'interoperabilidad', 'puente de tokens', 'multicadena']
also_known_as: ['Puente']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/tokenized-domain-use-cases-2026/
  - /es/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/tokenized-domain/
  - /es/glossary/ethereum/
  - /es/glossary/web3/
  - /es/glossary/tokenize/
  - /es/glossary/registrar/
---

Un **puente entre cadenas** (también llamado *puente*) es un protocolo que bloquea un activo en una [blockchain](/es/glossary/blockchain/) y acuña un token representativo en otra, permitiendo que el valor y los datos se muevan entre redes que no tienen ningún canal de comunicación nativo. El patrón más común es "bloquear y acuñar": depositas un token en un contrato puente en la cadena de origen, y un custodio u oráculo descentralizado instruye a un contrato equivalente en la cadena de destino para que emita un equivalente envuelto. Los puentes conectan la red principal de [Ethereum](/es/glossary/ethereum/) con los rollups de [capa 2](/es/glossary/layer-2/) como Optimism o Base, y con cadenas completamente separadas como Polygon o Solana. Dado que los puentes albergan grandes reservas de activos bloqueados, son objetivos de ataque de alto valor —varios han sufrido exploits de nueve cifras. Para los dominios tokenizados, el puenteo permite que un NFT emitido en Ethereum se traslade a una capa 2 más económica para transferencias de bajo costo, y de vuelta a la red principal para colateral DeFi.
