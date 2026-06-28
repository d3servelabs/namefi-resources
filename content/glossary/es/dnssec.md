---
title: DNSSEC (Extensiones de Seguridad del DNS)
date: '2026-05-22'
language: es
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: Firmas criptográficas sobre registros DNS que permiten a los resolutores verificar que una respuesta es auténtica y no fue falsificada ni alterada en tránsito.
keywords: ['DNSSEC', 'seguridad DNS', 'seguridad de dominio', 'registro DS', 'cadena de confianza', 'DNS criptográfico']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /es/blog/dns-on-tokenized-domains/
  - /es/blog/how-domain-hijacking-actually-happens/
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/the-dnspionage-campaign/
  - /es/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/icann/
  - /es/glossary/tld/
---

**DNSSEC (Extensiones de Seguridad del Sistema de Nombres de Dominio)** es un conjunto de extensiones criptográficas al protocolo [DNS](/es/glossary/dns/) que permite a los resolutores verificar la autenticidad e integridad de las respuestas DNS. Sin DNSSEC, un atacante puede falsificar o manipular las respuestas DNS en el camino entre el resolutor y el servidor autoritativo, redirigiendo a los usuarios a infraestructura maliciosa. Con DNSSEC, los registros están firmados y una cadena de confianza se extiende desde la raíz del DNS hacia abajo a través de cada zona mediante registros DS. DNSSEC está especificado en [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) y RFCs relacionados. Tokenizar un dominio no cambia DNSSEC en absoluto — la cadena de confianza sigue pasando por el [registrador](/es/glossary/registrar/) y el registro, y los registros DS se publican de la misma manera. Muchos proveedores de DNS (Cloudflare, Route53) firman zonas automáticamente cuando DNSSEC está habilitado.
