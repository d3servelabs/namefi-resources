---
title: "Que sont les domaines tokenisés ? Un guide sur la tokenisation de domaine"
date: '2026-05-22'
language: fr
tags: ['faq']
authors: ['namefiteam']
draft: false
description: "Une introduction en langage clair aux domaines tokenisés et à la tokenisation de domaine : ce que signifie tokeniser un domaine, comment cela fonctionne et en quoi un domaine tokenisé diffère des domaines traditionnels et des noms exclusivement basés sur la blockchain comme l'ENS."
keywords: ["domaine tokenisé", "domaines tokenisés", "tokeniser un domaine", "tokeniser des domaines", "tokeniser domaine", "tokenisation d'un domaine", "tokenisation de domaines", "tokenisation de domaine", "tokenisation des domaines", "tokenisation de nom de domaine", "comment tokeniser un domaine", "qu'est-ce qu'un domaine tokenisé", "que sont les domaines tokenisés", "domaines NFT", "domaine NFT", "domaines on-chain", "domaine on-chain", "domaines blockchain", "domaine blockchain", "DNS", "domaines ICANN", "domaines web3", "domaine web3", "NFT de domaine", "domaine en tant que NFT", "namefi", "propriété de domaine", "tokenisation d'actif de domaine", "Namefi", "D3", "D3 Global Inc", "D3 Inc", "Doma", "Doma Protocol", "Domora", "WebUnited", "GBM", "GBM Auctions", "ENS", "Ethereum Name Service", "Unstoppable Domains", "Freename", "GoDaddy", "Identity Digital", "Namefi vs ENS", "Namefi vs Unstoppable Domains", "Namefi vs D3", "domaine tokenisé vs ENS", "domaine tokenisé vs domaine web3", "domaine ICANN vs domaine web3", "comparer les plateformes de domaines tokenisés"]
---

Vous avez peut-être entendu des expressions telles que "domaine tokenisé", "[tokeniser](/fr/glossary/tokenize/) un domaine" ou "tokenisation de domaine" et vous vous êtes demandé ce qu'elles signifiaient réellement. Un domaine tokenisé est-il un nouveau type de domaine ? Un nom exclusivement basé sur la [blockchain](/fr/glossary/blockchain/) ? Un remplaçant pour le `.com` ? Et que signifie le fait de *tokeniser* un domaine en premier lieu ?

Cet article répond directement à la question **"quoi"** : ce qu'*est* un domaine tokenisé, ce que *signifie* la tokenisation de domaine, ce que *n'est pas* la tokenisation d'un domaine, et comment tout ce concept se rapporte aux noms de domaine que vous connaissez déjà.

> Si vous voulez comprendre *pourquoi* la tokenisation de domaine est importante, consultez [Pourquoi tokeniser des domaines on-chain ?](/fr/blog/why-tokenize-domains/). Cet article se concentre sur le *quoi*.

---

## La définition courte

Un **domaine tokenisé** est un [nom de domaine](/fr/blog/what-is-domain/) classique reconnu par l'[ICANN](/fr/glossary/icann/) (comme `mamarque.xyz` ou `example.com`) dont la propriété est également représentée sous la forme d'un **jeton (token) sur une blockchain** — généralement un [NFT](/fr/glossary/nft/). Le processus de création de cette représentation adossée à un jeton s'appelle la **tokenisation de domaine**, et l'acte en lui-même est ce que les gens entendent lorsqu'ils disent *tokeniser un domaine* ou *tokeniser des domaines*.

En d'autres termes :

> Un domaine tokenisé est un seul domaine doté de **deux couches de propriété synchronisées** : l'enregistrement traditionnel dans le [registre](/fr/glossary/registry/) [DNS](/fr/glossary/dns/), *et* un jeton [on-chain](/fr/glossary/on-chain/) qui le reflète. **Tokeniser un domaine** consiste à ajouter cette deuxième couche on-chain à un nom de domaine existant ou nouvellement enregistré.

Lorsque vous transférez le jeton, le domaine sous-jacent suit. Lorsque le domaine expire ou est renouvelé, le jeton reflète cet état.

---

## Deux couches, un domaine

Il est utile de se représenter un domaine tokenisé comme ayant deux enregistrements synchronisés :

