---
title: Billetera de hardware
date: '2026-05-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Un dispositivo offline dedicado que almacena las claves privadas de una billetera y firma transacciones en el dispositivo, de modo que las claves nunca toquen un ordenador conectado a internet.
keywords: ['billetera de hardware', 'billetera fría', 'Ledger', 'Trezor', 'GridPlus', 'Keystone', 'elemento seguro', 'autocustodia']
level: 1
sources:
  - https://ethereum.org/en/wallets/
relatedArticles:
  - /es/blog/onchain-domain-custody-and-recovery/
  - /es/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /es/blog/do-multisig-wallets-actually-improve-security/
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/how-to-tokenize-your-com/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/wallet/
  - /es/glossary/private-key/
  - /es/glossary/web3/
  - /es/glossary/registrar/
  - /es/glossary/erc-721/
---

Una **billetera de hardware** es un pequeño dispositivo dedicado — normalmente con pantalla y uno o dos botones — que almacena las claves privadas de una [billetera](/es/glossary/wallet/) sin conexión a internet y firma las transacciones en el propio dispositivo, de modo que las claves nunca toquen un ordenador conectado a internet. Entre los ejemplos más comunes se encuentran Ledger, Trezor, GridPlus Lattice y Keystone. Dado que la operación de firma ocurre dentro del elemento seguro del dispositivo, el malware en un portátil conectado no puede extraer la clave; lo peor que puede hacer es engañar al usuario para que apruebe una transacción maliciosa en la pantalla del dispositivo — por eso "verificar en el dispositivo" es importante. Para activos de alto valor como los [dominios tokenizados](/es/blog/what-are-tokenized-domains/), la mayoría de los propietarios utilizan una billetera caliente (extensión de navegador) para la interacción diaria y almacenan el [NFT](/es/glossary/nft/) en una billetera de hardware para la custodia a largo plazo. Consulta [Recuperar un dominio tokenizado tras la pérdida de la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) para ver cómo esto encaja en una estrategia de recuperación más amplia.
