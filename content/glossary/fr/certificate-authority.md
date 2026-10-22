---
title: "Autorité de certification"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "Une autorité de certification délivre des certificats numériques qui associent des identités à des clés publiques."
keywords: ["autorité de certification", "CA", "authentification TLS"]
also_known_as: ["CA", "Autorité certificatrice"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/dns-on-tokenized-domains/
  - /fr/blog/dnssec-for-domain-owners/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/intermediate-ca/
  - /fr/glossary/man-in-the-middle-attack/
  - /fr/glossary/dane/
  - /fr/glossary/caa/
  - /fr/glossary/certificate-transparency/
---

Une **autorité de certification**, également appelée **autorité certificatrice** ou **CA**, délivre des certificats numériques qui associent des identités à une [Clé Publique](/fr/glossary/public-key/). Une CA TLS reconnue publiquement vérifie le contrôle du domaine et les exigences d'identité applicables avant de signer un certificat de site web. Les clients valident la chaîne de certificats par rapport à une racine de confiance et vérifient que le serveur prouve la possession de la clé privée correspondante. Une CA peut déléguer son pouvoir de signature à une [Autorité de certification intermédiaire](/fr/glossary/intermediate-ca/). La confiance dans une CA authentifie une identité selon la politique du client. La confiance dans une CA ne garantit pas l'honnêteté du contenu d'un site web.
