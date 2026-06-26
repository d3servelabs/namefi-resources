---
title: Layer 2
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Red construida sobre una blockchain para hacer las transacciones más rápidas y baratas, como Base sobre Ethereum.
keywords: ['layer 2', 'rollup', 'escalado', 'optimistic rollup', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /es/blog/selling-domains-as-nfts/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/what-are-tokenized-domains/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/cross-chain-bridge/
  - /es/glossary/ethereum/
  - /es/glossary/tokenized-domain/
  - /es/glossary/blockchain/
---

Una **layer 2** (L2) es una red que ejecuta transacciones fuera de la [blockchain](/es/glossary/blockchain/) principal (capa 1) y luego publica pruebas o datos comprimidos de vuelta en ella, heredando la seguridad de la cadena padre mientras reduce drásticamente el coste y la latencia. Los dos diseños dominantes son los optimistic rollups — que asumen que las transacciones son válidas y permiten una ventana de impugnación mediante prueba de fraude — y los ZK rollups, que publican una prueba de validez criptográfica con cada lote. Redes como Base, Optimism, Arbitrum y zkSync son L2 sobre [Ethereum](/es/glossary/ethereum/). Mover la computación a una L2 puede reducir las comisiones de [gas](/es/glossary/gas/) entre 10 y 100 veces, haciendo económicamente viables las microtransacciones y las transferencias de activos de alta frecuencia. Para operaciones con dominios tokenizados — transferencias rutinarias, actualizaciones de configuración DNS, emisión de subdominios — ejecutar en una L2 significa que los usuarios pagan céntimos en lugar de dólares, mientras que la procedencia del activo sigue anclada a la red principal de Ethereum. Un [puente entre cadenas](/es/glossary/cross-chain-bridge/) mueve activos entre la L1 y la L2 cuando es necesario.
