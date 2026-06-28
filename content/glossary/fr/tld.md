---
title: TLD
date: '2026-05-22'
language: fr
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: Un TLD, ou domaine de premier niveau, est l''étiquette la plus à droite d''un nom de domaine, comme .com, .org ou .de, délégué via la zone racine IANA sous supervision ICANN.
keywords: ['TLD', 'domaine de premier niveau', 'gTLD', 'ccTLD', 'nouveau gTLD', 'DNS', 'IANA', 'ICANN', 'zone racine', 'registre de domaine']
also_known_as: ['Domaine de premier niveau']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /fr/blog/what-is-a-tld/
  - /fr/blog/top-tlds-to-secure-for-your-startup/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/how-tld-affects-domain-value/
  - /fr/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /fr/topics/choosing-a-tld/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/best-tlds-by-industry/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/icann/
  - /fr/glossary/registry/
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/web3/
---

**TLD** (*domaine de premier niveau*), aussi appelé **Domaine de premier niveau**, est l'étiquette la plus à droite dans un nom de domaine pleinement qualifié — le segment qui suit le dernier point. Dans `www.example.com`, le TLD est `.com` ; dans `bbc.co.uk`, c'est `.uk`. Les TLD se situent au sommet de la hiérarchie du [DNS](/fr/glossary/dns/) et constituent le fondement sur lequel tout autre nom de domaine est construit.

## La place du TLD dans un nom de domaine

Le [DNS](/fr/glossary/dns/) est un système de nommage hiérarchique en arborescence. Lire un nom de domaine de droite à gauche révèle cette hiérarchie :

1. **Racine (`.`)** — Le point invisible tout à droite. La [zone racine](/fr/glossary/root-zone/) est le point de départ faisant autorité : un petit ensemble de serveurs maintenu par l'[IANA](/fr/glossary/iana/) qui connaît les serveurs de noms faisant autorité pour chaque TLD.
2. **TLD** — La première étiquette visible en partant de la droite (`.com`, `.org`, `.de`). Chaque TLD possède ses propres serveurs de noms faisant autorité, gérés par un opérateur de [registre](/fr/glossary/registry/).
3. **[Domaine de deuxième niveau](/fr/glossary/second-level-domain/)** — L'étiquette immédiatement à gauche du TLD (par exemple, `example` dans `example.com`). C'est ce que les titulaires achètent auprès d'un registraire.
4. **Sous-domaine** — Toute autre étiquette à gauche (`www`, `mail`, `blog`), gérée par celui qui contrôle le domaine de deuxième niveau.

Lorsqu'un résolveur effectue une recherche pour `www.example.com`, il demande d'abord à un serveur racine où se trouve `.com`, puis demande aux serveurs de noms du registre `.com` où se trouve `example.com`, puis demande aux serveurs de noms de `example.com` l'enregistrement `www`. Cette chaîne de délégation garantit qu'aucun serveur unique n'a besoin de connaître tous les noms de domaine.

## Types de TLD

L'IANA regroupe les TLD en plusieurs catégories :

| Catégorie | Exemples | Remarques |
|---|---|---|
| **[gTLD](/fr/glossary/gtld/)** (générique) | `.com`, `.net`, `.org`, `.info` | Initialement non restreints ou à large portée ; la classe la plus utilisée |
| **[ccTLD](/fr/glossary/cctld/)** (code de pays) | `.de`, `.uk`, `.jp`, `.us` | Codes à deux lettres attribués selon ISO 3166-1 ; souvent régis par une autorité nationale |
| **sTLD** (sponsorisé) | `.gov`, `.edu`, `.mil`, `.museum` | Un sous-type de gTLD avec une organisation sponsor qui restreint l'éligibilité |
| **[Nouveau gTLD](/fr/glossary/new-gtld/)** | `.app`, `.blog`, `.shop`, `.xyz` | Introduit à partir de 2013 via le programme d'expansion de l'ICANN |
| **Infrastructure** | `.arpa` | Réservé à l'infrastructure DNS technique ; non ouvert à l'enregistrement |
| **Test / Réservé** | `.example`, `.localhost`, `.invalid` | Défini dans la RFC 2606 ; jamais délégué dans la racine publique |

`.arpa` est le seul TLD d'infrastructure actuel. Il héberge les zones de recherche inversée (`in-addr.arpa` pour IPv4, `ip6.arpa` pour IPv6) qui associent les adresses IP aux noms d'hôtes.

