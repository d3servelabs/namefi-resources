---
title: Registre
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: L''organisation qui exploite la base de données principale et les serveurs de noms d''un TLD, déléguant la vente au détail aux registraires.
keywords: ['registre', 'opérateur de registre', 'registre TLD', 'registre de domaine', 'ICANN', 'registraire', 'EPP', 'registre gTLD', 'registre ccTLD', 'système de registre partagé']
also_known_as: ['Opérateur de registre']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
relatedArticles:
  - /fr/blog/what-is-a-tld/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/top-tlds-to-secure-for-your-business/
  - /fr/blog/how-tld-affects-domain-value/
  - /fr/blog/top-tlds-to-secure-for-your-fashion-brand/
relatedTopics:
  - /fr/topics/choosing-a-tld/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/best-tlds-by-industry/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/dns/
  - /fr/glossary/web3/
---

Un **registre** (aussi appelé *opérateur de registre*) est l'organisation qui exploite la base de données faisant autorité pour un [TLD](/fr/glossary/tld/) — enregistrant chaque domaine inscrit sous cette extension, maintenant le fichier de zone qui associe ces noms aux [serveurs de noms](/fr/glossary/nameserver/), et publiant les données qui permettent aux requêtes à travers le [DNS](/fr/glossary/dns/) de fonctionner. Les registres se situent au sommet de la chaîne d'approvisionnement des noms de domaine, au-dessus des [registraires](/fr/glossary/registrar/) et des [titulaires](/fr/glossary/registrant/).

## Ce que fait un registre

La fonction principale d'un registre est de maintenir la **base de données faisant autorité** — souvent appelée *base de données de registre* ou *système de registre partagé* — pour chaque domaine sous son TLD. Lorsqu'un domaine est créé, renouvelé, transféré ou supprimé, le registre enregistre le changement. Le registre publie également le **fichier de zone du TLD** : l'ensemble des délégations aux [serveurs de noms](/fr/glossary/nameserver/) qui indiquent au [DNS](/fr/glossary/dns/) mondial où envoyer les requêtes pour les noms sous ce TLD.

En plus de la gestion de la base de données, la plupart des registres exploitent ou contractent les **serveurs de noms faisant autorité** pour leur TLD (souvent appelés serveurs de noms du TLD). Ces serveurs répondent aux requêtes des résolveurs demandant, par exemple, « quels serveurs de noms font autorité pour `example.com` ? » et renvoient la réponse depuis le fichier de zone du registre.

Au-delà des obligations techniques, les registres :

