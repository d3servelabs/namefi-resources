---
title: Bureau d'enregistrement
date: '2025-06-30'
language: fr
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Une société accréditée par l'ICANN autorisée à enregistrer des noms de domaine au nom du public, faisant l'interface entre les titulaires et les registres.
keywords: ['bureau d''enregistrement', 'registraire de domaine', 'accréditation ICANN', 'enregistrement de domaine', 'RAA', 'EPP', 'code d''autorisation', 'verrou de transfert', 'transfert de domaine']
level: 2
sources:
  - https://www.icann.org/en/accredited-registrars
  - https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
  - https://www.iana.org/domains/root
aliasesByLocale:
  zh-CN: ['注册服务商']
  de: ['Registrierungsdienst']
relatedArticles:
  - /fr/blog/how-to-sell-a-domain-name-you-own/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/what-is-a-tld/
  - /fr/blog/the-panix-com-domain-hijack/
  - /fr/blog/what-is-udrp/
relatedTopics:
  - /fr/topics/domain-basics/
  - /fr/topics/domain-security/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-investor-field-guide/
relatedGlossary:
  - /fr/glossary/icann/
  - /fr/glossary/registry/
  - /fr/glossary/dns/
  - /fr/glossary/tld/
  - /fr/glossary/web3/
---

Un **bureau d'enregistrement** (aussi appelé registraire) est une organisation accréditée par l'[ICANN](/fr/glossary/icann/) autorisée à enregistrer des noms de domaine dans un ou plusieurs domaines de premier niveau au nom du public, gérant la relation entre les acheteurs de domaines et le [registre](/fr/glossary/registry/) qui exploite la base de données faisant autorité pour ces domaines.

## Ce que fait un bureau d'enregistrement

Un bureau d'enregistrement fait office de prestataire de services orienté public dans le système des noms de domaine. Lorsqu'une personne ou une organisation souhaite posséder un nom de domaine, elle interagit avec un bureau d'enregistrement — et non directement avec un registre ou l'[ICANN](/fr/glossary/icann/).

Les fonctions principales qu'un bureau d'enregistrement assure comprennent :

- **Recherche et enregistrement de domaine.** Le bureau d'enregistrement interroge la base de données de disponibilité du registre et, après achat, soumet une demande d'enregistrement au nom du client.
- **Gestion des renouvellements.** Les enregistrements sont loués pour une à dix années à la fois. Le bureau d'enregistrement perçoit les frais de renouvellement et ré-enregistre le nom avant son expiration.
- **Gestion du [DNS](/fr/glossary/dns/) et des [serveurs de noms](/fr/glossary/nameserver/).** Les bureaux d'enregistrement donnent aux titulaires un panneau de contrôle pour mettre à jour les serveurs de noms qui déterminent où sont hébergés les enregistrements DNS d'un domaine.
- **Maintenance des coordonnées.** Les règles de l'ICANN exigent des données de contact WHOIS précises. Les bureaux d'enregistrement collectent et (dans les limites de la confidentialité) publient ces données.
- **Fonctionnalités de sécurité du domaine.** Celles-ci comprennent le verrouillage de domaine, l'authentification à deux facteurs sur le compte du bureau d'enregistrement, la signature DNSSEC et la vérification par courriel pour les modifications sensibles.
- **Facilitation des transferts.** Lorsqu'un propriétaire de domaine change de bureau d'enregistrement, le bureau d'enregistrement actuel doit suivre la politique de transfert de l'ICANN et libérer le domaine en réponse à une demande de transfert valide.

## Bureau d'enregistrement, registre et titulaire

Le secteur des noms de domaine est organisé autour de trois rôles distincts, commençant tous par « regist- » en anglais — source de confusion fréquente.

| Rôle | Qui ils sont | Ce qu'ils contrôlent |
|---|---|---|
| **[Registre](/fr/glossary/registry/)** | L'opérateur d'un domaine de premier niveau (TLD) — par exemple, Verisign pour `.com`, DENIC pour `.de`. | La base de données faisant autorité de tous les domaines de deuxième niveau sous ce TLD ; fixe les tarifs en gros et les politiques du registre. |
| **Bureau d'enregistrement** | Un revendeur accrédité par l'ICANN autorisé à enregistrer des noms dans un ou plusieurs TLD. | La relation client, les tarifs de détail, les panneaux de contrôle, les avis de renouvellement et les mécanismes de transfert et de verrouillage. |
| **[Titulaire](/fr/glossary/registrant/)** | La personne physique, l'entreprise ou l'organisation qui achète et utilise le nom de domaine. | La configuration des serveurs de noms et des enregistrements DNS ; le droit légal de renouveler et de transférer le nom. |

Les registres et les bureaux d'enregistrement sont des entités distinctes. Un registre ne vend pas au public ; il vend un accès en gros à des bureaux d'enregistrement accrédités. Les bureaux d'enregistrement fixent ensuite leurs propres tarifs de détail et se font concurrence pour attirer les clients. Dans certains cas, une même société détient à la fois une accréditation de registre et de bureau d'enregistrement (Donuts/Identity Digital en est un exemple notable), mais les rôles restent opérationnellement et contractuellement distincts selon les règles de l'ICANN.

