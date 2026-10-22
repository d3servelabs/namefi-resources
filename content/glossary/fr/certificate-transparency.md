---
title: "Transparence des certificats"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "La transparence des certificats rend la délivrance de certificats TLS visible dans des journaux publics pour un contrôle indépendant."
keywords: ["transparence des certificats", "CT", "authentification TLS"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /fr/glossary/intermediate-ca/
  - /fr/glossary/man-in-the-middle-attack/
  - /fr/glossary/dane/
  - /fr/glossary/caa/
---

La **transparence des certificats**, également appelée **CT**, consigne les certificats TLS dans des journaux publics qui autorisent uniquement l'ajout d'entrées. Les opérateurs de domaines et les autres observateurs peuvent examiner les journaux pour détecter des délivrances inattendues par une [Autorité de certification](/fr/glossary/certificate-authority/). Les politiques des clients peuvent exiger une preuve de journalisation avant d'accepter un certificat. La journalisation seule n'empêche pas les délivrances frauduleuses et ne révoque aucun certificat. L'application des règles par les clients et la surveillance apportent des protections différentes. CT complète [CAA](/fr/glossary/caa/) : CAA encadre l'autorisation de l'émetteur avant la délivrance, tandis que CT expose ensuite les certificats journalisés à l'examen.
