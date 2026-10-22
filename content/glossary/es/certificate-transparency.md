---
title: "Transparencia de certificados"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "La transparencia de certificados expone la emisión de certificados TLS en registros públicos para su supervisión y auditoría independientes."
keywords: ["transparencia de certificados", "CT", "autenticación TLS"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
relatedArticles:
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/dns-on-tokenized-domains/
  - /es/blog/dnssec-for-domain-owners/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/certificate-authority/
  - /es/glossary/intermediate-ca/
  - /es/glossary/man-in-the-middle-attack/
  - /es/glossary/dane/
  - /es/glossary/caa/
---

La **transparencia de certificados**, también llamada **CT**, registra certificados TLS en registros públicos que solo permiten añadir entradas. Los operadores de dominios y otros supervisores pueden examinar los registros para detectar emisiones inesperadas de una [Autoridad de certificación](/es/glossary/certificate-authority/). Las políticas de los clientes pueden exigir pruebas de inclusión en registros antes de aceptar un certificado. El registro por sí solo no impide la emisión fraudulenta ni revoca un certificado. La aplicación de las políticas por el cliente y la supervisión ofrecen protecciones diferentes. CT complementa [CAA](/es/glossary/caa/): CAA orienta la autorización del emisor antes de la emisión, mientras que CT expone los certificados registrados para examinarlos después.
