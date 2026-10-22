---
title: "CAA"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Un enregistrement CAA identifie les autorités de certification qu’un domaine autorise à délivrer des certificats."
keywords: ["CAA", "autorisation des autorités de certification", "authentification TLS"]
also_known_as: ["Autorisation des autorités de certification"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /fr/glossary/certificate-transparency/
---

**CAA**, sigle d'**autorisation des autorités de certification**, est un enregistrement DNS qui identifie les [autorités de certification](/fr/glossary/certificate-authority/) qu'un domaine autorise à délivrer des certificats. Une CA conforme vérifie les enregistrements CAA applicables avant la délivrance. [DNSSEC (Extensions de sécurité du DNS)](/fr/glossary/dnssec/) peut authentifier la réponse DNS contenant la politique. CAA réduit les délivrances non souhaitées par des processus conformes. CAA ne fait pas rejeter aux navigateurs les certificats d'autres émetteurs, ne révoque pas les certificats existants et n'arrête pas une personne qui falsifie directement des certificats avec une clé de signature de CA compromise. CAA définit l'autorisation de l'émetteur, tandis que la validation du domaine reste une exigence distincte.