| Couche           | Ce que c'est                                          | Qui la maintient                          |
|------------------|-------------------------------------------------------|-------------------------------------------|
| DNS / Registre   | L'enregistrement officiel auprès du [bureau d'enregistrement (registrar)](/fr/glossary/registrar/) et du registre | Les bureaux d'enregistrement accrédités par l'ICANN |
| Jeton on-chain   | Un NFT dans votre [portefeuille (wallet)](/fr/glossary/wallet/) qui représente la propriété | Un [contrat intelligent (smart contract)](/fr/glossary/smart-contract/) sur une blockchain publique |

Les deux couches sont maintenues synchronisées par la plateforme de tokenisation de domaine (dans le cas de Namefi, par le protocole Namefi et ses intégrations avec les bureaux d'enregistrement). Chaque fois que nous parlons de *tokeniser un domaine*, de *tokeniser des domaines* ou de la *tokenisation de nom de domaine*, nous parlons d'établir et de maintenir cette relation à deux couches pour un domaine spécifique.

Cela diffère de la possession d'un domaine *uniquement* auprès d'un bureau d'enregistrement (le modèle traditionnel) et diffère de la possession d'un nom *uniquement* on-chain (le modèle de type ENS). Un domaine tokenisé est délibérément les deux.

---

## Ce que les domaines tokenisés *ne sont pas*

Il convient de dissiper quelques idées fausses courantes sur la tokenisation des domaines :

### Pas une nouvelle extension (TLD)

Un domaine tokenisé n'est pas un nom de type `.crypto`, `.eth` ou `.x`. Lorsque vous tokenisez un domaine via Namefi, vous utilisez les mêmes extensions (TLD) que vous connaissez déjà — `.com`, `.xyz`, `.io`, `.art`, etc. — qui se résolvent dans n'importe quel navigateur, client de messagerie ou résolveur DNS au monde.

### Pas la même chose que l'ENS ou les "noms blockchain"

Les noms [ENS](/fr/glossary/ens/) (comme `vitalik.eth`) vivent entièrement on-chain et ne se résolvent pas dans le DNS standard sans ponts (bridges) ou résolveurs spéciaux. Les domaines tokenisés, en revanche, sont de **véritables domaines DNS** qui possèdent *également* une représentation on-chain. La tokenisation de domaine ajoute la couche on-chain à un véritable nom DNS ; elle ne remplace pas le DNS par un système de nommage parallèle.

| Fonctionnalité                   | Domaine traditionnel | Nom ENS / Blockchain   | Domaine tokenisé |
|----------------------------------|----------------------|------------------------|------------------|
| Fonctionne sur tout navigateur   | Oui                  | Nécessite un résolveur | Oui              |
| Reconnu par l'ICANN              | Oui                  | Non                    | Oui              |
| Détenu dans votre portefeuille   | Non                  | Oui                    | Oui              |
| Transférable on-chain            | Non                  | Oui                    | Oui              |
| Composable avec des smart contracts | Non               | Oui                    | Oui              |

### Pas à l'épreuve de la censure ni "en dehors de la loi"

Étant donné que l'actif sous-jacent est un véritable domaine DNS, les domaines tokenisés restent soumis au renouvellement, aux politiques de l'ICANN, aux litiges [UDRP](/fr/glossary/udrp/) et à la loi en vigueur. Le jeton reflète la propriété ; il n'exempte pas le domaine des règles du monde réel.

---

## Comment fonctionne la tokenisation d'un domaine en pratique

Voici ce qui se passe réellement lorsque vous tokenisez un domaine (ou enregistrez un tout nouveau domaine tokenisé) sur Namefi :

1. **Enregistrement** — Un véritable domaine DNS est enregistré (ou transféré) par l'intermédiaire d'un bureau d'enregistrement accrédité.
2. **[Frappe](/fr/glossary/minting/) (Minting)** — Dans le cadre de la tokenisation du domaine, un NFT représentant ce domaine est frappé (minted) vers votre portefeuille.
3. **Synchronisation** — La plateforme maintient la propriété au niveau du DNS alignée avec la propriété on-chain pour chaque domaine tokenisé. Si vous transférez le NFT, l'enregistrement DNS suit.
4. **Utilisation** — Vous pouvez faire pointer le domaine tokenisé vers un site web, configurer des enregistrements DNS, ou utiliser le NFT dans des applications on-chain (places de marché, identité, [DeFi](/fr/glossary/defi/), etc.).

L'expérience pour l'[utilisateur final](/fr/glossary/end-user/) est la suivante : *un seul domaine, deux façons d'interagir avec* — le monde familier du DNS et le monde on-chain programmable que la tokenisation de domaine débloque.

---

## Ce que vous pouvez faire avec un domaine tokenisé

Puisque les deux couches existent, vous obtenez l'union de leurs capacités :

- **L'utiliser comme un domaine normal** — héberger un site web, configurer des e-mails, paramétrer des enregistrements DNS.
- **Le détenir dans votre propre portefeuille** — aucun compte hébergé n'est requis pour la propriété.
- **Le transférer en quelques secondes** — envoyez le NFT à un autre portefeuille ; l'enregistrement DNS suit.
- **Le lister sur des places de marché NFT** — OpenSea, Blur, et d'autres.
- **L'utiliser dans des contrats intelligents** — garantie (collatéral), [enchères](/fr/glossary/auction/), [location](/fr/glossary/leasing/), [propriété fractionnée](/fr/glossary/fractional-ownership/), et bien plus encore.
- **Le lier à une identité on-chain** — le connecter aux systèmes [Farcaster](/fr/glossary/farcaster/), [Lens](/fr/glossary/lens/) ou [DID](/fr/glossary/did/).

---

## Les meilleures plateformes qui tokenisent des domaines

La tokenisation de domaine n'est plus une expérimentation menée par un seul fournisseur — plusieurs plateformes offrent désormais des moyens de tokeniser un domaine ou de travailler avec des domaines tokenisés, chacune avec une approche légèrement différente. Voici un aperçu des noms les plus reconnus dans ce domaine.

> Les liens externes ci-dessous sont fournis à titre de référence utile et ne constituent pas des recommandations.

### 1. Namefi (c'est nous)

**Approche :** Tokeniser de véritables domaines ICANN (`.com`, `.xyz`, `.io`, `.art`, et bien d'autres) sous forme de NFT tout en gardant la couche DNS pleinement fonctionnelle. Les deux couches sont maintenues synchronisées via des bureaux d'enregistrement accrédités.

**Ce qui distingue Namefi :** Namefi a été la **première plateforme à tokeniser de véritables domaines ICANN sur le réseau principal [Ethereum](/fr/glossary/ethereum/) (mainnet), et la première à le faire sur Base**. Comme les domaines tokenisés par Namefi vivent sur Ethereum et Base, ils s'intègrent naturellement avec **la plupart des grandes places de marché NFT et des protocoles de prêt** — OpenSea, Blur, NFTfi, et d'autres — grâce à l'écosystème DeFi profond et mature d'Ethereum. D'autres plateformes ont fait leurs propres choix réfléchis de blockchain en fonction de leurs objectifs ; Ethereum et Base se trouvent être celles qui offrent aujourd'hui aux utilisateurs de Namefi la plus large compatibilité native avec les outils NFT et DeFi existants.

**Idéal pour :** Les propriétaires qui souhaitent un véritable domaine résolvable dans un navigateur *et* une propriété composable native au portefeuille dans un seul produit, sur la blockchain offrant le plus grand support DeFi et NFT. Visitez [namefi.io](https://namefi.io) pour commencer.

### 2. D3 Global Inc

**Approche :** Une plateforme axée sur l'intégration de TLD (extensions) nouveaux et existants on-chain au niveau du registre, en partenariat avec des opérateurs de TLD et des infrastructures alignées sur l'ICANN.

**Idéal pour :** Les initiatives de tokenisation au niveau du registre et les lancements de nouveaux TLD tokenisés. Site : [d3.inc](https://d3.inc).

### 3. Doma Protocol

**Approche :** Un effort au niveau du protocole pour standardiser la manière dont les vrais domaines sont représentés et transférés on-chain à travers les bureaux d'enregistrement et les blockchains.

**Idéal pour :** Les développeurs recherchant des abstractions au niveau du protocole pour la tokenisation de domaine. Site : [doma.xyz](https://doma.xyz).

### 4. Domora

**Approche :** Une autre plateforme émergente dans l'espace des domaines tokenisés, axée sur l'intégration de véritables noms de domaine on-chain.

**Idéal pour :** Les utilisateurs évaluant des alternatives dans la catégorie des domaines DNS tokenisés. Site : [domora.com](https://domora.com).

### 5. WebUnited

**Approche :** Un acteur explorant la représentation on-chain de domaines et l'infrastructure connexe pour les véritables noms de domaine.

**Idéal pour :** Les équipes recherchant des options supplémentaires de domaines tokenisés. Site : [webunited.com](https://webunited.com).

### 6. GBM (Global Brand Marketplace / GBM Auctions)

**Approche :** Connu pour son infrastructure d'enchères on-chain qui a été appliquée aux ventes de domaines tokenisés et aux actifs de marque.

**Idéal pour :** La découverte et la vente de domaines tokenisés et d'actifs de marque numériques connexes par le biais d'enchères. Site : [gbm.auction](https://gbm.auction).

### 7. Les bureaux d'enregistrement traditionnels explorant la tokenisation

Certains bureaux d'enregistrement et registres historiques de l'ICANN (par ex. [GoDaddy](https://www.godaddy.com), [Identity Digital](https://www.identity.digital)) ont annoncé des initiatives ou des partenariats exploratoires en matière de tokenisation. La couverture et la disponibilité varient considérablement, et l'essentiel de leur activité principale reste l'enregistrement DNS traditionnel exclusif.

---

## Une catégorie cousine : ENS, Unstoppable Domains, Freename et les domaines Web3

Une cousine proche des domaines tokenisés est la famille des **domaines [Web3](/fr/glossary/web3/)** — une catégorie lancée par d'excellents projets comme l'ENS, Unstoppable Domains et Freename. Nous tenons à être clairs sur cette distinction, non pas pour minimiser leur travail (ils ont énormément contribué au nommage et à l'identité on-chain), mais pour aider les lecteurs à choisir le bon outil en fonction de leurs objectifs.

Les domaines Web3 ont une conception délibérément différente de celle des domaines ICANN tokenisés. Voici comment les envisager :

- **Un espace de noms différent par conception.** Les domaines Web3 (`.eth`, `.crypto`, `.x`, `.nft` et les TLD créés par les utilisateurs) vivent intentionnellement en dehors de la racine de l'ICANN, ce qui leur permet d'itérer rapidement et d'expérimenter de nouveaux modèles de nommage. Le compromis est qu'ils se situent à côté de la hiérarchie DNS traditionnelle plutôt qu'à l'intérieur de celle-ci.
- **La résolution dans les navigateurs et les e-mails nécessite des étapes supplémentaires.** Visiter un domaine Web3 dans un navigateur classique, ou lui envoyer un e-mail, nécessite généralement un résolveur, une extension ou un pont. L'écosystème de portefeuilles, dApps et navigateurs crypto-natifs qui les prennent *réellement* en charge se développe régulièrement — mais la parité avec les navigateurs standard, les serveurs de messagerie, les CDN, les outils de référencement (SEO) et les autorités de certification SSL/TLS est toujours en cours.
- **De véritables cas d'utilisation inédits natifs au portefeuille.** C'est là que les domaines Web3 excellent : remplacer les longues adresses `0x...` par des noms lisibles par l'humain, simplifier les transferts de jetons, faciliter les connexions aux dApps et servir de primitives d'identité on-chain. Bon nombre de ces modèles n'existaient tout simplement pas avant l'ENS et ses pairs, et les domaines tokenisés s'appuient sur ces idées.
- **Le profil d'adoption diffère de celui des véritables domaines DNS / ICANN.** Les vrais domaines (également appelés *domaines DNS*, *domaines ICANN* ou *vrais domaines* — par ex. `.com`, `.org`, `.xyz`, `.io`) bénéficient de décennies de support universel sur tous les navigateurs, fournisseurs de messagerie, CDN et autorités de certification. Les domaines Web3 ont une portée impressionnante et croissante au sein de l'écosystème crypto-natif, tandis que l'adoption plus large sur Internet est encore en phase de rattrapage.

Les principales plateformes de domaines Web3, avec une reconnaissance pour la contribution de chacune :

- [ENS](https://ens.domains) — un système de nommage fondamental natif d'Ethereum (`.eth`) et l'une des primitives les plus importantes du Web3. L'ENS offre également des ponts bien pensés vers de vrais noms DNS via [DNSSEC](/fr/glossary/dnssec/).
- [Unstoppable Domains](https://unstoppabledomains.com) — un pionnier précoce et influent des noms natifs de la blockchain tels que `.crypto`, `.x` et `.nft`, avec de larges intégrations de portefeuilles et de dApps.
- [Freename](https://freename.io) — une approche inventive des TLD Web3 et des espaces de noms créés par les utilisateurs.

Si votre objectif principal est **l'identité on-chain** ou le **nommage Web3**, ces plateformes sont excellentes et valent vraiment la peine d'être explorées. Si votre objectif principal est d'avoir un nom qui fonctionne **également** dans n'importe quel navigateur, n'importe quel client de messagerie, n'importe quel CDN et n'importe quelle autorité de certification SSL — c'est-à-dire un véritable domaine ICANN que vous pouvez par ailleurs détenir et programmer depuis votre portefeuille — alors les plateformes de domaines tokenisés ci-dessus (Namefi, D3 Global Inc, Doma Protocol, Domora, WebUnited, GBM) sont conçues pour ce cas d'utilisation. Les deux catégories peuvent tout à fait coexister, et de nombreux utilisateurs détiennent les deux.

---

## Comment choisir entre elles

Une façon rapide d'y penser :

| Si vous voulez… | Tournez-vous vers |
|-----------------|-------------------|
| Un vrai `.com`/`.xyz`/`.io` tokenisé sur Ethereum ou Base, avec le plus grand support pour les places de marché NFT et les prêts DeFi | **Namefi** |
| Des partenariats au niveau du registre pour un tout nouveau TLD | D3 Global Inc |
| Des standards au niveau du protocole pour les domaines tokenisés | Doma Protocol |
| Des plateformes supplémentaires de domaines DNS tokenisés à évaluer | Domora, WebUnited |
| Une infrastructure de vente aux enchères pour les domaines tokenisés | GBM |
| Une identité on-chain et un nommage natif d'Ethereum (par ex. `.eth`) — une catégorie cousine, pas un domaine ICANN tokenisé | ENS |
| Des TLD natifs du Web3 conçus pour des cas d'utilisation axés sur les portefeuilles — une catégorie cousine, pas un domaine ICANN tokenisé | Unstoppable Domains, Freename |
| Un enregistrement traditionnel avec des projets pilotes optionnels de tokenisation spécifiques à un fournisseur | GoDaddy, Identity Digital, d'autres |

La distinction clé à retenir : **tokeniser un domaine (au sens de Namefi) signifie conserver un véritable nom DNS reconnu par l'ICANN et y ajouter un jeton on-chain par-dessus** — et non pas remplacer le DNS par un système de nommage Web3 parallèle.

---

## Un modèle mental simple

Si un domaine traditionnel est un **titre de propriété détenu par un tiers en votre nom**, un domaine tokenisé est ce **même titre de propriété, avec une copie cryptographique dans votre propre poche** — et les deux sont maintenus en parfaite synchronisation.

Vous ne perdez pas la couche légale/du registre. Vous y gagnez une couche programmable par-dessus.

---

## Résumé

- Un **domaine tokenisé** est un véritable domaine DNS avec un jeton on-chain (généralement un NFT) qui reflète sa propriété.
- La **tokenisation de domaine** (également appelée *tokenisation de nom de domaine* ou *tokenisation d'un domaine*) est le processus de création et de maintien de cette représentation on-chain.
- **Tokeniser un domaine** (ou *tokeniser des domaines* en lot) consiste à ajouter cette couche de propriété native au portefeuille à un véritable domaine ICANN — sans abandonner la couche DNS traditionnelle.
- Un domaine tokenisé **n'est pas** un nouveau TLD, ce n'est pas un nom de type ENS et ce n'est pas un moyen de contourner le DNS ou la loi.
- Il vous offre tout ce qu'un domaine traditionnel fait, *plus* la propriété native au portefeuille et la composabilité avec des applications on-chain.

Pour découvrir *pourquoi* cela est important et ce que la tokenisation de domaine débloque, lisez [Pourquoi tokeniser des domaines on-chain ?](/fr/blog/why-tokenize-domains/). Pour enregistrer ou tokeniser votre premier domaine, visitez [namefi.io](https://namefi.io).