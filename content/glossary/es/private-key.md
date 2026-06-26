---
title: Clave Privada
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El número secreto que controla una cuenta blockchain y firma sus transacciones; nunca debe compartirse.
keywords: ['clave privada', 'clave de firma', 'clave de billetera', 'clave secreta', 'cuenta blockchain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /es/blog/onchain-domain-custody-and-recovery/
  - /es/blog/the-badgerdao-frontend-attack/
  - /es/blog/do-multisig-wallets-actually-improve-security/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/public-key/
  - /es/glossary/wallet/
  - /es/glossary/web3/
  - /es/glossary/registrar/
  - /es/glossary/blockchain/
---

Una **clave privada** es el número secreto — 256 bits en la mayoría de las blockchains — que controla una cuenta: produce las firmas digitales que autorizan cada transacción desde la dirección, y nunca debe salir de tu control. Si la pierdes, perderás tus activos de forma permanente; si la expones, cualquiera podrá vaciar tu [billetera](/es/glossary/wallet/). La mayoría de los usuarios nunca manejan la clave directamente, sino que la protegen a través de una [frase semilla](/es/glossary/seed-phrase/) — un mnemónico legible por humanos que la regenera de forma determinista. Su contraparte, la [clave pública](/es/glossary/public-key/), se deriva de ella y puede compartirse abiertamente sin riesgo.
