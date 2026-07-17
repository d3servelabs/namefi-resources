---
title: Confidentialité WHOIS
date: '2026-06-22'
language: fr
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Un service qui masque les coordonnées personnelles d''un titulaire dans les registres WHOIS ou RDAP publics.
keywords: ['confidentialité WHOIS', 'protection de la confidentialité', 'RDAP', 'confidentialité du titulaire', 'masquage des coordonnées']
also_known_as: ['Protection de la confidentialité']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /fr/blog/from-massdrop-com-to-drop-com/
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/from-getdropbox-com-to-dropbox-com/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-investing/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/whois/
---

La **confidentialité WHOIS** (aussi appelée *protection de la confidentialité*) est un service proposé par la plupart des [bureaux d'enregistrement](/fr/glossary/registrar/) qui substitue un contact mandataire — généralement l'adresse du bureau d'enregistrement lui-même et un e-mail de transfert — aux vraies coordonnées du [titulaire](/fr/glossary/registrant/) (nom, adresse, téléphone et e-mail) dans les enregistrements publics [WHOIS](/fr/glossary/whois/) et RDAP. Sans ce service, ces détails sont librement consultables, exposant les propriétaires au spam, aux tentatives d'ingénierie sociale et à l'hameçonnage ciblé visant à compromettre les identifiants du bureau d'enregistrement. L'application du RGPD depuis 2018 a poussé de nombreux registres à masquer par défaut les données personnelles dans le WHOIS des gTLD, mais la protection varie selon le TLD et le bureau d'enregistrement, et activer explicitement un service de confidentialité reste une bonne pratique. Il est important de comprendre ce que la protection de la confidentialité ne fait pas : elle masque les coordonnées mais n'empêche pas un attaquant techniquement compétent d'utiliser l'énumération DNS ou les journaux de transparence des certificats pour cartographier l'infrastructure d'un domaine.
