---
title: "Que sont les domaines tokenisés ? Un guide sur la tokenisation de domaine"
date: '2026-05-22'
language: fr
tags: ['faq']
authors: ['namefiteam']
draft: false
description: "Une introduction simple aux domaines tokenisés et à la tokenisation de domaine : ce que signifie tokeniser un domaine, comment cela fonctionne, et en quoi un domaine tokenisé diffère des domaines traditionnels et des noms exclusivement blockchain comme ENS."
keywords: ['domaine tokenisé', 'domaines tokenisés', 'tokeniser un domaine', 'tokeniser des domaines', 'tokeniser domaine', 'tokenisation d\'un domaine', 'tokenisation de domaines', 'tokenisation de domaine', 'tokenisation de nom de domaine', 'comment tokeniser un domaine', 'qu\'est-ce qu\'un domaine tokenisé', 'que sont les domaines tokenisés', 'domaines NFT', 'domaine NFT', 'domaines on-chain', 'domaine on-chain', 'domaines blockchain', 'domaine blockchain', 'DNS', 'domaines ICANN', 'domaines web3', 'domaine web3', 'NFT de domaine', 'domaine en tant que NFT', 'namefi', 'propriété de domaine', 'tokenisation d\'actif de domaine', 'Namefi', 'D3', 'D3 Global Inc', 'D3 Inc', 'Doma', 'Doma Protocol', 'Domora', 'WebUnited', 'GBM', 'GBM Auctions', 'ENS', 'Ethereum Name Service', 'Unstoppable Domains', 'Freename', 'GoDaddy', 'Identity Digital', 'Namefi vs ENS', 'Namefi vs Unstoppable Domains', 'Namefi vs D3', 'domaine tokenisé vs ENS', 'domaine tokenisé vs domaine web3', 'domaine ICANN vs domaine web3', 'comparer les plateformes de domaines tokenisés']
---

Vous avez peut-être entendu des expressions comme « domaine tokenisé », « tokeniser un domaine » ou « tokenisation de domaine » et vous vous êtes demandé ce qu'elles signifient réellement. Un domaine tokenisé est-il un nouveau type de domaine ? Un nom exclusivement sur la blockchain ? Un remplaçant pour le `.com` ? Et que signifie *tokeniser* un domaine en premier lieu ?

Cet article répond directement à la question du **« quoi »** : ce qu'*est* un domaine tokenisé, ce que *signifie* la tokenisation de domaine, ce que *n'est pas* la tokenisation d'un domaine, et comment ce concept se rattache aux noms de domaine que vous connaissez déjà.

> Si vous voulez comprendre *pourquoi* la tokenisation de domaine est importante, consultez [Pourquoi tokeniser des domaines on-chain ?](/en/blog/why-tokenize-domains/). Cet article se concentre sur le *quoi*.

---

## La définition courte

Un **domaine tokenisé** est un [nom de domaine](/en/blog/what-is-domain/) classique reconnu par l'[ICANN](/en/glossary/icann/) (comme `mamarque.xyz` ou `example.com`) dont la propriété est également représentée par un **token sur une blockchain** — généralement un [NFT](/en/glossary/nft/). Le processus de création de cette représentation adossée à un token est appelé **tokenisation de domaine**, et c'est cet acte que les gens désignent lorsqu'ils parlent de *tokeniser un domaine* ou de *tokeniser des domaines*.

En d'autres termes :

> Un domaine tokenisé est un domaine unique doté de **deux couches de propriété synchronisées** : l'enregistrement traditionnel au registre [DNS](/en/glossary/dns/), *et* un token on-chain qui le reflète. **Tokeniser un domaine** consiste à ajouter cette deuxième couche on-chain à un nom de domaine existant ou nouvellement enregistré.

Lorsque vous transférez le token, le domaine sous-jacent suit. Lorsque le domaine expire ou est renouvelé, le token reflète cet état.

---

## Deux couches, un domaine

Il est utile d'imaginer un domaine tokenisé comme ayant deux enregistrements synchronisés :

