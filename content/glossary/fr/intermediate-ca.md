---
title: "Autorité de certification intermédiaire"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Une autorité de certification intermédiaire reçoit un pouvoir de signature par une chaîne menant à une ancre de confiance."
keywords: ["CA intermédiaire", "autorité de certification intermédiaire", "authentification TLS"]
also_known_as: ["CA intermédiaire"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /fr/glossary/certificate-authority/
  - /fr/glossary/man-in-the-middle-attack/
  - /fr/glossary/dane/
  - /fr/glossary/caa/
  - /fr/glossary/certificate-transparency/
---

Une **autorité de certification intermédiaire**, également appelée **CA intermédiaire**, possède un pouvoir de signature qu'une autre [Autorité de certification](/fr/glossary/certificate-authority/) délègue par une chaîne de certificats. Une chaîne relie normalement un certificat de site web à une racine de confiance, parfois par plusieurs certificats intermédiaires. Les contraintes des certificats limitent le pouvoir délégué. La compromission de la [Clé Privée](/fr/glossary/private-key/) d'une CA intermédiaire peut permettre des signatures de certificats frauduleuses dans les limites de ce pouvoir. Les clients doivent appliquer les mises à jour pertinentes de retrait de confiance ou de révocation. Remplacer un certificat de site web ne supprime pas une clé intermédiaire compromise des décisions de confiance des autres clients.
