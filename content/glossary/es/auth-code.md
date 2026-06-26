---
title: 'Código de autorización (código EPP, código de transferencia)'
date: '2026-05-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Un secreto corto por dominio que un registrador emite para autorizar el traslado de un dominio a otro registrador, también llamado código EPP o código de transferencia.
keywords: ['código de autorización', 'código EPP', 'código de transferencia', 'transferencia de dominio', 'código de autorización', 'código AuthInfo']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /es/blog/domain-escrow-explained/
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/how-to-tokenize-your-com/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-investor-field-guide/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/dns/
  - /es/glossary/cross-registrar-transfer/
  - /es/glossary/epp/
---

Un **código de autorización** — también llamado **código EPP**, **código AuthInfo** o **código de transferencia** — es un secreto compartido breve que un [registrador](/es/glossary/registrar/) emite para un dominio específico con el fin de autorizar una [transferencia entre registradores](/es/glossary/cross-registrar-transfer/). EPP (Extensible Provisioning Protocol) es el protocolo de registro estándar subyacente; el código de autorización es la credencial por dominio dentro de él. Para transferir un dominio de un registrador a otro, el registrador receptor debe presentar un código de autorización válido obtenido por el registrante del registrador cedente. El código suele ser visible en el panel de control del registrador, a veces oculto tras un botón de "Transferir fuera" u "Obtener código EPP". Para los [dominios tokenizados](/es/blog/what-are-tokenized-domains/), la transferencia de propiedad en cadena **no** requiere un código de autorización — la transferencia del [NFT](/es/glossary/nft/) es atómica en cadena. Los códigos de autorización solo son relevantes al mover un dominio entre registradores en el mundo tradicional del [DNS](/es/glossary/dns/).
