---
title: EPP
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Le protocole standard que les bureaux d'enregistrement utilisent pour enregistrer et gérer des domaines auprès d'un registre.
keywords: ['EPP', 'Extensible Provisioning Protocol', 'gestion de domaine', 'protocole de registre', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
---

L'**EPP** (Extensible Provisioning Protocol, aussi appelé *protocole de provisionnement extensible*) est le protocole de commandes XML défini dans la RFC 5730 qui régit la façon dont un [bureau d'enregistrement](/fr/glossary/registrar/) communique avec un [registre](/fr/glossary/registry/) pour créer, mettre à jour, transférer ou supprimer des enregistrements de domaine. Chaque fois qu'un bureau d'enregistrement enregistre un nouveau nom, le renouvelle ou initie un transfert, il envoie une commande EPP sur une session TCP sécurisée au serveur EPP du registre et reçoit une réponse structurée confirmant le succès ou signalant une erreur. Le protocole transporte également le [code d'autorisation](/fr/glossary/auth-code/) utilisé pour autoriser les transferts sortants et expose les [codes de statut EPP](/fr/glossary/epp-status-codes/) — tels que `clientTransferProhibited` ou `serverHold` — qui décrivent l'état actuel d'un domaine. Parce que l'EPP est étroitement contrôlé, l'accès est limité aux bureaux d'enregistrement accrédités ; les utilisateurs finaux n'interagissent jamais directement avec lui.
