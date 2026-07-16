---
title: 'TTL (Durée de vie)'
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: La durée, en secondes, pendant laquelle un enregistrement DNS peut être mis en cache par les résolveurs avant d'être à nouveau interrogé.
keywords: ['TTL', 'durée de vie', 'cache DNS', 'propagation DNS', 'mise en cache des enregistrements']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /fr/blog/the-panix-com-domain-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-sushiswap-miso-insider-attack/
  - /fr/blog/working-with-domain-brokers/
  - /fr/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-investing/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/dns-propagation/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/registry/
---

**TTL (time to live, durée de vie)** est une valeur, en secondes, attachée à chaque [enregistrement DNS](/fr/glossary/dns-record-types/) qui indique aux [résolveurs](/fr/glossary/dns-resolver/) combien de temps ils peuvent mettre la réponse en cache avant de la reverifier. Un TTL court (par exemple 300 secondes) permet aux modifications de prendre effet rapidement mais génère davantage de requêtes ; un TTL long (86 400 secondes = un jour) est efficace mais signifie qu'une mise à jour subsiste dans les caches. Abaisser le TTL la veille d'une modification planifiée est l'astuce habituelle pour une [Propagation DNS](/fr/glossary/dns-propagation/) rapide. Le TTL régit uniquement la mise en cache DNS — il n'a aucun lien avec la durée d'enregistrement d'un domaine ni avec la couche de propriété [on-chain](/fr/glossary/on-chain/) qu'un domaine tokenisé ajoute.

*Source(s) : RFC 1035 ; glossaire TTL Cloudflare.*
