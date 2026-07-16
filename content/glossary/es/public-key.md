---
title: Clave Pública
date: '2026-06-22'
language: es
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: La mitad compartible del par de claves blockchain, derivada de la clave privada; se usa para recibir fondos y verificar firmas.
keywords: ['clave pública', 'dirección', 'clave de verificación', 'criptografía asimétrica', 'cuenta blockchain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /es/blog/the-badgerdao-frontend-attack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/do-multisig-wallets-actually-improve-security/
  - /es/blog/onchain-domain-custody-and-recovery/
  - /es/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/private-key/
  - /es/glossary/web3/
  - /es/glossary/blockchain/
  - /es/glossary/smart-contract/
  - /es/glossary/dns/
---

Una **clave pública** es la mitad compartible del par de claves criptográficas de una cuenta blockchain. Ella — o la dirección derivada de ella — puede publicarse abiertamente: es donde otros envían tokens o llaman a contratos inteligentes en tu nombre. La clave pública se deriva de la [clave privada](/es/glossary/private-key/) mediante matemáticas de curva elíptica de sentido único, de modo que compartirla nunca expone el secreto que autoriza las transacciones. Verificar una firma digital con la clave pública prueba que el mensaje fue firmado por quien posee la clave privada correspondiente, que es la forma en que la red confirma que una transacción está genuinamente autorizada.