Les ccTLD étaient initialement destinés aux titulaires résidant dans le pays concerné, mais beaucoup ont été libéralisés pour un enregistrement mondial — `.io` (Territoire britannique de l'océan Indien) et `.co` (Colombie) sont des exemples notables utilisés à l'international comme alternatives génériques.

## Comment les TLD sont créés et délégués

La liste faisant autorité de tous les TLD délégués est maintenue dans la **base de données de la zone racine IANA** ([iana.org/domains/root/db](https://www.iana.org/domains/root/db)), qui associe chaque TLD à son ensemble de serveurs de noms faisant autorité et à son opérateur de [registre](/fr/glossary/registry/) désigné.

**La délégation des ccTLD** suit la politique énoncée dans la [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591) (Postel, 1994) : les codes à deux lettres sont dérivés d'ISO 3166-1, et chacun est délégué à un mandataire — généralement un organisme gouvernemental ou un organisme reconnu nationalement — qui est censé servir l'intérêt public de ce pays ou territoire. L'[IANA](/fr/glossary/iana/) examine les demandes de redélégation lorsque la gouvernance d'un ccTLD change de mains.

**Les nouveaux gTLD** sont créés par le biais des tours de candidature de l'[ICANN](/fr/glossary/icann/). La première grande expansion a commencé en 2012, lorsque l'ICANN a ouvert les candidatures pour toute chaîne de trois caractères ou plus en tant que TLD générique. Les candidats paient des frais de base, font l'objet d'une évaluation de leurs capacités techniques et de leur stabilité financière, passent un processus d'opposition (couvrant les motifs communautaires, moraux, de propriété intellectuelle et de confusion de chaînes), et signent un accord de registre avec l'ICANN ([Programme ICANN de nouveaux gTLD](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)). Plus de 1 200 nouveaux gTLD ont été délégués dans ce tour. Un deuxième tour de candidature a ouvert en 2026, élargissant encore l'espace de noms.

Une fois délégué, l'opérateur de [registre](/fr/glossary/registry/) d'un TLD maintient la base de données faisant autorité de tous les domaines de deuxième niveau enregistrés sous celui-ci, gère les serveurs de noms de la zone, et fixe les politiques (tarification, éligibilité, règles de longueur) que les registraires doivent suivre lors de la vente de noms aux titulaires.

## Exemples et TLD notables

| TLD | Opérateur | Remarques |
|---|---|---|
| `.com` | Verisign | Plus grand TLD par volume d'enregistrement ; initialement pour les entités commerciales |
| `.net` | Verisign | Initialement pour les fournisseurs d'infrastructure réseau ; désormais non restreint |
| `.org` | Public Interest Registry | Initialement pour les organisations à but non lucratif ; désormais largement non restreint |
| `.gov` | GSA (États-Unis) | Réservé aux entités gouvernementales fédérales, étatiques et locales américaines |
| `.edu` | Educause | Réservé aux établissements d'enseignement supérieur accrédités aux États-Unis |
| `.uk` | Nominet | ccTLD britannique ; les enregistrements courants utilisent des étiquettes de deuxième niveau comme `.co.uk` |
| `.de` | DENIC | ccTLD allemand ; l'un des ccTLD les plus importants par volume |
| `.io` | ICANN / transition de registre en cours | Code du Territoire britannique de l'océan Indien ; largement adopté par les entreprises technologiques |
| `.app` | Google Registry | Nouveau gTLD ; HTTPS requis par la politique du registre |
| `.xyz` | XYZ.com LLC | Nouveau gTLD ; volume d'enregistrement important grâce à une tarification basse |

## TLD, valeur et SEO

Les moteurs de recherche traitent les TLD de deux manières distinctes :

**Ciblage géographique :** Un [ccTLD](/fr/glossary/cctld/) envoie un signal géographique. Google Search Central note qu'un site en `.de` est généralement interprété comme ciblant les utilisateurs germanophones, et Google Search Console permet un ciblage géographique explicite pour les TLD génériques mais applique automatiquement les signaux ccTLD. Si une entreprise souhaite servir un public mondial depuis un seul domaine, un TLD générique évite une restriction géographique involontaire.

**Classement :** Pour la plupart des usages, le TLD lui-même n'est pas un facteur de classement. Google a déclaré qu'il [traite les nouveaux gTLD comme tout autre TLD](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains) et qu'un `.com` ne surclasse pas intrinsèquement un `.app` ou un `.xyz`. Ce qui compte, c'est l'autorité et la pertinence globales du domaine, et non l'extension seule. Certains anciens TLD riches en mots-clés (comme `.jobs` ou `.travel`) portent des signaux de contexte implicites, mais ceux-ci sont mineurs par rapport à la qualité du contenu et au profil de backlinks.

**Perception de la marque et mémorabilité :** Les investisseurs en domaines et les spécialistes du marketing observent que les TLD courts établis — notamment `.com` — bénéficient d'une forte reconnaissance auprès des utilisateurs finaux, ce qui peut affecter les taux de clics dans les résultats de recherche, la navigation directe et la confiance. Il s'agit d'une dynamique de marché et comportementale plutôt qu'algorithmique.

**Tarification premium et de revente :** La valeur perçue d'un TLD affecte les prix sur le marché secondaire pour les [noms de domaine de deuxième niveau](/fr/glossary/second-level-domain/) qu'il abrite. Les noms en `.com` atteignent en moyenne des prix de revente plus élevés que des noms équivalents sous de nouvelles extensions, reflétant la familiarité des consommateurs plutôt que tout avantage technique.

## TLD et domaines tokenisés

Plusieurs systèmes de nommage basés sur la blockchain opèrent en dehors de la zone racine IANA, introduisant effectivement des TLD alternatifs qui ne se résolvent que dans des résolveurs compatibles ou des extensions de navigateur. Les exemples incluent `.eth` (Ethereum Name Service), `.crypto` et `.nft`. Ceux-ci ne sont pas délégués via l'[IANA](/fr/glossary/iana/) et ne se résolvent pas dans le DNS mondial par défaut, bien que des passerelles et des services de pont puissent fournir une interopérabilité partielle.

Au sein de l'espace de noms administré par l'IANA, la tokenisation des [noms de domaine de deuxième niveau](/fr/glossary/second-level-domain/) (représenter la propriété d'un nom comme `example.com` sous forme de jeton blockchain) est un concept distinct du TLD lui-même ; le TLD reste soumis à la même gouvernance de registre quelle que soit la façon dont la propriété des noms individuels sous celui-ci est enregistrée.
