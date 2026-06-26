---
title: 'Suppression en attente (Drop)'
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Le statut final avant qu''un domaine non renouvelé soit libéré à nouveau pour l''enregistrement public.
keywords: ['suppression en attente', 'drop de domaine', 'drop-catching', 'domaine expiré', 'libération']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /fr/blog/expired-domains-and-the-drop-cycle/
  - /fr/blog/domain-backorders-and-drop-catching/
  - /fr/blog/how-to-win-domain-auctions/
  - /fr/blog/hand-registering-domains-to-flip/
  - /fr/blog/when-to-drop-a-domain/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/registry/
  - /fr/glossary/icann/
  - /fr/glossary/backorder/
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
---

La **suppression en attente** est le dernier statut dans le cycle de vie d'un domaine déchu : après que la [Période de rachat (RGP)](/fr/glossary/redemption-period/) s'est écoulée sans récupération, le [Registre (Opérateur de registre)](/fr/glossary/registry/) marque le nom `pendingDelete` pendant environ cinq jours, durant lesquels il ne peut être ni renouvelé ni transféré. À l'issue de cette fenêtre, le domaine **tombe** (*drop*) — il est purgé et libéré à nouveau dans le domaine public, disponible pour un nouvel enregistrement selon le principe du premier arrivé, premier servi. Cet instant est celui que les services de [Backorder (Drop-Catching)](/fr/glossary/backorder/) et de drop-catching cherchent à capturer pour les noms recherchés. La suppression en attente est un état purement au niveau du [Registre (Opérateur de registre)](/fr/glossary/registry/) dans le système [DNS (Système de Noms de Domaine)](/fr/glossary/dns/) traditionnel ; elle n'a pas d'équivalent dans la couche de propriété on-chain, ce qui explique pourquoi il est toujours important de maintenir renouvelé l'enregistrement sous-jacent d'un domaine tokenisé. *Source : Codes de statut EPP de l'ICANN.*
