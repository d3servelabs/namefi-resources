---
title: 'TTL (Tiempo de Vida)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El tiempo, en segundos, durante el cual un registro DNS puede ser almacenado en caché por los resolvedores antes de consultarse de nuevo.
keywords: ['TTL', 'tiempo de vida', 'caché DNS', 'propagación DNS', 'caché de registros']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-sushiswap-miso-insider-attack/
  - /es/blog/working-with-domain-brokers/
  - /es/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/dns-propagation/
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/registry/
---

El **TTL (tiempo de vida)** es un valor, en segundos, adjunto a cada [registro DNS](/es/glossary/dns-record-types/) que indica a los [resolvedores](/es/glossary/dns-resolver/) cuánto tiempo pueden almacenar en caché la respuesta antes de volver a consultarla. Un TTL corto (por ejemplo, 300 segundos) hace que los cambios surtan efecto rápidamente, pero genera más consultas; un TTL largo (86.400 segundos = un día) es eficiente, pero significa que una actualización persiste en las cachés. Reducir el TTL un día antes de planificar un cambio es el truco estándar para una [propagación DNS](/es/glossary/dns-propagation/) rápida. El TTL solo regula el almacenamiento en caché del DNS — no tiene relación con el período de registro de un dominio ni con la capa de propiedad [en cadena](/es/glossary/on-chain/) que añade un dominio tokenizado. *Fuente(s): RFC 1035; glosario de TTL de Cloudflare.*
