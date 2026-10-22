---
title: "CAA"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Un registro CAA identifica las autoridades de certificación que un dominio autoriza a emitir certificados."
keywords: ["CAA", "autorización de autoridades de certificación", "autenticación TLS"]
also_known_as: ["Autorización de autoridades de certificación"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /es/glossary/certificate-transparency/
---

**CAA**, sigla de **autorización de autoridades de certificación**, es un registro DNS que identifica las [autoridades de certificación](/es/glossary/certificate-authority/) que un dominio autoriza a emitir certificados. Una CA que cumple la norma comprueba los registros CAA aplicables antes de emitirlos. [DNSSEC (Extensiones de Seguridad del DNS)](/es/glossary/dnssec/) puede autenticar la respuesta DNS que contiene la política. CAA reduce la emisión no deseada mediante procesos conformes. CAA no hace que los navegadores rechacen certificados de otros emisores, no revoca certificados existentes ni detiene a alguien que falsifica certificados directamente con una clave de firma de CA comprometida. CAA especifica la autorización del emisor, mientras que la validación del dominio sigue siendo un requisito independiente.