## L'accréditation ICANN — le RAA

Une société ne peut pas opérer comme bureau d'enregistrement simplement en créant un flux de paiement. Elle doit d'abord être accréditée par l'[ICANN](/fr/glossary/icann/) dans le cadre de l'**Accord d'accréditation des bureaux d'enregistrement (RAA)**, un contrat contraignant qui fixe les obligations minimales en matière d'exactitude des données, de traitement des litiges, de droits des titulaires, de réponse aux abus et d'entiercement financier des données clients.

Les dispositions clés du RAA comprennent :

- **Vérification des titulaires.** Les bureaux d'enregistrement doivent vérifier les données de contact et répondre aux plaintes pour inexactitude dans un délai défini.
- **Entiercement des données.** Les bureaux d'enregistrement doivent déposer les données d'enregistrement des clients auprès d'un prestataire tiers d'entiercement afin que les enregistrements survivent si le bureau d'enregistrement cesse ses activités.
- **Réponse aux abus.** Les bureaux d'enregistrement doivent maintenir un point de contact pour les abus et prendre des mesures sur les rapports d'abus documentés (spam, logiciels malveillants, hameçonnage) dans des délais définis.
- **WHOIS épais et WHOIS mince.** Certains TLD utilisent un modèle mince (données de contact chez le bureau d'enregistrement) et d'autres un modèle épais (données de contact copiées au registre). Le RAA définit quelles données doivent être publiées ou protégées par la vie privée en vertu du RGPD et de cadres similaires.

L'ICANN publie la [liste complète des bureaux d'enregistrement accrédités](https://www.icann.org/en/accredited-registrars), qui compte actuellement plus de 2 000 dans le monde, ainsi que leur statut d'accréditation et les éventuelles sanctions publiques.

## Fonctionnement des enregistrements et des transferts

### Enregistrement via EPP

Les bureaux d'enregistrement se connectent aux registres via le **Protocole de provisionnement extensible ([EPP](/fr/glossary/epp/))**, un protocole standardisé basé sur XML défini dans les RFC 5730–5734. Lorsqu'un titulaire finalise un achat, le système du bureau d'enregistrement envoie une commande EPP `create` au registre, qui consigne l'enregistrement et retourne un **identifiant d'objet de registre (ROID)** unique. Le registre publie ensuite la délégation du [serveur de noms](/fr/glossary/nameserver/) dans la zone racine DNS afin que le domaine se résolve.

### Verrous de transfert et codes d'autorisation

Les transferts de domaines entre bureaux d'enregistrement sont régis par la [Politique de transfert inter-registraires de l'ICANN](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en). Deux mécanismes protègent contre les transferts non autorisés :

- **[Verrou de transfert](/fr/glossary/transfer-lock/) (verrou registraire / statut EPP `clientTransferProhibited`).** Lorsqu'il est activé, le registre rejettera toute demande de transfert pour ce domaine. Les bureaux d'enregistrement activent ce verrou par défaut comme mesure de sécurité. Le titulaire doit explicitement déverrouiller le domaine avant d'initier un transfert.
- **[Code d'autorisation](/fr/glossary/auth-code/) (aussi appelé code auth-info EPP ou code d'autorisation de transfert).** Un mot de passe à usage unique généré par le bureau d'enregistrement. Le bureau d'enregistrement gagnant (receveur) soumet ce code au registre pour prouver que le titulaire a autorisé le transfert. Sans lui, le registre rejette la demande.

Un flux de transfert sortant standard :

1. Le titulaire demande le code d'autorisation au bureau d'enregistrement actuel.
2. Le titulaire déverrouille le domaine (désactive `clientTransferProhibited`).
3. Le titulaire saisit le code d'autorisation auprès du bureau d'enregistrement gagnant.
4. Le bureau d'enregistrement gagnant soumet une commande EPP `transfer` au registre.
5. Le registre notifie le bureau d'enregistrement perdant, qui dispose de cinq jours pour rejeter ou approuver explicitement la demande ; le silence vaut approbation.
6. Le transfert est effectué ; le bureau d'enregistrement gagnant détient l'enregistrement pour la durée restante de la période, augmentée d'un an.

Les règles de l'ICANN interdisent aux bureaux d'enregistrement de facturer des frais de transfert sortant, même si certains tentent de le faire pour certains TLD.

### La règle du verrouillage de 60 jours

La politique de l'ICANN verrouille un domaine auprès de son bureau d'enregistrement actuel pendant 60 jours après l'enregistrement initial et pendant 60 jours après un transfert de bureau d'enregistrement à bureau d'enregistrement. Cela prévient les scénarios d'abus où un domaine serait transféré entre bureaux d'enregistrement pour obscurcir la propriété. Le compteur de 60 jours se réinitialise à chaque transfert.

