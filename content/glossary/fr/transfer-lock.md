---
title: Verrou de Transfert
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un statut qui empêche un domaine d''être transféré vers un autre bureau d''enregistrement jusqu''à ce qu''il soit explicitement déverrouillé.
keywords: ['verrou de transfert', 'verrou du bureau d''enregistrement', 'sécurité de domaine', 'statut EPP', 'transfert de domaine']
also_known_as: ['Verrou du bureau d''enregistrement']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
---

Le **verrou de transfert** (aussi appelé *verrou du bureau d'enregistrement* ; statut EPP `clientTransferProhibited`) est un indicateur défini par votre [bureau d'enregistrement](/fr/glossary/registrar/) qui empêche un domaine d'être déplacé vers un autre bureau d'enregistrement sans être préalablement délibérément déverrouillé. Lorsque le verrou est activé, toute tentative d'initier un [transfert inter-bureaux](/fr/glossary/cross-registrar-transfer/) est rejetée avant de pouvoir aboutir, même si le demandeur dispose du [code d'autorisation](/fr/glossary/auth-code/). C'est l'une des défenses les plus simples et les plus efficaces contre le [détournement de domaine](/fr/glossary/domain-hijacking/) : un voleur qui a compromis votre compte ne peut pas transférer silencieusement l'actif tant que le verrou est actif. La bonne pratique consiste à maintenir le verrou de transfert activé en permanence et à ne le retirer que pendant la brève fenêtre nécessaire pour finaliser un transfert légitime.
