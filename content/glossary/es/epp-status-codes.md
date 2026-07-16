---
title: Códigos de estado EPP
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Los indicadores estandarizados de un dominio que muestran su estado — bloqueado, en suspensión, pendiente de transferencia y más.
keywords: ['códigos de estado EPP', 'clientHold', 'serverTransferProhibited', 'estado de dominio', 'eliminación pendiente']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /es/blog/expired-domains-and-the-drop-cycle/
  - /es/blog/domain-backorders-and-drop-catching/
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/working-with-domain-brokers/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/epp/
  - /es/glossary/registry/
  - /es/glossary/dns/
  - /es/glossary/transfer-lock/
---

Los **códigos de estado EPP** son los indicadores legibles por máquina definidos por el Extensible Provisioning Protocol ([EPP](/es/glossary/epp/)) que describen con exactitud qué operaciones están permitidas sobre un dominio en un momento dado. Vienen en dos espacios de nombres: los códigos `client*` los establece el [registrador](/es/glossary/registrar/) y los códigos `server*` los establece el registro, teniendo precedencia los códigos del servidor. Entre los más comunes se encuentran `clientTransferProhibited` (el [bloqueo de transferencia](/es/glossary/transfer-lock/) que impide los traslados salientes), `serverDeleteProhibited` (protección a nivel de registro contra la eliminación), `clientHold` (suspende la resolución DNS, a menudo por impago) y `pendingDelete`, que marca un dominio en su período de gracia antes de ser liberado y quedar disponible para su registro de nuevo —un estado adyacente a [eliminación pendiente](/es/glossary/pending-delete/). Comprender estos códigos tiene importancia práctica: un dominio que muestra `serverTransferProhibited` no puede moverse aunque el registrador lo desbloquee, lo que sorprende a los compradores en medio de una transacción.
