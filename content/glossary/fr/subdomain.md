---
title: Sous-domaine
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un préfixe ajouté à un domaine pour créer une adresse distincte, comme blog.example.com ou app.example.com.
keywords: ['sous-domaine', 'hôte', 'blog.example.com', 'DNS', 'domaine de deuxième niveau']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/what-is-a-tld/
  - /fr/blog/domain-hacks-explained/
  - /fr/blog/domain-terminology-guide/
  - /fr/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/tld/
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/domain-forwarding/
---

Un **sous-domaine** est un préfixe ajouté à votre domaine pour créer une adresse distincte sous celui-ci — `blog.example.com`, `app.example.com` ou `mail.example.com` sont tous des sous-domaines de `example.com`. On en crée un en ajoutant un [enregistrement DNS](/fr/glossary/dns-record-types/) (généralement de type A ou CNAME) au niveau des [serveurs de noms](/fr/glossary/nameserver/) du domaine parent, sans enregistrement supplémentaire ni frais. Les sous-domaines permettent à un seul nom enregistré d'héberger de nombreux services, ce qui en fait un élément fondamental pour les sites, les applications et les API. Dans le monde tokenisé, la propriété réside au niveau du [domaine de deuxième niveau](/fr/glossary/second-level-domain/) [enregistré](/fr/glossary/registrant/) ; les sous-domaines sont de la configuration qui relève de celui qui contrôle le [portefeuille](/fr/glossary/wallet/) du domaine parent.

*Source(s) : RFC 1034 ; glossaire des sous-domaines Cloudflare.*
