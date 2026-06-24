---
title: Clé Privée
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Le nombre secret qui contrôle un compte blockchain et signe ses transactions ; il ne doit jamais être partagé.
keywords: ['clé privée', 'clé de signature', 'clé de portefeuille', 'clé secrète', 'compte blockchain']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
---

Une **clé privée** est le nombre secret — 256 bits sur la plupart des blockchains — qui contrôle un compte : elle produit les signatures numériques qui autorisent chaque transaction depuis l'adresse, et elle ne doit jamais quitter votre contrôle. Si vous la perdez, vous perdez vos actifs définitivement ; si vous l'exposez, n'importe qui peut vider votre [portefeuille](/fr/glossary/wallet/). La plupart des utilisateurs ne manipulent jamais directement la clé brute, la protégeant plutôt via une [phrase de récupération](/fr/glossary/seed-phrase/) — un mémo lisible par l'humain qui la régénère de façon déterministe. Son homologue, la [clé publique](/fr/glossary/public-key/), en est dérivée et peut être partagée librement sans risque.
