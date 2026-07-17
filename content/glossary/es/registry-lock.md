---
title: Bloqueo de Registro
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Servicio de alta seguridad en el que el registro congela un dominio para que cualquier cambio requiera aprobación manual fuera de banda.
keywords: ['bloqueo de registro', 'bloqueo de dominio', 'bloqueo de alta seguridad', 'prevención de secuestro de dominio', 'verificación fuera de banda']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /es/blog/the-syrian-electronic-army-nyt-hijack/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-sea-turtle-dns-espionage/
  - /es/blog/how-domain-hijacking-actually-happens/
  - /es/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/dns/
  - /es/glossary/domain-hijacking/
  - /es/glossary/transfer-lock/
---

**Bloqueo de Registro** es un servicio de seguridad premium ofrecido por un [registro](/es/glossary/registry/) que coloca un dominio en un estado en el que ninguna modificación — incluidos cambios de servidores de nombres, transferencias o eliminaciones — puede procesarse a través del canal EPP automatizado habitual. En cambio, cualquier cambio requiere un proceso manual de verificación fuera de banda que implica llamadas telefónicas, tokens criptográficos o comprobaciones de identidad presenciales entre el registrador y el registro. Esto es distinto del más común [bloqueo de transferencia](/es/glossary/transfer-lock/), que el [registrador](/es/glossary/registrar/) controla y puede activar o desactivar a través de sus propios sistemas; el bloqueo de registro eleva la protección al nivel del registro, dificultando enormemente los cambios no autorizados incluso si un atacante obtiene acceso completo a la cuenta del registrador. Es utilizado principalmente por instituciones financieras, grandes marcas y operadores de infraestructura crítica para proteger dominios de alto valor frente al [secuestro de dominio](/es/glossary/domain-hijacking/).