- Fixent la **tarification en gros** — le prix que les [registraires](/fr/glossary/registrar/) paient par domaine, par an.
- Rédigent et appliquent des **politiques d'enregistrement** — conditions d'éligibilité, règles d'utilisation acceptable, et périodes sunrise/protection des marques pour les nouvelles extensions.
- Exploitent des services de consultation **WHOIS / RDAP** exposant les données d'enregistrement au public.
- Coordonnent avec l'[ICANN](/fr/glossary/icann/) dans le cadre d'un accord de registre qui définit les obligations et les normes de performance ([Accords de registre ICANN](https://www.icann.org/en/registry-agreements)).

## Registre, registraire et titulaire

Le secteur des noms de domaine est organisé autour d'un modèle à trois niveaux établi par l'[ICANN](/fr/glossary/icann/) :

| Niveau | Rôle | Exemples |
|--------|------|---------|
| **Registre** | Exploite la base de données du TLD ; fixe le prix de gros ; aucune vente directe aux consommateurs | Verisign (.com, .net), PIR (.org), DENIC (.de) |
| **[Registraire](/fr/glossary/registrar/)** | Revendeur accrédité ; vend des domaines au public ; interface avec le registre via EPP | GoDaddy, Namecheap, Google Domains |
| **[Titulaire](/fr/glossary/registrant/)** | La personne ou organisation qui enregistre un nom de domaine | Toute entreprise ou particulier qui achète un domaine |

Les registres et les registraires sont tous deux accrédités par l'[ICANN](/fr/glossary/icann/), mais ils exercent des rôles distincts. Un registre ne peut pas également agir en tant que registraire au détail pour ses propres TLD selon les règles de séparation verticale de l'ICANN (avec des exceptions limitées). Cette séparation est intentionnelle : elle empêche un registre de s'accorder une tarification préférentielle ou un accès préférentiel aux noms désirables avant le public.

## Comment fonctionne le modèle registre–registraire

Le pont technique entre registre et registraire est l'**[Extensible Provisioning Protocol (EPP)](/fr/glossary/epp/)**, un protocole basé sur XML défini dans la [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730). Les registraires se connectent au serveur EPP du registre pour effectuer des opérations sur le cycle de vie des domaines : `check` (un nom est-il disponible ?), `create`, `renew`, `transfer`, `update` et `delete`.

Dans ce modèle :

1. Un registraire conclut un **accord d'accréditation de registraire (RAA)** avec l'[ICANN](/fr/glossary/icann/) et un **accord registre–registraire** distinct avec chaque registre dont il souhaite vendre les TLD.
2. Le registre facture au registraire un **tarif en gros** (par exemple, Verisign facture aux registraires accrédités environ 10,26 $/an pour un `.com` en 2024).
3. Le registraire ajoute sa marge et vend à un **prix de détail** au [titulaire](/fr/glossary/registrant/).
4. Le registraire soumet des commandes [EPP](/fr/glossary/epp/) au registre, qui met à jour la base de données faisant autorité et le fichier de zone — rendant le domaine actif sur le DNS en quelques minutes.

Cette architecture, parfois appelée **système de registre partagé (SRS)**, signifie qu'un seul registre peut prendre en charge des centaines de registraires concurrents simultanément, tous écrivant dans la même base de données faisant autorité via des transactions [EPP](/fr/glossary/epp/) standardisées. La concurrence au niveau des registraires maintient les prix de détail bas sans donner à un seul revendeur un monopole sur l'accès au TLD.

## Exemples

**Registres de TLD génériques**

- **Verisign** exploite `.com` et `.net`, les deux [gTLD](/fr/glossary/gtld/) les plus grands par volume d'enregistrement. Son accord de registre avec l'[ICANN](/fr/glossary/icann/) est disponible publiquement et largement cité comme modèle de référence ([entrée de la base de données racine IANA pour .com](https://www.iana.org/domains/root/db/com.html)).
- **Public Interest Registry (PIR)** exploite `.org`, initialement établi comme registre à but non lucratif pour les organisations non commerciales.
- **Identity Digital** (anciennement Donuts et Afilias) est l'un des plus grands opérateurs de [nouveaux gTLD](/fr/glossary/new-gtld/) délégués, gérant des centaines d'extensions telles que `.blog`, `.online`, `.store` et `.news`.

**Registres de TLD de code de pays**

Les registres de [ccTLD](/fr/glossary/cctld/) opèrent sous autorité nationale ou territoriale plutôt que sous les accords [gTLD](/fr/glossary/gtld/) de l'[ICANN](/fr/glossary/icann/), bien que beaucoup interagissent encore avec les registraires via [EPP](/fr/glossary/epp/) :

- **Nominet** (.uk) — le registre du Royaume-Uni, une organisation à but non lucratif fondée en 1996.
- **DENIC** (.de) — le registre coopératif de l'Allemagne, géré par une organisation membre de registraires.
- **AFNIC** (.fr) — le registre de la France, exploité sous délégation du gouvernement français.
- **VeriSign** / **CNNIC** (.cn) — le registre de code de pays de la Chine, exploité par le China Internet Network Information Center.

Les registres ccTLD sont répertoriés dans la base de données racine de l'IANA sur [iana.org/domains/root/db](https://www.iana.org/domains/root/db), qui constitue l'inventaire faisant autorité de toutes les délégations TLD dans le monde.

## Nouveaux registres gTLD

Avant 2012, l'ensemble des TLD génériques était restreint et stable — `.com`, `.net`, `.org`, `.info`, `.biz`, et quelques autres. Le **Programme de nouveaux gTLD** de l'ICANN, lancé en 2012, a ouvert les candidatures pour presque toutes les chaînes de caractères en tant que [nouveau gTLD](/fr/glossary/new-gtld/). Plus de 1 200 nouvelles extensions ont finalement été déléguées.

Les registres de [nouveaux gTLD](/fr/glossary/gtld/) opèrent sous un **accord de registre** avec l'[ICANN](/fr/glossary/icann/) qui impose des exigences techniques (support EPP, DNSSEC, RDAP), des normes de performance (disponibilité du système, temps de réponse aux requêtes), et des obligations politiques (atténuation des abus, mécanismes de protection des marques tels que la période sunrise de la Trademark Clearinghouse et le système de suspension rapide uniforme).

L'ICANN maintient la liste complète des accords de registre pour les nouveaux gTLD sur [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements).

## Registres et domaines tokenisés

Un petit nombre d'espaces de noms de domaines alternatifs — notamment Unstoppable Domains et ENS (Ethereum Name Service) — émettent des noms semblables à des domaines ancrés sur des blockchains publiques plutôt que dans une zone DNS coordonnée par l'ICANN. Dans ces systèmes, la propriété est enregistrée dans un contrat intelligent plutôt que dans une base de données de registre, et la résolution nécessite une extension de navigateur ou un résolveur compatible plutôt que le chemin de recherche DNS standard.

Ces espaces de noms basés sur la blockchain ne sont pas délégués dans la racine IANA et ne sont pas visibles par les résolveurs DNS ordinaires par défaut. Ils fonctionnent indépendamment du système de registre ICANN décrit ci-dessus.
