---
title: Détournement DNS
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Rediriger le trafic d'un domaine en altérant la résolution DNS plutôt que son enregistrement.
keywords: ['détournement DNS', 'empoisonnement de cache', 'usurpation DNS', 'DNSSEC', 'redirection de trafic']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-sea-turtle-dns-espionage/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-investor-field-guide/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/bgp-hijack/
  - /fr/glossary/registry/
  - /fr/glossary/urs/
---

Le **détournement DNS** (aussi appelé usurpation DNS ou empoisonnement de cache) attaque la couche de résolution plutôt que l'enregistrement lui-même : au lieu de saisir le domaine au niveau du bureau d'enregistrement, l'attaquant corrompt ce qu'un [résolveur DNS](/fr/glossary/dns-resolver/) ou un [serveur de noms](/fr/glossary/nameserver/) croit que le domaine pointe, envoyant silencieusement les visiteurs vers une IP malveillante. Dans une attaque par empoisonnement de cache, une réponse DNS falsifiée est acceptée par un résolveur récursif et mise en cache pour la durée du TTL, redirigeant tous les utilisateurs que ce résolveur sert — sans aucun changement visible dans les enregistrements [DNS](/fr/glossary/dns/) faisant autorité. La principale contre-mesure technique est [DNSSEC](/fr/glossary/dnssec/), qui signe cryptographiquement les réponses DNS afin que les résolveurs puissent détecter toute altération. Contrairement au vol de domaine traditionnel, le détournement DNS laisse les enregistrements de propriété intacts, ce qui le rend plus difficile à détecter sans surveillance active de l'endroit où votre domaine se résout réellement.
