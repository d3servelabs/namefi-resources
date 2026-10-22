---
title: "DANE"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE autentica servicios TLS mediante asociaciones de certificados o claves en registros TLSA protegidos por DNSSEC."
keywords: ["DANE", "autenticación de entidades con nombre basada en DNS", "autenticación TLS"]
also_known_as: ["Autenticación de entidades con nombre basada en DNS"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /es/glossary/caa/
  - /es/glossary/certificate-transparency/
---

**DANE**, sigla de **autenticación de entidades con nombre basada en DNS**, usa registros TLSA para asociar un servicio TLS con un certificado, una clave pública o un ancla de confianza. [DNSSEC (Extensiones de Seguridad del DNS)](/es/glossary/dnssec/) autentica los datos DNS. Un cliente compatible aplica la asociación durante la autenticación TLS. Según el uso seleccionado, DANE puede restringir una [Autoridad de certificación](/es/glossary/certificate-authority/) pública o autenticar un servicio independientemente de la confianza en las CA públicas. Publicar registros TLSA por sí solo no protege a los clientes que ignoran DANE. Los operadores deben coordinar los cambios de claves con las actualizaciones TLSA y preservar la validación DNSSEC.
