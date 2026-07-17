---
title: 'Résolveur DNS (Résolveur récursif)'
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Le serveur qui prend en charge une requête de domaine et parcourt la hiérarchie DNS pour retourner l'adresse correspondante.
keywords: ['résolveur DNS', 'résolveur récursif', 'résolveur', '8.8.8.8', '1.1.1.1', 'requête DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /fr/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /fr/blog/the-dyn-dns-mirai-attack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/tokenized-domain-vs-web3-domain/
  - /fr/blog/premium-web3-tlds/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/tld/
  - /fr/glossary/urs/
  - /fr/glossary/registry/
  - /fr/glossary/registrar/
---

Un **résolveur DNS** (ou *résolveur récursif*) est le serveur que votre appareil interroge chaque fois qu'il a besoin de convertir un domaine en [Adresse IP (IPv4 / IPv6)](/fr/glossary/ip-address/). Les résolveurs publics comme `1.1.1.1` (Cloudflare) et `8.8.8.8` (Google) font le travail : en partant de la [Zone racine (Serveurs racine)](/fr/glossary/root-zone/), ils descendent la hiérarchie du [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) jusqu'aux [Serveurs de noms (Enregistrement NS)](/fr/glossary/nameserver/) faisant autorité pour le domaine, puis mettent la réponse en cache pour la durée de son [TTL (Durée de vie)](/fr/glossary/ttl/). C'est cette partie du DNS qui rend l'expérience « tapez un nom, accédez à un site » aussi instantanée. Les résolveurs ne lisent que les données DNS publiques — ils n'ont aucune connaissance de qui *possède* un domaine, ce qui explique pourquoi la couche de propriété basée sur un [Portefeuille](/fr/glossary/wallet/) d'un domaine tokenisé est invisible lors de la résolution et ne change rien à la façon dont les noms sont résolus.

*Source(s) : RFC 1034 ; résolveur DNS Cloudflare.*
