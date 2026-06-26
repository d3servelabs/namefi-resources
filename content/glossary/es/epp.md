---
title: EPP
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El protocolo estándar que usan los registradores para registrar y gestionar dominios con un registro.
keywords: ['EPP', 'Extensible Provisioning Protocol', 'gestión de dominios', 'protocolo de registro', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/expired-domains-and-the-drop-cycle/
  - /es/blog/what-is-udrp/
  - /es/blog/domain-escrow-explained/
relatedTopics:
  - /es/topics/domain-basics/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/epp-status-codes/
  - /es/glossary/dns/
  - /es/glossary/icann/
---

**EPP** (Extensible Provisioning Protocol) es el protocolo de comandos basado en XML definido en la RFC 5730 que regula la forma en que un [registrador](/es/glossary/registrar/) se comunica con un [registro](/es/glossary/registry/) para crear, actualizar, transferir o eliminar registros de dominio. Cada vez que un registrador registra un nuevo nombre, lo renueva o inicia una transferencia, envía un comando EPP a través de una sesión TCP segura al servidor EPP del registro y recibe una respuesta estructurada que confirma el éxito o informa de un error. El protocolo también transporta el [código de autorización](/es/glossary/auth-code/) utilizado para autorizar las transferencias salientes y expone los [códigos de estado EPP](/es/glossary/epp-status-codes/) —como `clientTransferProhibited` o `serverHold`— que describen el estado actual de un dominio. Dado que el EPP está estrictamente controlado, el acceso se limita a los registradores acreditados; los usuarios finales nunca interactúan con él directamente.
