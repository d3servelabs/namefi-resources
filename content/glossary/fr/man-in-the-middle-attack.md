---
title: "Attaque de l’homme du milieu"
date: '2026-10-22'
language: "fr"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Une attaque de l’homme du milieu place un attaquant entre des interlocuteurs pour intercepter ou modifier leurs communications."
keywords: ["attaque de l’homme du milieu", "MITM", "authentification TLS"]
also_known_as: ["MITM", "Attaque sur le chemin de communication"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /fr/glossary/dane/
  - /fr/glossary/caa/
  - /fr/glossary/certificate-transparency/
---

Une **attaque de l’homme du milieu**, également appelée **MITM** ou **attaque sur le chemin de communication**, place un attaquant entre des interlocuteurs. L'attaquant intercepte, relaie ou modifie les communications alors que les interlocuteurs peuvent croire communiquer directement. Le [Détournement DNS](/fr/glossary/dns-hijacking/) peut rediriger une connexion vers l'attaquant. HTTPS combat normalement l'usurpation d'un point de terminaison par la validation des certificats et la preuve de possession de la clé privée. Une [Autorité de certification](/fr/glossary/certificate-authority/) compromise peut fragiliser cette authentification lorsqu'un client accepte encore l'autorité concernée. Le chiffrement peut alors protéger une connexion dont le point de terminaison est l'attaquant.
