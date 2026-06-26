---
title: DNSSEC (Extensions de sécurité du DNS)
date: '2026-05-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Des signatures cryptographiques sur les enregistrements DNS permettant aux résolveurs de vérifier qu'une réponse est authentique et n'a pas été falsifiée ou altérée en transit.
keywords: ['DNSSEC', 'sécurité DNS', 'sécurité domaine', 'enregistrement DS', 'chaîne de confiance', 'DNS cryptographique']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /fr/blog/dns-on-tokenized-domains/
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
---

**DNSSEC (Domain Name System Security Extensions)** est un ensemble d'extensions cryptographiques au protocole [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) qui permet aux résolveurs de vérifier l'authenticité et l'intégrité des réponses DNS. Sans DNSSEC, un attaquant peut falsifier ou altérer les réponses DNS sur le chemin entre le résolveur et le serveur faisant autorité, redirigeant les utilisateurs vers une infrastructure malveillante. Avec DNSSEC, les enregistrements sont signés et une chaîne de confiance s'étend depuis la racine DNS jusqu'à chaque zone via des enregistrements DS. DNSSEC est spécifié dans la [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) et les RFC connexes. La tokenisation d'un domaine ne modifie pas DNSSEC — la chaîne de confiance passe toujours par le [registraire](/fr/glossary/registrar/) et le registre, et les enregistrements DS sont publiés de la même manière. De nombreux fournisseurs DNS (Cloudflare, Route53) signent automatiquement les zones lorsque DNSSEC est activé.
