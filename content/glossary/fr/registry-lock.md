---
title: Verrou de Registre
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un service haute sécurité où le registre gèle un domaine de sorte que toute modification nécessite une approbation manuelle hors bande.
keywords: ['verrou de registre', 'verrouillage de domaine', 'verrou haute sécurité', 'prévention du détournement de domaine', 'vérification hors bande']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /fr/blog/the-syrian-electronic-army-nyt-hijack/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-sea-turtle-dns-espionage/
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/dns/
  - /fr/glossary/domain-hijacking/
  - /fr/glossary/transfer-lock/
---

Le **verrou de registre** est un service de sécurité premium proposé par un [registre](/fr/glossary/registry/) qui place un domaine dans un état où aucune modification — y compris les changements de serveurs de noms, les transferts ou les suppressions — ne peut être traitée via le canal EPP automatisé habituel. Toute modification nécessite à la place un processus de vérification manuel hors bande impliquant des appels téléphoniques, des jetons cryptographiques ou des vérifications d'identité en personne entre le bureau d'enregistrement et le registre. Cela le distingue du plus courant [verrou de transfert](/fr/glossary/transfer-lock/), que le [bureau d'enregistrement](/fr/glossary/registrar/) contrôle et peut basculer via ses propres systèmes ; le verrou de registre élève la protection au niveau du registre, rendant les modifications non autorisées extrêmement difficiles même si un attaquant obtient un accès complet au compte du bureau d'enregistrement. Il est le plus souvent utilisé par les institutions financières, les grandes marques et les opérateurs d'infrastructures critiques pour protéger leurs domaines à haute valeur contre le [détournement de domaine](/fr/glossary/domain-hijacking/).
