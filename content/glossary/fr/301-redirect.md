---
title: Redirection 301
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un statut HTTP indiquant aux navigateurs et aux moteurs de recherche qu'une page a définitivement changé d'URL.
keywords: ['redirection 301', 'redirection permanente', 'redirection http', 'seo', 'transfert de domaine', 'équité de lien']
also_known_as: ['Redirection permanente']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

Une **redirection 301** (aussi appelée *redirection permanente*) est un code de réponse HTTP qui signale aux navigateurs et aux moteurs de recherche qu'une ressource a définitivement déménagé vers une nouvelle URL, et que toutes les futures requêtes doivent aller vers la nouvelle destination. Le « 301 » la distingue d'une redirection temporaire 302 : avec un 301, Google consolide les signaux de classement — notamment l'équité de lien et le [texte d'ancre](/fr/glossary/anchor-text/) — de l'ancienne URL vers la nouvelle, ce qui en fait le mécanisme standard pour le [transfert de domaine](/fr/glossary/domain-forwarding/) sans sacrifier la valeur [SEO](/fr/glossary/seo/). En pratique, cela signifie qu'un investisseur en domaines peut acquérir un domaine ancien avec une forte [autorité de domaine](/fr/glossary/domain-authority/) et le pointer vers un site cible, en transmettant une grande partie de cette équité de lien accumulée vers la destination. Le transfert n'est pas immédiat — Google consolide généralement les signaux sur une période de quelques semaines — et n'est pas toujours à 100 %, de sorte que les redirections 301 sont précieuses mais ne constituent pas une greffe d'équité parfaite.
