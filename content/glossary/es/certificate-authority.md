---
title: "Autoridad de certificación"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Una autoridad de certificación emite certificados digitales que vinculan identidades con claves públicas."
keywords: ["autoridad de certificación", "CA", "autenticación TLS"]
also_known_as: ["CA", "Autoridad certificadora"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /es/glossary/intermediate-ca/
  - /es/glossary/man-in-the-middle-attack/
  - /es/glossary/dane/
  - /es/glossary/caa/
  - /es/glossary/certificate-transparency/
---

Una **autoridad de certificación**, también llamada **autoridad certificadora** o **CA**, emite certificados digitales que vinculan identidades con [Clave Pública](/es/glossary/public-key/). Una CA TLS de confianza pública comprueba el control del dominio y los requisitos de identidad aplicables antes de firmar un certificado de sitio web. Los clientes validan la cadena de certificados frente a una raíz de confianza y comprueban que el servidor demuestre la posesión de la clave privada correspondiente. Una CA puede delegar la facultad de firmar en una [Autoridad de certificación intermedia](/es/glossary/intermediate-ca/). La confianza en una CA autentica una identidad según la política del cliente. La confianza en una CA no garantiza que el contenido de un sitio web sea honesto.
