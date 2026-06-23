---
title: Fichier de zone (Enregistrement glue)
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Le fichier texte contenant tous les enregistrements DNS d'un domaine, y compris les enregistrements glue pour ses serveurs de noms.
keywords: ['fichier de zone', 'enregistrement glue', 'zone DNS', 'enregistrements autoritaires', 'serveur de noms']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
---

Un **fichier de zone** est le fichier texte sur les [Serveurs de noms (Enregistrement NS)](/fr/glossary/nameserver/) autoritaires d'un domaine, qui contient l'ensemble de ses [enregistrements DNS](/fr/glossary/dns-record-types/) — les entrées A, MX, TXT et autres qui définissent le comportement du domaine. Un **enregistrement glue** est un cas particulier : lorsque les serveurs de noms d'un domaine résident *sous ce même domaine* (par exemple `ns1.example.com` servant `example.com`), le [Registre (Opérateur de registre)](/fr/glossary/registry/) parent doit publier directement l'[Adresse IP (IPv4 / IPv6)](/fr/glossary/ip-address/) du serveur de noms dans la zone parente pour éviter une résolution circulaire. Modifier le fichier de zone est la façon dont on configure le [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) d'un domaine. Il s'agit de données opérationnelles, distinctes de la propriété — ce que précisément un domaine tokenisé déplace vers une couche contrôlée par un [Portefeuille](/fr/glossary/wallet/). *Sources : RFC 1035 ; Glossaire DNS Cloudflare.*
