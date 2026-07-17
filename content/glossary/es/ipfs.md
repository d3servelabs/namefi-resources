---
title: IPFS
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Protocolo entre pares que identifica archivos por su contenido, utilizado para alojar datos web descentralizados.
keywords: ['IPFS', 'direccionamiento por contenido', 'entre pares', 'almacenamiento descentralizado', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/onchain-domain-custody-and-recovery/
  - /es/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/web3/
  - /es/glossary/dns/
  - /es/glossary/tokenized-domain/
  - /es/glossary/registrar/
  - /es/glossary/blockchain/
---

**IPFS** (InterPlanetary File System, también conocido como Sistema de Archivos Interplanetario) es un protocolo hipermedia entre pares que identifica los archivos por su hash de contenido — un Identificador de Contenido (CID) — en lugar de por la ubicación del servidor. Si dos nodos almacenan el mismo archivo, producen el mismo CID, por lo que la red puede recuperarlo desde el nodo más cercano. Este modelo de direccionamiento por contenido es lo opuesto a HTTP, donde una URL apunta a un servidor específico que puede desconectarse. En aplicaciones [web3](/es/glossary/web3/), IPFS es una capa de datos estándar fuera de la cadena: los metadatos de NFT, obras de arte y documentos se almacenan en IPFS para no quedar anclados permanentemente a la costosa [blockchain](/es/glossary/blockchain/) — en cambio, el registro [on-chain](/es/glossary/on-chain/) conserva el CID inmutable. Para los dominios tokenizados, IPFS puede alojar un sitio web descentralizado que se resuelve cuando alguien dispone de una puerta de enlace o extensión de navegador compatible con IPFS, sin pasar en absoluto por los servidores DNS convencionales.
