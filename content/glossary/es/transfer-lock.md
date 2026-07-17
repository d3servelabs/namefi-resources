---
title: Bloqueo de Transferencia
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Estado que impide la transferencia de un dominio a otro registrador hasta que se desbloquea explícitamente.
keywords: ['bloqueo de transferencia', 'bloqueo del registrador', 'seguridad de dominio', 'estado EPP', 'transferencia de dominio']
also_known_as: ['Bloqueo del registrador']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/avoiding-domain-sale-scams/
  - /es/blog/working-with-domain-brokers/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/domain-hijacking/
  - /es/glossary/cross-registrar-transfer/
  - /es/glossary/epp/
  - /es/glossary/registry-lock/
---

El **Bloqueo de Transferencia** (también llamado *bloqueo del registrador*; estado EPP `clientTransferProhibited`) es un indicador establecido por tu [registrador](/es/glossary/registrar/) que impide que un dominio sea trasladado a un registrador diferente sin ser desbloqueado de forma deliberada primero. Cuando el bloqueo está activo, cualquier intento de iniciar una [transferencia entre registradores](/es/glossary/cross-registrar-transfer/) es rechazado antes de que pueda proseguir, incluso si el solicitante dispone del [código de autorización](/es/glossary/auth-code/). Es una de las defensas más sencillas y eficaces contra el [secuestro de dominio](/es/glossary/domain-hijacking/): un atacante que haya comprometido tu cuenta no puede transferir silenciosamente el activo mientras el bloqueo esté activo. La mejor práctica es mantener el bloqueo de transferencia activado en todo momento y retirarlo únicamente durante la breve ventana necesaria para completar una transferencia legítima.
