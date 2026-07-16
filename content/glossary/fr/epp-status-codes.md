---
title: Codes de statut EPP
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Les indicateurs standardisés sur un domaine qui affichent son état — verrouillé, suspendu, en attente de transfert, et plus encore.
keywords: ['codes de statut EPP', 'clientHold', 'serverTransferProhibited', 'statut de domaine', 'suppression en attente']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /fr/blog/expired-domains-and-the-drop-cycle/
  - /fr/blog/domain-backorders-and-drop-catching/
  - /fr/blog/how-to-sell-a-domain-name-you-own/
  - /fr/blog/the-panix-com-domain-hijack/
  - /fr/blog/working-with-domain-brokers/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-security/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/epp/
  - /fr/glossary/registry/
  - /fr/glossary/dns/
  - /fr/glossary/transfer-lock/
---

Les **codes de statut EPP** sont les indicateurs lisibles par machine définis par l'Extensible Provisioning Protocol ([EPP](/fr/glossary/epp/)) qui décrivent exactement quelles opérations sont autorisées sur un domaine à tout moment. Ils sont répartis en deux espaces de noms : les codes `client*` définis par le [bureau d'enregistrement](/fr/glossary/registrar/) et les codes `server*` définis par le registre, les codes serveur ayant la priorité. Les plus courants incluent `clientTransferProhibited` (le [verrouillage de transfert](/fr/glossary/transfer-lock/) qui bloque les déplacements sortants), `serverDeleteProhibited` (protection au niveau du registre contre la suppression), `clientHold` (suspend la résolution DNS, souvent pour non-paiement), et `pendingDelete` qui marque un domaine dans sa période de grâce avant d'être libéré et disponible à l'enregistrement à nouveau — un état adjacent à la [suppression en attente](/fr/glossary/pending-delete/). Comprendre ces codes a une importance pratique : un domaine affichant `serverTransferProhibited` ne peut pas être déplacé même après que le bureau d'enregistrement l'a déverrouillé, ce qui surprend les acheteurs en cours de transaction.
