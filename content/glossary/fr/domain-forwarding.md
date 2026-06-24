---
title: Transfert de domaine
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Envoyer automatiquement les visiteurs d'un domaine vers une autre adresse, souvent via une redirection 301.
keywords: ['transfert de domaine', 'redirection 301', 'redirection URL', 'DNS', 'gestion de domaine']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

Le **transfert de domaine** (aussi appelé *redirection URL* ou *redirection 301*) est une configuration qui envoie automatiquement chaque visiteur arrivant sur un domaine vers une URL de destination différente. La variante [redirection 301](/fr/glossary/301-redirect/) signale aux moteurs de recherche que le déménagement est permanent, transmettant la majeure partie de l'équité de lien du domaine original vers la cible — ce qui en fait le choix privilégié lors de la consolidation de marques ou de la migration du trafic. Le transfert est configuré soit dans le panneau de contrôle du bureau d'enregistrement, soit en définissant un [type d'enregistrement DNS](/fr/glossary/dns-record-types/) qui pointe vers un serveur web appliquant la règle de redirection. Un cas d'utilisation courant consiste à acheter un [sous-domaine](/fr/glossary/subdomain/) correspondant ou une variante avec faute de frappe et à le rediriger vers le site principal pour capturer le trafic égaré. Le transfert se distingue de la délégation DNS complète : le domaine se résout toujours via DNS, mais les instructions au niveau HTTP redirigent le navigateur.
