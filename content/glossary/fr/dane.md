---
title: "DANE"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "DANE authentifie les services TLS par des associations de certificats ou de clés dans des enregistrements TLSA protégés par DNSSEC."
keywords: ["DANE", "authentification des entités nommées fondée sur le DNS", "authentification TLS"]
also_known_as: ["Authentification des entités nommées fondée sur le DNS"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /fr/glossary/caa/
  - /fr/glossary/certificate-transparency/
---

**DANE**, sigle d'**authentification des entités nommées fondée sur le DNS**, utilise des enregistrements TLSA pour associer un service TLS à un certificat, une clé publique ou une ancre de confiance. [DNSSEC (Extensions de sécurité du DNS)](/fr/glossary/dnssec/) authentifie les données DNS. Un client compatible fait respecter l'association pendant l'authentification TLS. Selon l'usage choisi, DANE peut contraindre une [Autorité de certification](/fr/glossary/certificate-authority/) publique ou authentifier un service indépendamment de la confiance dans les CA publiques. Publier simplement des enregistrements TLSA ne protège pas les clients qui ignorent DANE. Les opérateurs doivent coordonner les changements de clés avec les mises à jour TLSA et préserver la validation DNSSEC.
