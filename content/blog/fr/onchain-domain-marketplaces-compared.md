---
title: "Les places de marché de domaines onchain comparées : OpenSea, Seaport et au-delà"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 36
format: comparison
description: "OpenSea, les places de marché basées sur Seaport et celles natives aux domaines, comparées sur les frais, la portée et la garde — quel lieu convient à quelle vente de domaine tokenisé."
ogImage: ../../assets/onchain-domain-marketplaces-compared-og.jpg
keywords: ['place de marché de domaines onchain', 'place de marché de domaines tokenisés', 'vendre un domaine NFT', 'domaine OpenSea', 'protocole Seaport', 'frais des places de marché NFT', 'flipping de domaines web3', 'où vendre des domaines tokenisés', 'OpenSea vs Blur', 'vente atomique de NFT', 'domaine ERC-721', 'comparaison des places de marché de domaines NFT', 'place de marché Namefi', 'vente de domaine en auto-garde', 'trading de domaines onchain']
relatedArticles:
  - /fr/blog/selling-domains-as-nfts/
  - /fr/blog/onchain-domain-flipping/
  - /fr/blog/tokenize-your-com-to-flip-it/
  - /fr/blog/how-tokenization-changes-domain-flipping/
  - /fr/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/dns/
  - /fr/glossary/tld/
  - /fr/glossary/web3/
---

Si vous faites du flipping avec un [domaine tokenisé](/fr/blog/what-are-tokenized-domains/) — un véritable nom ICANN coiffé d'un jeton de propriété [on-chain](/fr/glossary/on-chain/) — vous disposez d'un choix que le monde traditionnel des domaines ne vous a jamais offert. Vous pouvez mettre le nom en vente comme un [NFT](/fr/glossary/nft/) sur une place de marché crypto généraliste, le vendre via un lieu basé sur [Seaport](/fr/glossary/smart-contract/) sans garde par un tiers, ou utiliser une plateforme native aux domaines conçue précisément pour cet actif. Chaque voie déplace le même jeton, mais les frais, la portée et le modèle de garde diffèrent suffisamment pour qu'un mauvais choix vous coûte un acheteur ou une partie de votre marge.

