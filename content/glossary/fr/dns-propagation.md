---
title: Propagation DNS
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Le délai avant qu'une modification DNS soit visible partout, au fur et à mesure que les anciens enregistrements mis en cache expirent sur les résolveurs.
keywords: ['propagation DNS', 'délai de mise à jour DNS', 'TTL', 'cache DNS', 'changement de serveur de noms']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/the-malaysia-airlines-dns-hijack/
  - /fr/blog/the-perl-com-domain-theft/
  - /fr/blog/dns-on-tokenized-domains/
  - /fr/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/ttl/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/registry/
---

La **propagation DNS** est le délai entre l'application d'une modification [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) et le moment où cette modification est visible partout sur internet. Ce phénomène se produit parce que les [Résolveur DNS (Résolveur récursif)](/fr/glossary/dns-resolver/) du monde entier mettent en cache l'ancienne réponse jusqu'à l'expiration de son [TTL (Durée de vie)](/fr/glossary/ttl/), de sorte qu'un nouvel [enregistrement](/fr/glossary/dns-record-types/) ou la mise à jour d'un [Serveur de noms (Enregistrement NS)](/fr/glossary/nameserver/) se déploie progressivement plutôt qu'instantanément — de quelques minutes à quelques jours. Il n'existe pas de « DNS » global à mettre à jour en une seule fois ; la propagation n'est que l'expiration progressive des caches. La solution pratique consiste à abaisser le TTL avant une modification planifiée. Rien de tout cela ne touche à la propriété d'un domaine : la tokenisation change qui contrôle le nom on-chain, non la rapidité avec laquelle les modifications DNS se répandent.

*Source(s) : glossaire TTL Cloudflare ; RFC 1035.*
