---
title: WHOIS (et RDAP)
date: '2026-05-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: WHOIS et son successeur RDAP sont les services de recherche publics pour les détails d'enregistrement d'un domaine, tels que son registraire et sa date d'expiration.
keywords: ['WHOIS', 'RDAP', 'recherche enregistrement domaine', 'informations titulaire', 'recherche propriété domaine']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/expired-domains-and-the-drop-cycle/
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/what-is-udrp/
  - /fr/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /fr/topics/domain-basics/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/icann/
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/whois-privacy/
  - /fr/glossary/registry/
---

**WHOIS** est le protocole et service public de longue date permettant de rechercher des informations d'enregistrement sur un domaine — registraire, dates d'enregistrement et d'expiration, et historiquement les coordonnées du titulaire. Son successeur moderne est **RDAP (Registration Data Access Protocol)**, qui retourne du JSON structuré et est le protocole vers lequel [ICANN](/fr/glossary/icann/) et les registres migrent. Pour les [domaines tokenisés](/fr/blog/what-are-tokenized-domains/), les enregistrements WHOIS/RDAP existent toujours au niveau du [registraire](/fr/glossary/registrar/) car l'enregistrement [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) sous-jacent est réel et reconnu par l'ICANN — seuls les *mécanismes de propriété et de transfert* sont déplacés vers la couche [on-chain](/fr/glossary/on-chain/). La protection de la vie privée est de plus en plus courante : de nombreux registraires masquent désormais par défaut les coordonnées personnelles, conformément aux lois sur la vie privée comme le RGPD. Référence : [recherche WHOIS de l'ICANN](https://lookup.icann.org/).
