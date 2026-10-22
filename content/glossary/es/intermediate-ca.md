---
title: "Autoridad de certificación intermedia"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "Una autoridad de certificación intermedia recibe facultades de firma mediante una cadena hasta un ancla de confianza."
keywords: ["CA intermedia", "autoridad de certificación intermedia", "autenticación TLS"]
also_known_as: ["CA intermedia"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /es/glossary/man-in-the-middle-attack/
  - /es/glossary/dane/
  - /es/glossary/caa/
  - /es/glossary/certificate-transparency/
---

Una **autoridad de certificación intermedia**, también llamada **CA intermedia**, tiene facultades de firma que otra [Autoridad de certificación](/es/glossary/certificate-authority/) delega mediante una cadena de certificados. Una cadena normalmente conecta un certificado de sitio web con una raíz de confianza, a veces mediante varios certificados intermedios. Las restricciones de los certificados limitan las facultades delegadas. La exposición de la [Clave Privada](/es/glossary/private-key/) de una CA intermedia puede permitir firmas de certificados fraudulentas dentro de esas facultades. Los clientes deben aplicar las actualizaciones de desconfianza o revocación pertinentes. Reemplazar un certificado de sitio web no elimina la clave intermedia comprometida de las decisiones de confianza de otros clientes.