| Couche | Ce que c'est | Qui la maintient |
|------------------|-----------------------------------------------------|-------------------------------------------|
| DNS / Registre | L'enregistrement officiel chez le [bureau d'enregistrement](/en/glossary/registrar/) et le registre | [Bureaux d'enregistrement](/en/glossary/registrar/) accrédités par l'[ICANN](/en/glossary/icann/) |
| Token on-chain | Un [NFT](/en/glossary/nft/) dans votre [portefeuille](/en/glossary/wallet/) qui représente la propriété | Un [smart contract](/en/glossary/smart-contract/) sur une blockchain publique |

Les deux couches sont maintenues synchronisées par la plateforme de tokenisation de domaine (dans le cas de Namefi, par le protocole Namefi et ses intégrations avec les bureaux d'enregistrement). Chaque fois que nous parlons de *tokeniser un domaine*, de *tokeniser des domaines* ou de *tokenisation de nom de domaine*, nous parlons d'établir et de maintenir cette relation à deux couches pour un domaine spécifique.

Cela diffère de la possession d'un domaine *uniquement* chez un bureau d'enregistrement (le modèle traditionnel) et de la possession d'un nom *uniquement* on-chain (le modèle de type ENS). Un domaine tokenisé est délibérément les deux.

---

## Ce que *ne sont pas* les domaines tokenisés

Il convient de dissiper quelques idées reçues courantes concernant la tokenisation de domaine :

### Pas un nouveau TLD

Un domaine tokenisé n'est pas un nom de type `.crypto`, `.eth` ou `.x`. Lorsque vous tokenisez un domaine via Namefi, vous utilisez les mêmes TLD que vous connaissez déjà — `.com`, `.xyz`, `.io`, `.art`, etc. — qui se résolvent dans n'importe quel navigateur, client de messagerie ou résolveur DNS au monde.

### Pas la même chose qu'ENS ou que les « noms blockchain »

Les noms [ENS](/en/glossary/ens/) (comme `vitalik.eth`) existent entièrement on-chain et ne se résolvent pas dans le DNS standard sans ponts ou résolveurs spéciaux. Les domaines tokenisés, en revanche, sont de **véritables domaines DNS** qui possèdent *également* une représentation on-chain. La tokenisation de domaine ajoute la couche on-chain à un véritable nom DNS ; elle ne remplace pas le DNS par un système de nommage parallèle.

| Fonctionnalité | Domaine traditionnel | ENS / Nom blockchain | Domaine tokenisé |
|----------------------------------|--------------------|------------------------|------------------|
| Fonctionne dans tout navigateur | Oui | Nécessite un résolveur | Oui |
| Reconnu par l'ICANN | Oui | Non | Oui |
| Détenu dans votre portefeuille | Non | Oui | Oui |
| Transférable on-chain | Non | Oui | Oui |
| Composable avec des smart contracts | Non | Oui | Oui |

### Ni incensurables ni « hors-la-loi »

Parce que l'actif sous-jacent est un véritable domaine DNS, les domaines tokenisés restent soumis au renouvellement, aux politiques de l'[ICANN](/en/glossary/icann/), aux litiges [UDRP](/en/glossary/udrp/) et à la loi en vigueur. Le token reflète la propriété ; il n'exempte pas le domaine des règles du monde réel.

---

## Comment la tokenisation d'un domaine fonctionne en pratique

Voici ce qui se passe réellement lorsque vous tokenisez un domaine (ou enregistrez un tout nouveau domaine tokenisé) sur Namefi :

1. **Enregistrement** — Un véritable domaine DNS est enregistré (ou transféré) via un [bureau d'enregistrement](/en/glossary/registrar/) accrédité.
2. **Mint (Création)** — Dans le cadre de la tokenisation du domaine, un [NFT](/en/glossary/nft/) représentant ce domaine est minté (créé) vers votre [portefeuille](/en/glossary/wallet/).
3. **Synchronisation** — La plateforme maintient la propriété au niveau du DNS alignée avec la propriété on-chain pour chaque domaine tokenisé. Si vous transférez le NFT, l'enregistrement DNS suit.
4. **Utilisation** — Vous pouvez faire pointer le domaine tokenisé vers un site web, configurer des enregistrements DNS ou utiliser le NFT dans des applications on-chain (places de marché, identité, [DeFi](/en/glossary/defi/), etc.).

L'expérience pour l'utilisateur final est la suivante : *un seul domaine, deux façons d'interagir avec lui* — le monde familier du DNS et le monde programmable on-chain qu'offre la tokenisation de domaine.

---

## Ce que vous pouvez faire avec un domaine tokenisé

Puisque les deux couches existent, vous bénéficiez de l'union de leurs capacités :

- **L'utiliser comme un domaine normal** — héberger un site web, configurer des e-mails, paramétrer des enregistrements DNS.
- **Le détenir dans votre propre portefeuille** — aucun compte hébergé n'est requis pour en être propriétaire.
- **Le transférer en quelques secondes** — envoyez le NFT à un autre portefeuille ; l'enregistrement DNS suit automatiquement.
- **Le lister sur des places de marché NFT** — OpenSea, Blur, et d'autres.
- **L'utiliser dans des smart contracts** — collatéral, [enchères](/en/glossary/auction/), [location](/en/glossary/leasing/), [propriété fractionnée](/en/glossary/fractional-ownership/), et plus encore.
- **Le lier à une identité on-chain** — connexion aux systèmes [Farcaster](/en/glossary/farcaster/), [Lens](/en/glossary/lens/) ou [DID](/en/glossary/did/).

---

## Les principales plateformes de tokenisation de domaines

La tokenisation de domaine n'est plus une simple expérimentation menée par un seul fournisseur. Plusieurs plateformes proposent désormais de tokeniser un domaine ou de travailler avec des domaines tokenisés, chacune ayant une approche légèrement différente. Voici un aperçu des noms les plus reconnus dans ce domaine.

> Les liens externes ci-dessous sont fournis à titre indicatif et ne constituent pas une approbation.

### 1. Namefi (c'est nous)

**Approche :** Tokeniser de vrais domaines ICANN (`.com`, `.xyz`, `.io`, `.art`, et bien d'autres) sous forme de NFT tout en conservant la couche DNS pleinement fonctionnelle. Les deux couches sont synchronisées via des [bureaux d'enregistrement](/en/glossary/registrar/) accrédités.

**Ce qui distingue Namefi :** Namefi a été la **première plateforme à tokeniser de véritables domaines ICANN sur le réseau principal d'Ethereum, et la première à le faire sur Base**. Parce que les domaines tokenisés par Namefi existent sur Ethereum et Base, ils s'intègrent naturellement à **la plupart des grandes places de marché NFT et protocoles de prêt** — OpenSea, Blur, NFTfi, et d'autres — grâce à l'écosystème [DeFi](/en/glossary/defi/) riche et mature d'Ethereum. D'autres plateformes ont fait des choix de blockchain réfléchis adaptés à leurs objectifs ; il se trouve qu'Ethereum et Base offrent aujourd'hui aux utilisateurs de Namefi la compatibilité native la plus large avec les outils NFT et DeFi existants.

**Idéal pour :** Les propriétaires qui souhaitent un véritable domaine résolvable dans un navigateur *et* une propriété composable, native dans un portefeuille, réunies dans un seul produit, sur la blockchain offrant le plus grand support DeFi et NFT. Visitez [namefi.io](https://namefi.io) pour commencer.

### 2. D3 Global Inc

**Approche :** Une plateforme axée sur l'intégration de TLD nouveaux et existants on-chain au niveau du registre, en partenariat avec les opérateurs de TLD et les infrastructures alignées sur l'ICANN.

**Idéal pour :** Les initiatives de tokenisation au niveau du registre et le lancement de nouveaux TLD tokenisés. Site : [d3.inc](https://d3.inc).

### 3. Doma Protocol

**Approche :** Un effort au niveau du protocole pour standardiser la manière dont les vrais domaines sont représentés et transférés on-chain à travers les bureaux d'enregistrement et les blockchains.

**Idéal pour :** Les constructeurs recherchant des abstractions au niveau du protocole pour la tokenisation de domaine. Site : [doma.xyz](https://doma.xyz).

### 4. Domora

**Approche :** Une autre plateforme émergente dans l'espace des domaines tokenisés, axée sur l'intégration de vrais noms de domaine on-chain.

**Idéal pour :** Les utilisateurs évaluant des alternatives dans la catégorie des domaines DNS tokenisés. Site : [domora.com](https://domora.com).

### 5. WebUnited

**Approche :** Un acteur explorant la représentation de domaines on-chain et les infrastructures connexes pour les vrais noms de domaine.

**Idéal pour :** Les équipes à la recherche d'options supplémentaires en matière de domaines tokenisés. Site : [webunited.com](https://webunited.com).

### 6. GBM (Global Brand Marketplace / GBM Auctions)

**Approche :** Connu pour son infrastructure d'enchères on-chain qui a été appliquée aux ventes de domaines tokenisés et d'actifs de marque.

**Idéal pour :** La découverte et la vente par enchères de domaines tokenisés et d'actifs de marque numériques connexes. Site : [gbm.auction](https://gbm.auction).

### 7. Bureaux d'enregistrement traditionnels explorant la tokenisation

Certains [bureaux d'enregistrement](/en/glossary/registrar/) et registres historiques de l'ICANN (par ex. [GoDaddy](https://www.godaddy.com), [Identity Digital](https://www.identity.digital)) ont annoncé des initiatives ou des partenariats exploratoires en matière de tokenisation. La couverture et la disponibilité varient considérablement, et la majeure partie de leur activité principale reste l'enregistrement DNS traditionnel.

---

## Une catégorie cousine : ENS, Unstoppable Domains, Freename et les domaines Web3

Une catégorie très proche des domaines tokenisés est la famille des **domaines Web3** — une catégorie initiée par d'excellents projets comme ENS, Unstoppable Domains et Freename. Nous tenons à être clairs sur cette distinction, non pas pour minimiser leur travail (ils ont énormément contribué au nommage et à l'identité on-chain), mais pour aider les lecteurs à choisir le bon outil en fonction de leurs objectifs.

Les domaines Web3 présentent une conception délibérément différente de celle des domaines ICANN tokenisés. Voici comment les appréhender :

- **Un espace de noms différent par conception.** Les domaines Web3 (`.eth`, `.crypto`, `.x`, `.nft`, et les TLD créés par les utilisateurs) existent intentionnellement en dehors de la racine de l'[ICANN](/en/glossary/icann/), ce qui leur permet d'itérer rapidement et d'expérimenter de nouveaux modèles de nommage. Le compromis est qu'ils se situent en parallèle de la hiérarchie DNS traditionnelle plutôt qu'à l'intérieur de celle-ci.
- **La résolution dans le navigateur et par e-mail nécessite des étapes supplémentaires.** Visiter un domaine Web3 dans un navigateur classique, ou lui envoyer un e-mail, nécessite généralement un résolveur, une extension ou un pont. L'écosystème de portefeuilles, dApps et navigateurs crypto-natifs qui les prennent *effectivement* en charge croît régulièrement — mais la parité avec les navigateurs standards, les serveurs de messagerie, les CDN, les outils SEO et les autorités de certification SSL/TLS est toujours en cours de réalisation.
- **Des cas d'usage véritablement novateurs et natifs pour les portefeuilles.** C'est là que les domaines Web3 excellent : remplacer de longues adresses `0x…` par des noms lisibles par des humains, simplifier les transferts de tokens, faciliter les connexions aux dApps et servir de primitives d'identité on-chain. Bon nombre de ces modèles n'existaient tout simplement pas avant ENS et ses pairs, et les domaines tokenisés s'appuient sur ces idées.
- **Un profil d'adoption différent de celui des vrais domaines DNS / ICANN.** Les vrais domaines (également appelés *domaines DNS*, *domaines ICANN* ou *vrais domaines* — ex. `.com`, `.org`, `.xyz`, `.io`) bénéficient de décennies de support universel sur l'ensemble des navigateurs, fournisseurs de messagerie, CDN et autorités de certification. Les domaines Web3 ont une portée impressionnante et croissante au sein de l'écosystème crypto-natif, tandis que l'adoption par l'Internet dans son ensemble est encore en phase de rattrapage.

Les principales plateformes de domaines Web3, avec une reconnaissance de la contribution de chacune :

- [ENS](https://ens.domains) — un système de nommage fondamental natif d'Ethereum (`.eth`) et l'une des primitives les plus importantes du Web3. ENS offre également des passerelles bien pensées vers les vrais noms DNS via [DNSSEC](/en/glossary/dnssec/).
- [Unstoppable Domains](https://unstoppabledomains.com) — un pionnier précoce et influent des noms blockchain-natifs tels que `.crypto`, `.x` et `.nft`, avec de vastes intégrations de portefeuilles et de dApps.
- [Freename](https://freename.io) — une approche inventive des TLD et espaces de noms Web3 créés par les utilisateurs.

Si votre objectif principal est l'**identité on-chain** ou le **nommage Web3**, ces plateformes sont excellentes et méritent d'être explorées. Si votre objectif principal est d'avoir un nom qui fonctionne **également** dans n'importe quel navigateur, client de messagerie, CDN et autorité de certification SSL — c'est-à-dire un véritable domaine ICANN que vous pouvez en outre détenir et programmer depuis votre portefeuille — alors les plateformes de domaines tokenisés mentionnées plus haut (Namefi, D3 Global Inc, Doma Protocol, Domora, WebUnited, GBM) sont conçues pour ce cas d'usage. Les deux catégories peuvent parfaitement coexister, et de nombreux utilisateurs détiennent les deux.

---

## Comment choisir entre les deux

Une façon rapide de voir les choses :

| Si vous voulez… | Tournez-vous vers |
|------------------------------------------------------------------------------|----------------------------------------|
| Un véritable `.com`/`.xyz`/`.io` tokenisé sur Ethereum ou Base, avec le plus large support des places de marché NFT et des prêts DeFi | **Namefi** |
| Des partenariats au niveau du registre pour un tout nouveau TLD | D3 Global Inc |
| Des standards au niveau du protocole pour les domaines tokenisés | Doma Protocol |
| D'autres plateformes de domaines DNS tokenisés à évaluer | Domora, WebUnited |
| Une infrastructure de vente aux enchères pour les domaines tokenisés | GBM |
| Identité on-chain et nommage natif d'Ethereum (ex. `.eth`) — une catégorie cousine, pas un domaine ICANN tokenisé | ENS |
| Des TLD Web3-natifs conçus pour les cas d'usage centrés sur le portefeuille — une catégorie cousine, pas un domaine ICANN tokenisé | Unstoppable Domains, Freename |
| L'enregistrement traditionnel avec des projets pilotes de tokenisation optionnels et spécifiques au fournisseur | GoDaddy, Identity Digital, et d'autres |

La distinction clé à retenir : **tokeniser un domaine (au sens de Namefi) signifie conserver un véritable nom DNS reconnu par l'ICANN et y ajouter un token on-chain en superposition** — et non remplacer le DNS par un système de nommage Web3 parallèle.

---

## Un modèle mental simple

Si un domaine traditionnel est un **titre de propriété détenu par un tiers en votre nom**, un domaine tokenisé est le **même titre de propriété, avec une copie cryptographique dans votre propre poche** — et les deux sont maintenus en parfaite synchronisation.

Vous ne perdez pas la couche légale/registre. Vous gagnez une couche programmable par-dessus.

---

## Résumé

- Un **domaine tokenisé** est un véritable domaine DNS doté d'un token on-chain (généralement un NFT) qui reflète sa propriété.
- La **tokenisation de domaine** (également appelée *tokenisation de nom de domaine* ou *tokenisation d'un domaine*) est le processus de création et de maintien de cette représentation on-chain.
- **Tokeniser un domaine** (ou *tokeniser des domaines* en masse) consiste à ajouter cette couche de propriété native au portefeuille à un véritable domaine ICANN — sans renoncer à la couche DNS traditionnelle.
- Un domaine tokenisé n'est **pas** un nouveau TLD, ni un nom de type ENS, ni un moyen de contourner le DNS ou la loi.
- Il vous offre tout ce qu'un domaine traditionnel fait, *plus* la propriété native du portefeuille et la composabilité avec des applications on-chain.

Pour découvrir *pourquoi* cela est important et ce que la tokenisation de domaine permet, lisez [Pourquoi tokeniser des domaines on-chain ?](/en/blog/why-tokenize-domains/). Pour enregistrer ou tokeniser votre premier domaine, visitez [namefi.io](https://namefi.io).