Ce guide compare les trois familles de lieux onchain — les places de marché NFT généralistes comme OpenSea, les places de marché basées sur Seaport et sans frais, et les plateformes natives aux domaines dont [Namefi](https://namefi.io) — sur les quatre éléments qui décident réellement d'un flip : les frais, la portée, la garde et le type de vente que chacune sert le mieux. Namefi est une option ici, pas la seule. L'objectif est de vous aider à faire correspondre le lieu à l'affaire.

Si vendre des noms sous forme de jetons est nouveau pour vous, commencez par [vendre des domaines en tant que NFT](/fr/blog/selling-domains-as-nfts/) et par le pilier de cluster sur le [flipping de domaines onchain](/fr/blog/onchain-domain-flipping/). Cet article suppose que vous détenez déjà un nom tokenisé et que vous décidez où le vendre.

## Pourquoi le lieu compte davantage onchain qu'en dehors

Sur le [marché secondaire](/fr/glossary/domain-trading/) traditionnel, la place de marché est surtout un tableau d'annonces doublé d'un guichet de [séquestre](/fr/blog/domain-escrow-explained/). Le nom ne bouge pas tant qu'un humain chez le registraire ne le pousse pas, et un tiers neutre détient l'argent entre-temps. Onchain, la place de marché se rapproche d'une couche de règlement : le contrat lui-même peut échanger le jeton contre le paiement en une seule transaction, de sorte que le bras de fer du « qui bouge en premier » que le séquestre existe pour résoudre peut s'effondrer en un seul [transfert atomique](/fr/glossary/atomic-transfer/). Nous détaillons ce mécanisme dans [comment les places de marché tokenisées remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

Ce basculement change ce que vous recherchez. Hors chaîne, vous comparez les taux de commission et la confiance dans le séquestre. Onchain, vous comparez aussi le modèle de smart contract, le fait que le lieu prenne ou non un jour la [garde](/fr/glossary/custodial-ownership/) de votre nom, et combien des bons acheteurs le parcourent réellement. Trois éléments comptent le plus : les **frais** (ce que le lieu et les créateurs prélèvent), la **portée** (votre acheteur est-il seulement là), et la **garde** (gardez-vous le nom dans votre propre [portefeuille](/fr/glossary/wallet/) jusqu'au moment de la vente).

## OpenSea et les places de marché NFT généralistes

![Illustration éditoriale de quatre devantures plates côte à côte sous des auvents à rayures — un grand bazar généraliste, un étal minimaliste épuré, un petit kiosque à enseigne hexagonale et une boutique native aux domaines arborant une enseigne en forme de globe](../../assets/onchain-domain-marketplaces-compared-01-venue-storefronts.jpg)

OpenSea est la réponse par défaut parce que c'est la plus grande place de marché NFT généraliste, et la plupart des domaines tokenisés émis comme jetons [ERC-721](/fr/glossary/erc-721/) — l'[interface standard pour les jetons non fongibles, aussi appelés titres de propriété](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds) — y apparaissent automatiquement. Si votre nom vit sur Ethereum ou Base, vous pouvez généralement le mettre en vente sur OpenSea sans aucune intégration spécifique aux domaines.

Côté frais, OpenSea facture désormais un [frais de 1 % pour la vente de NFT](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs), les revenus des créateurs étant gérés séparément — sur OpenSea, [les revenus des créateurs sont imposés ou optionnels](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=creator%20earnings%20are%20enforced%20or%20optional) selon la collection. Pour un domaine que vous avez frappé vous-même, il n'y a généralement aucune royaltie de créateur à craindre, donc le prélèvement total reste faible.

La force ici, c'est la portée et la familiarité. Un acheteur qui échange déjà des NFT a un portefeuille connecté, connaît le flux de mise en vente et fait confiance à la marque. La faiblesse, c'est qu'une place de marché généraliste traite votre nom comme n'importe quel autre JPEG. Elle ne fait pas ressortir les signaux propres aux domaines : que le nom se résout dans le [DNS](/fr/blog/dns-on-tokenized-domains/), qu'il porte du trafic, qu'il s'agit d'un vrai `.com` plutôt que d'une chaîne uniquement Web3. Un investisseur en domaines qui parcourt OpenSea n'a aucun moyen natif de filtrer sur « vrais noms ICANN avec X ». OpenSea est le filet le plus large et le contexte le moins profond.

**Idéal pour :** les noms liquides et reconnaissables où l'acheteur est crypto-natif et où la valeur est évidente à partir de la seule chaîne.

## Les places de marché basées sur Seaport et sans frais

![Illustration éditoriale d'une balance à deux plateaux pesant une petite pile de pièces représentant de faibles frais contre un large éventail rayonnant représentant la portée de l'audience](../../assets/onchain-domain-marketplaces-compared-02-fees-vs-reach.jpg)

[Seaport](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs) est le protocole open source sous-jacent à OpenSea — décrit par son propre dépôt comme [un protocole de place de marché pour acheter et vendre des NFT en toute sécurité et efficacité](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs). Parce que c'est un [smart contract](/fr/glossary/smart-contract/) public, n'importe qui peut construire une place de marché par-dessus, ce qui explique pourquoi « basé sur Seaport » est une catégorie et non un site unique. Le trait commun, c'est que les annonces sont des offres signées réglées directement par le contrat : vous gardez le nom dans votre portefeuille, le paiement de l'acheteur et votre jeton s'échangent de manière atomique, et aucun opérateur ne détient jamais l'actif.

L'autre branche notable, ce sont les lieux sans frais, destinés aux traders professionnels. Blur, par exemple, affiche [0 %](https://blur.io/#:~:text=0%25) de [frais de place de marché](https://blur.io/#:~:text=Marketplace%20fees) pour arracher les traders à haute fréquence aux acteurs établis. Pour un flipper qui optimise chaque point de base, un lieu sans frais est séduisant — mais la portée est le piège. Ces plateformes sont calibrées pour des collections d'art et de PFP aux planchers profonds et quasi fongibles, pas pour des noms de domaine uniques où chaque chaîne est un marché distinct. Vous pouvez ne rien payer en frais et tout de même attendre longtemps parce que le bon acheteur n'y est pas.

L'histoire de la garde est le vrai gain dans cette famille : un flux Seaport bien conçu est un véritable [transfert atomique](/fr/glossary/atomic-transfer/), de sorte que le risque de contrepartie que le séquestre existe pour neutraliser disparaît en grande partie. C'est une amélioration significative par rapport au processus hors chaîne décrit dans notre [explication du séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

**Idéal pour :** les vendeurs sensibles aux frais qui ont déjà un acheteur en vue, ou qui veulent l'auto-garde et le règlement atomique et n'ont pas besoin que le lieu génère la demande.

## Une note sur les places de marché de noms natifs au Web3

Il vaut la peine de distinguer les domaines ICANN tokenisés des noms natifs au Web3, parce qu'ils s'échangent à des endroits différents et que la distinction est facile à brouiller. Un nom [ENS](/fr/glossary/ens/) comme `vitalik.eth` n'est pas un domaine DNS — ENS est [un système de nommage distribué, ouvert et extensible fondé sur la blockchain Ethereum](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain), et les noms `.eth` vivent en dehors de la racine ICANN. Ils sont aussi émis selon un modèle de frais différent : ENS tarife les enregistrements `.eth` selon la longueur, un nom de cinq caractères ou plus coûtant environ [5 USD par an](https://docs.ens.domains/registry/eth#:~:text=5%20USD) tandis qu'un nom de trois caractères revient à environ [640 $](https://docs.ens.domains/registry/eth#:~:text=640) par an.

ENS et les noms similaires sont échangeables comme NFT et peuvent figurer sur OpenSea juste à côté d'un `.com` tokenisé, mais l'acheteur de `crypto.eth` veut autre chose que l'acheteur de `crypto.com` — l'un est une identité native au portefeuille, l'autre une adresse de site web résoluble universellement. Nous traçons toute la ligne de partage dans [flipping de domaines ENS vs DNS](/fr/blog/ens-vs-dns-domain-flipping/) et la comparaison au niveau des plateformes dans [ENS vs Unstoppable vs domaines DNS tokenisés](/fr/blog/ens-vs-unstoppable-vs-tokenized-dns/). En bref : ne tarifez pas et ne mettez pas en vente un domaine ICANN tokenisé comme s'il s'agissait d'un nom ENS, et ne supposez pas qu'un acheteur ENS est votre acheteur.

## Les places de marché natives aux domaines, dont Namefi

La troisième famille est conçue spécifiquement pour les vrais domaines tokenisés. Au lieu de traiter le nom comme un jeton générique, un lieu natif aux domaines comprend qu'il y a une couche DNS en dessous : il peut montrer que le nom se résout, maintenir la continuité du DNS tout au long de la passation pour qu'un site actif ne s'éteigne pas en pleine transaction, et présenter l'annonce à des acheteurs qui cherchent de vrais domaines plutôt que des objets de collection.

[Namefi](https://namefi.io) se situe dans cette catégorie. Elle tokenise de vrais noms ICANN comme NFT sur Ethereum et Base tout en maintenant la couche DNS en fonctionnement, ce qui signifie qu'un nom vendu via Namefi peut se régler [on-chain](/fr/glossary/on-chain/) avec les mêmes mécaniques atomiques et sans séquestre qu'une vente Seaport — mais avec le contexte propre aux domaines qu'une place de marché généraliste ne peut pas fournir. Parce que les noms tokenisés par Namefi sont des NFT standard, ils restent aussi listables sur OpenSea et d'autres lieux. Vous n'êtes pas enfermé ; vous ajoutez une option consciente des domaines, sans fermer les autres. Si vous choisissez d'abord où tokeniser, [choisir une plateforme de tokenisation de domaine](/fr/blog/choosing-a-domain-tokenization-platform/) compare les fournisseurs.

Le compromis, c'est que les places de marché natives aux domaines sont plus jeunes et plus clairsemées qu'OpenSea. Leur portée est plus étroite en nombre brut d'utilisateurs, même si chaque utilisateur est un acheteur de domaine plus qualifié. Pour les noms de grande valeur où l'acheteur doit avoir la certitude qu'il obtient un vrai domaine résoluble — et pas seulement un jeton — ce contexte qualifié peut compter davantage que le simple volume de trafic.

**Idéal pour :** les vrais noms ICANN où la continuité du DNS, la confiance de l'acheteur et la présentation propre aux domaines comptent — typiquement vos noms de plus grande valeur ou activement utilisés.

## Comment faire correspondre le lieu à la vente

![Illustration éditoriale d'une pièce-jeton de domaine acheminée le long de chemins pointillés qui se ramifient vers la devanture la plus adaptée parmi plusieurs, à la manière d'un organigramme de décision](../../assets/onchain-domain-marketplaces-compared-03-match-venue.jpg)

Il n'y a pas de meilleure place de marché unique, seulement une meilleure adéquation pour un nom donné. Un guide de décision approximatif :

| Si le nom est… | Penchez vers |
|---|---|
| Une chaîne liquide et reconnaissable dans la crypto, acheteur natif aux NFT | OpenSea — la plus large portée, faible frais de 1 % |
| Déjà vendu (vous avez l'acheteur), vous voulez zéro frais + auto-garde | Un lieu basé sur Seaport ou sans frais — règlement atomique |
| Un vrai domaine ICANN résoluble où la continuité du DNS et la confiance comptent | Une place de marché native aux domaines comme Namefi |
| Un nom ENS / natif au Web3, pas un domaine DNS | Un lieu conscient d'ENS — et tarifez-le comme une identité, pas un site web |

Le point plus profond, c'est qu'onchain, vous pouvez mettre le même jeton en vente à plus d'un endroit à la fois, parce que la plupart de ces lieux lisent depuis le même portefeuille et le même contrat ERC-721. Un flipper pragmatique met souvent ses noms en vente largement sur une place de marché généraliste pour la portée et travaille les noms de grande valeur via un lieu natif aux domaines pour le contexte et la confiance. Le modèle de garde — garder le nom dans votre propre portefeuille [multi-signature](/fr/glossary/multi-sig/) ou à clé unique jusqu'au règlement — vous suit à travers tous, ce qui est toute la raison pour laquelle les ventes sur [place de marché](/fr/glossary/marketplace/) en auto-garde battent l'ancienne danse du séquestre. Pour en savoir plus sur la protection de l'actif lui-même, voyez [les portefeuilles multisig améliorent-ils vraiment la sécurité](/fr/blog/do-multisig-wallets-actually-improve-security/) et le mode d'emploi de récupération dans [récupérer un domaine tokenisé après la perte d'un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/).

Choisissez le lieu pour le nom que vous avez devant vous, pas l'inverse. Le jeton est le même partout ; l'acheteur ne l'est pas.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces articles pour nous instruire et par commodité pour nos clients. Les informations ici peuvent être périmées, propres à une zone géographique, ou tout simplement fausses. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DOYR - Do Your Own Research (faites vos propres recherches)**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Ethereum Improvement Proposals — [Norme de jeton non fongible ERC-721 (« une interface standard pour les jetons non fongibles, aussi appelés titres de propriété »)](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea/seaport (GitHub) — [Seaport est un protocole de place de marché pour acheter et vendre des NFT en toute sécurité et efficacité](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- Centre d'aide OpenSea — [Quels frais est-ce que je paie sur OpenSea ? (frais de vente de 1 % ; revenus des créateurs imposés ou optionnels)](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)
- Blur — [Place de marché NFT pour traders professionnels (0 % de frais de place de marché)](https://blur.io/#:~:text=0%25)
- Documentation ENS — [Qu'est-ce qu'ENS ? (« un système de nommage distribué, ouvert et extensible fondé sur la blockchain Ethereum »)](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- Documentation ENS — [Tarification du registraire .eth (frais annuels selon la longueur : ~5 $/an pour 5 caractères ou plus, ~640 $/an pour 3 caractères)](https://docs.ens.domains/registry/eth#:~:text=5%20USD)
