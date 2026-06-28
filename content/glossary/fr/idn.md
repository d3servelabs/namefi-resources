---
title: IDN (Nom de domaine internationalisé) / Punycode
date: '2026-06-22'
language: fr
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: Un domaine utilisant des caractères non-ASCII, encodé pour le DNS sous forme de Punycode ASCII commençant par xn--.
keywords: ['IDN', 'nom de domaine internationalisé', 'Punycode', 'xn--', 'domaine Unicode', 'homographe']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /fr/blog/what-is-a-tld/
  - /fr/blog/from-discordapp-com-to-discord-com/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /fr/blog/domain-hacks-explained/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-investing/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/tld/
  - /fr/glossary/dns/
  - /fr/glossary/phishing/
---

Un **IDN (nom de domaine internationalisé)** est un domaine utilisant des caractères non-ASCII — `münchen.de`, `中国.cn`, ou un domaine emoji — afin que les noms puissent être écrits dans des systèmes d'écriture autres que le latin de base. Comme le [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) lui-même ne gère que l'ASCII, un IDN est encodé en une chaîne ASCII compatible appelée **Punycode**, qui commence toujours par le préfixe `xn--` (ainsi `münchen` devient `xn--mnchen-3ya`). Les [Registres (Opérateurs de registre)](/fr/glossary/registry/) et les [Registraires](/fr/glossary/registrar/) prennent en charge les IDN au niveau du [TLD (domaine de premier niveau)](/fr/glossary/tld/), bien qu'ils présentent un risque connu : des caractères visuellement similaires permettent des *homographes* utilisés dans le phishing. Un IDN reste en dessous un nom enregistré ordinaire, il peut donc être tokenisé et conservé dans un [Portefeuille](/fr/glossary/wallet/) comme tout autre domaine. *Sources : RFC 5890 ; Ressources IDN de l'ICANN.*