## Revendeurs

De nombreux noms de domaine sont vendus non pas directement par des bureaux d'enregistrement accrédités, mais par des **[revendeurs](/fr/glossary/reseller/)** — des sociétés qui utilisent l'infrastructure du bureau d'enregistrement sous leur propre marque en marque blanche. Les revendeurs ne détiennent pas leur propre accréditation ICANN ; ils opèrent sous l'accréditation de leur bureau d'enregistrement en amont. Pour le [titulaire](/fr/glossary/registrant/), les implications pratiques sont :

- Le bureau d'enregistrement en amont détient la connexion EPP au registre, de sorte que c'est le nom du bureau d'enregistrement qui apparaîtra dans le WHOIS, pas celui du revendeur.
- Les litiges et les droits d'entiercement relèvent du RAA en amont.
- Si le revendeur cesse ses activités, les enregistrements restent valides sous l'entiercement du bureau d'enregistrement en amont.

Les accords de revendeur sont courants : de nombreuses sociétés d'hébergement web, constructeurs de sites web et opérateurs de télécommunications vendent des domaines en tant que services complémentaires via ce modèle.

## Choisir un bureau d'enregistrement

Aucun bureau d'enregistrement ne convient à tous les cas d'usage. Facteurs neutres à comparer :

- **Tarification.** Les prix d'enregistrement sont fixés par le registre (en gros) mais majorés différemment par chaque bureau d'enregistrement. Comparez le tarif promotionnel de la première année avec les tarifs de renouvellement pluriannuels — l'écart est souvent important. Vérifiez également les tarifs de transfert entrant.
- **Protection de la vie privée.** La plupart des bureaux d'enregistrement incluent la confidentialité WHOIS (données de contact mandataires) sans supplément conformément aux directives ICANN sur le RGPD, mais certains la facturent encore. Confirmez le paramètre par défaut.
- **Fonctionnalités de sécurité.** Cherchez l'authentification à deux facteurs sur le compte, la disponibilité du verrou de registre pour les domaines à forte valeur, la prise en charge du DNSSEC et les courriels de confirmation des modifications de compte.
- **Hébergement DNS.** Certains bureaux d'enregistrement proposent leur propre hébergement DNS ; d'autres sont indifférents aux serveurs de noms. Évaluez si le DNS inclus répond à vos besoins ou si vous préférez vous connecter à un fournisseur séparé (Cloudflare, AWS Route 53, etc.).
- **Qualité du support.** Les délais de réponse et les options de canal (chat, téléphone, ticket) varient considérablement. Pour les domaines critiques pour l'activité, un support en direct 24h/24 et 7j/7 est important.
- **Périmètre d'accréditation.** Tous les bureaux d'enregistrement ne sont pas accrédités pour tous les TLD. Confirmez que le bureau d'enregistrement prend en charge le ou les TLD spécifiques dont vous avez besoin, en particulier pour les TLD de codes de pays (ccTLD) qui peuvent imposer des règles de présence locale.

Parmi les exemples connus de bureaux d'enregistrement accrédités, on peut citer GoDaddy, Namecheap, Cloudflare Registrar, Google Domains (désormais Squarespace Domains) et Gandi — mentionnés ici à titre illustratif et factuel, sans aucune recommandation. Chacun a des structures tarifaires, des ensembles de fonctionnalités et des interfaces utilisateur différents qui conviennent à différents besoins des titulaires.

## Bureaux d'enregistrement et domaines tokenisés

L'enregistrement [DNS](/fr/glossary/dns/) conventionnel place le contrôle du domaine entre les mains du bureau d'enregistrement : l'accès au compte, le mode de paiement et les politiques propres au bureau d'enregistrement déterminent qui peut renouveler, transférer ou configurer un nom. La propriété est effectivement liée au compte du bureau d'enregistrement.

Certains systèmes de nommage fondés sur la blockchain — comme l'Ethereum Name Service (ENS) pour les noms `.eth` — opèrent entièrement en dehors de la hiérarchie DNS traditionnelle et du cadre d'accréditation de l'ICANN. Dans ces systèmes, la propriété est encodée dans un contrat intelligent et contrôlée par une clé privée cryptographique plutôt que par un compte de bureau d'enregistrement. De tels noms n'apparaissent pas dans la zone racine de l'[IANA](/fr/glossary/nameserver/) et ne sont pas résolvables dans le DNS standard sans extensions de navigateur ou prise en charge au niveau du résolveur.

Un petit nombre de projets explorent des modèles hybrides, où des noms de domaine ICANN conventionnellement délégués sont liés à des enregistrements de propriété on-chain, mais à partir de 2025, ces projets restent hors du courant dominant du DNS et n'affectent pas le rôle formel du bureau d'enregistrement dans le cadre du RAA. Pour tout domaine qui se résout dans le DNS standard, un bureau d'enregistrement accrédité par l'ICANN demeure l'intermédiaire obligatoire entre le titulaire et le registre.
