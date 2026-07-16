---
title: Détournement BGP
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Réacheminer le trafic internet en annonçant faussement des routes IP, une attaque de couche réseau qui se situe sous le DNS.
keywords: ['détournement BGP', 'détournement de route', 'préfixe IP', 'sécurité réseau', 'routage internet']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-sea-turtle-dns-espionage/
  - /fr/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/dns-hijacking/
  - /fr/glossary/icann/
  - /fr/glossary/public-key/
  - /fr/glossary/web3/
---

Le **détournement BGP** (détournement du Border Gateway Protocol) est une attaque de couche réseau dans laquelle un système autonome malveillant ou mal configuré diffuse de fausses annonces de routage, convainquant d'autres routeurs sur internet d'envoyer le trafic destiné à une [adresse IP](/fr/glossary/ip-address/) légitime via l'infrastructure de l'attaquant. Contrairement au [détournement DNS](/fr/glossary/dns-hijacking/) — qui corrompt les correspondances nom-vers-IP — un détournement BGP opère au niveau de la couche de routage, de sorte que les enregistrements DNS du domaine restent intacts et que DNSSEC n'offre aucune protection contre ce type d'attaque. Une fois le trafic réacheminé, les attaquants peuvent intercepter l'émission de certificats TLS (des détournements BGP ont été utilisés pour obtenir des certificats frauduleux de CA utilisant la validation de domaine basée sur HTTP), lire le trafic non chiffré ou effectuer des attaques de type « homme du milieu ». Les mesures d'atténuation comprennent la validation de l'origine de la route via RPKI (Resource Public Key Infrastructure) et des services de surveillance qui alertent lorsque des AS inattendus annoncent vos préfixes.
