---
title: Zone racine (Serveurs racine)
date: '2026-06-22'
language: fr
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Le sommet de la hiérarchie DNS, répertoriant chaque TLD et les serveurs faisant autorité pour celui-ci.
keywords: ['zone racine', 'serveurs racine', 'hiérarchie DNS', 'délégation TLD', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /fr/blog/what-is-a-tld/
  - /fr/blog/premium-web3-tlds/
  - /fr/blog/the-malaysia-airlines-dns-hijack/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /fr/topics/choosing-a-tld/
  - /fr/topics/domain-security/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/tld/
  - /fr/glossary/dns/
  - /fr/glossary/registry/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
---

La **zone racine** est le sommet absolu de la hiérarchie [DNS](/fr/glossary/dns/) — la liste maîtresse de chaque [TLD (domaine de premier niveau)](/fr/glossary/tld/) et des serveurs du [Registre (Opérateur de registre)](/fr/glossary/registry/) qui font autorité pour celui-ci. Elle est servie par les **serveurs racine**, un ensemble de systèmes mondialement distribués accessibles à treize adresses nommées, et le contenu de la zone est maintenu par l'[IANA](/fr/glossary/iana/). Chaque résolution de domaine qui n'est pas déjà en cache commence ici : un [résolveur](/fr/glossary/dns-resolver/) interroge la zone racine pour savoir où trouver `.com`, puis suit la chaîne vers le bas. La zone racine est l'ancre de nommage d'Internet — et elle n'est pas touchée par la tokenisation, qui ajoute une couche de propriété contrôlée par un [Portefeuille](/fr/glossary/wallet/) au-dessus du DNS existant plutôt que de remplacer la racine. *Sources : Zone racine de l'IANA ; Serveurs racine de l'IANA.*
