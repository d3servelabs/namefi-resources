---
title: "Vendre des domaines en tant que NFT : la liquidité on-chain"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: "Comment fonctionne la vente d''un domaine en tant que NFT : mécanique de mise en vente, Seaport et OpenSea, ventes privées réservées à un acheteur, royalties, ainsi que les pièges du gas et des arnaques."
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['vendre un domaine en NFT', 'domaine NFT', 'vente de domaine tokenisé', 'liquidité on-chain des domaines', 'mettre en vente un domaine NFT sur OpenSea', 'protocole Seaport', 'mise en vente réservée à un acheteur', 'mise en vente NFT privée', 'royalties NFT domaines', 'domaine ERC-721', 'transfert atomique de domaine', 'vendre un domaine tokenisé', 'frais de gas vente NFT', 'arnaques aux domaines NFT', 'domain flipping on-chain']
relatedArticles:
  - /fr/blog/onchain-domain-marketplaces-compared/
  - /fr/blog/onchain-domain-flipping/
  - /fr/blog/tokenize-your-com-to-flip-it/
  - /fr/blog/how-tokenization-changes-domain-flipping/
  - /fr/blog/end-user-vs-reseller-domain-pricing/
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
  - /fr/glossary/web3/
  - /fr/glossary/tld/
---

Une vente de domaine traditionnelle porte en elle un problème de confiance. Le vendeur ne veut pas lancer le transfert avant que l''argent n''arrive ; l''acheteur ne veut pas virer les fonds avant que le nom n''apparaisse dans son compte. Toute l''industrie du [séquestre](/fr/glossary/escrow/) existe pour se tenir entre ces deux réflexes. Vendre un domaine en tant que [NFT](/fr/glossary/nft/) réorganise ce face-à-face. Lorsque la propriété d''un véritable domaine ICANN est aussi un jeton [on-chain](/fr/glossary/on-chain/), le nom devient une chose que vous pouvez mettre en vente, valoriser et remettre à l''intérieur de la même transaction qui déplace l''argent — sans intermédiaire détenant l''actif dans les heures obscures entre le paiement et le transfert.

Ce guide porte sur cette couche de liquidité : ce qui se passe réellement quand vous mettez en vente un NFT de [domaine](/fr/glossary/domain-trading/), comment fonctionne la plomberie des places de marché, quand utiliser une mise en vente privée réservée à un acheteur plutôt qu''une mise en vente ouverte, comment se comportent les royalties, et les pièges du gas et des arnaques qui grignotent discrètement les ventes on-chain. C''est un rayon de la série plus large sur le [domain flipping](/fr/blog/domain-flipping/), et il suppose que vous savez déjà ce qu''est un nom tokenisé — sinon, commencez par [ce que sont les domaines tokenisés](/fr/blog/what-are-tokenized-domains/).

## Ce que vous vendez réellement

D''abord, un point de précision dont dépend tout cet article. Un domaine tokenisé n''est pas le même animal qu''un nom [ENS](/fr/glossary/ens/) ou qu''un nom Unstoppable, et les vendre n''est pas le même acte.

- Un **nom `.eth` [ENS](https://ens.domains)** vit entièrement sur Ethereum. Il se résout à travers les [portefeuilles](/fr/glossary/wallet/) et applications compatibles ENS, pas dans une simple barre d''adresse de navigateur, et ENS facture l''enregistrement selon la longueur — d''après la documentation ENS, [a `5+` letter `.eth` will cost you `5 USD` per year](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year) (un nom `.eth` de `5+` lettres vous coûtera `5 USD` par an), avec [a `4` letter `160 USD` per year](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year) (un nom de `4` lettres à `160 USD` par an) et [a `3` letter `640 USD` per year](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year) (un nom de `3` lettres à `640 USD` par an).
- Un **nom Unstoppable** (`.crypto`, `.x`, et compagnie) est un nom [Web3](/fr/glossary/web3/) frappé en dehors de la racine ICANN.
- Un **domaine ICANN tokenisé** est celui qui intéresse cette série : un véritable `example.com` qui se résout dans tous les navigateurs, *plus* un jeton dans votre portefeuille qui en représente le contrôle. Nous comparons les trois en tête-à-tête dans [domaine tokenisé vs domaine web3](/fr/blog/tokenized-domain-vs-web3-domain/).

La mécanique des places de marché ci-dessous s''applique à n''importe lequel d''entre eux, car ce sont tous des NFT. Mais la *valeur* que vous transférez est radicalement différente. Quand vous vendez un nom ENS, l''acheteur obtient une identité uniquement on-chain. Quand vous vendez un `.com` tokenisé, l''acheteur obtient un actif d''entreprise universellement résoluble dont le DNS continue de fonctionner pendant la passation. Ne laissez pas un parcours de mise en vente bien huilé vous pousser à valoriser l''un comme l''autre.

## Comment un NFT de domaine devient liquide

Presque tous les NFT de domaine que vous échangerez sont des jetons [ERC-721](/fr/glossary/erc-721/) — le standard que Wikipedia décrit comme [a technical framework, defining a set of rules and interfaces for creating and managing unique, non-fungible tokens (NFTs) on the Ethereum blockchain](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique) (un cadre technique définissant un ensemble de règles et d''interfaces pour créer et gérer des jetons uniques et non fongibles (NFT) sur la blockchain Ethereum). Le fait d''être un jeton standard est ce qui le rend liquide : n''importe quelle [place de marché](/fr/glossary/marketplace/), portefeuille ou [smart contract](/fr/glossary/smart-contract/) qui parle l''ERC-721 peut le mettre en vente, le placer sous séquestre ou prêter contre lui sans que votre nom ne constitue un cas particulier.

Cette standardisation est toute l''histoire de la liquidité. Un domaine traditionnel ne se vend que là où un registrar ou une place de marché de domaines lui permet de se vendre. Un NFT de domaine se vend partout où l''ERC-721 est compris — ce qui correspond aujourd''hui à l''essentiel de l''économie NFT. C''est la raison structurelle pour laquelle la tokenisation change l''échange, traitée plus en profondeur dans [comment la tokenisation change le domain flipping](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

## Mettre en vente sur une place de marché : Seaport et OpenSea

![Illustration éditoriale d''une balance montrant un jeton NFT de domaine d''un côté et une pile de pièces de l''autre, reliés par un maillon de chaîne entrelacé au centre sous l''auvent d''une place de marché](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

Les rails dominants des ventes de NFT sont [Seaport](https://docs.opensea.io/docs/seaport) et [OpenSea](https://opensea.io), et il est utile de comprendre que ce sont deux couches différentes. Seaport est le protocole ; OpenSea est l''une des vitrines posées par-dessus. D''après la documentation d''OpenSea elle-même, [Seaport is a marketplace protocol for safely and efficiently buying and selling NFTs on the blockchain](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs) (Seaport est un protocole de place de marché pour acheter et vendre des NFT sur la blockchain de manière sûre et efficace), et [Seaport powers the OpenSea website](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website) (Seaport propulse le site web d''OpenSea) — chaque ordre sur OpenSea passe par lui.

Le modèle mental qui compte pour un vendeur est la structure bilatérale de Seaport : une **offre** (offer) et une **contrepartie** (consideration). L''offre est ce que vous mettez en jeu (votre NFT de domaine). La contrepartie est ce que vous exigez en retour (un prix en ETH ou en stablecoin, plus tous frais et royalties acheminés vers d''autres parties). Vous signez cet ordre une seule fois. Rien ne bouge tant qu''un acheteur ne l''exécute pas, et lorsqu''il le fait, le protocole règle les deux côtés en une seule étape atomique — votre jeton et son paiement s''échangent dans la même transaction, ou aucun des deux. Cette atomicité est la propriété de [transfert atomique](/fr/glossary/atomic-transfer/) qui remplace le séquestre : il n''existe aucune fenêtre où un côté a payé sans que l''autre n''ait livré.

La mise en vente en pratique est un rituel en deux temps que la plupart des vendeurs accomplissent une fois puis oublient :

1. **L''approbation.** La première fois que vous mettez en vente depuis un portefeuille, vous signez une approbation autorisant le contrat de la place de marché à déplacer ce jeton en votre nom lorsqu''une vente se déclenche. Cela coûte du gas ; les mises en vente ultérieures d''autres jetons de la même collection n''en coûtent généralement pas.
2. **L''ordre de mise en vente.** Vous signez l''ordre lui-même — prix, devise, durée. Sur la plupart des places de marché, cette signature est **sans gas** : vous signez un message, vous n''envoyez pas une transaction, donc créer ou annuler une mise en vente à prix fixe ne coûte généralement rien jusqu''à ce que quelqu''un achète.

Conséquence pratique : c''est l''acheteur, et non vous, qui paie généralement le gas pour exécuter un achat à prix fixe. Le guide vendeur d''OpenSea le dit clairement — [Buyers pay gas fees when purchasing a fixed-price item](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item) (les acheteurs paient les frais de gas lorsqu''ils achètent un article à prix fixe), tandis que [Sellers pay gas fees when accepting offers](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers) (les vendeurs paient les frais de gas lorsqu''ils acceptent des offres). Donc si vous mettez en vente et attendez, l''acheteur encaisse le gas ; si vous acceptez activement une offre entrante, c''est vous. Cette asymétrie devrait façonner votre façon de vendre quand le réseau est congestionné.

## Mises en vente privées réservées à un acheteur

![Illustration éditoriale d''un médaillon NFT de domaine enfermé dans une vitrine en verre visible par une petite foule, où une seule personne précise détient la clé dorée correspondante pour l''ouvrir](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

Une mise en vente ouverte convient à un nom de commodité que vous vendriez à n''importe qui. Mais beaucoup de vraies transactions de domaines se négocient d''abord hors marché — un prix convenu par e-mail ou par téléphone — et il vous suffit alors d''un moyen propre et sans confiance de régler avec *cet acheteur précis*. Mettre un tel nom en vente ouvertement est une erreur : un tiers qui surveille la place de marché pourrait le rafler à votre prix convenu avant que votre acheteur ne clique.

La solution est une **mise en vente réservée (privée) à un acheteur**, et Seaport la prend en charge nativement parce que la contrepartie peut nommer un destinataire requis. Sur OpenSea, vous la configurez dans le parcours de mise en vente : d''après leur guide, vous pouvez [reserve the item for a specific buyer. To do so, click Reserve and enter their wallet address](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click) (réserver l''article pour un acheteur précis. Pour ce faire, cliquez sur Reserve et saisissez son adresse de portefeuille). Seul ce portefeuille peut exécuter l''ordre. Tous les autres voient la mise en vente mais ne peuvent pas l''acheter.

C''est l''équivalent on-chain d''un règlement courtisé et réservé à un acheteur, et c''est le schéma sur lequel Namefi s''appuie pour les ventes guidées par les offres : négociez le montant avec un humain, puis réglez-le sous forme de mise en vente privée pour que l''acheteur convenu — et seulement lui — puisse accomplir l''échange atomique. Vous obtenez la confidentialité de la transaction hors marché *et* la finalité sans séquestre de la transaction on-chain. Veillez cependant à bien saisir l''adresse du portefeuille de destination : un seul caractère erroné et vous avez réservé votre nom à cinq chiffres à une adresse que personne ne contrôle.

## Les royalties : survivent-elles à la vente ?

Certains NFT de domaine portent une royalty — un pourcentage acheminé vers l''émetteur d''origine ou un créateur à chaque revente. Le standard ici est [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981), qui existe, selon ses propres termes, pour que les contrats puissent [signal a royalty amount to be paid to the NFT creator or rights holder every time the NFT is sold or re-sold](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold) (signaler un montant de royalty à verser au créateur du NFT ou au détenteur des droits chaque fois que le NFT est vendu ou revendu).

Deux choses que tout flipper devrait intégrer. Premièrement, l''EIP-2981 ne fait que *signaler* une royalty ; il ne l''*impose* pas. Le fait que la royalty soit réellement payée dépend de la politique de la place de marché, et le secteur a passé 2022-2023 à rendre la plupart des royalties optionnelles. Ne modélisez pas vos rendements en supposant qu''une royalty sera honorée au prochain saut — elle pourrait ne pas l''être. Deuxièmement, les royalties jouent dans les deux sens pour un flipper : une royalty que vous payez à la sortie est un coût réel sur votre marge, et tout frais de plateforme s''empile par-dessus. Le guide d''OpenSea note que la vitrine [typically charges a 1% fee to the seller](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller) (facture généralement des frais de 1 % au vendeur), et les revenus du créateur, quand ils s''appliquent, sortent eux aussi de votre produit de vente. Lisez le détail des frais que la place de marché affiche avant de confirmer — ce sont des estimations de *votre* net, et c''est le chiffre qui décide si le flip en valait la peine.

## Pièges du gas et des arnaques à éviter

![Illustration éditoriale d''un portefeuille protégé sous un dôme de verre avec un bouclier, entouré de dangers signalés par des drapeaux d''avertissement : une pompe à essence qui goutte une pièce, un hameçon de phishing qui accroche un document d''approbation de signature, et un presse-papiers affichant une adresse substituée](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

La liquidité on-chain est réelle, mais elle s''accompagne d''une nouvelle surface de défaillance. Les deux grandes sont le gas et la fraude.

**Le gas.** Ethereum facture le calcul. D''après ethereum.org, [Gas refers to the unit that measures the amount of computational effort required to execute specific operations on the Ethereum network](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort) (le gas désigne l''unité qui mesure la quantité d''effort de calcul nécessaire pour exécuter des opérations spécifiques sur le réseau Ethereum), et il se paie en ETH. Pour un nom à quatre chiffres un jour de congestion, le gas de l''approbation plus le règlement peut représenter une part significative de votre marge — et sur un nom de faible valeur, il peut dépasser entièrement la vente. Deux défenses : faites votre approbation quand le réseau est calme, et envisagez de mettre en vente sur une chaîne à plus faibles frais. C''est une des raisons pour lesquelles les domaines tokenisés sur Base, et pas seulement sur le mainnet Ethereum, comptent pour les flippers qui travaillent des noms plus modestes.

**Les arnaques.** Le monde on-chain a son propre catalogue d''escroqueries, et les NFT de domaine y sont pleinement concernés :

- **Substitution d''adresse de portefeuille.** Des malwares et des pirates du presse-papiers remplacent silencieusement une adresse collée. Vérifiez toujours les premiers et derniers caractères de toute adresse d''acheteur ou de destinataire contre une seconde source avant de signer.
- **Signatures d''« approbation » malveillantes.** Une fausse place de marché ou un site de phishing peut vous demander de signer une approbation qui accorde à un contrat un pouvoir étendu sur vos jetons. Si vous ne comprenez pas exactement ce qu''une signature autorise, ne la signez pas. Traitez toute demande d''approbation inattendue comme hostile.
- **Mises en vente contrefaites.** Les arnaqueurs frappent des jetons sosies et les mettent en vente comme s''ils étaient le véritable domaine tokenisé. Les acheteurs devraient vérifier l''adresse du contrat contre celle publiée par l''émetteur ; les vendeurs devraient s''assurer que leur mise en vente authentique est bien celle que les acheteurs trouvent. C''est en partie pour cela que la garde et la provenance comptent — voir [récupérer un domaine tokenisé après la perte d''un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) et l''argumentaire en faveur d''une configuration [multi-signature](/fr/glossary/multi-sig/) dans [les portefeuilles multi-sig améliorent-ils vraiment la sécurité](/fr/blog/do-multisig-wallets-actually-improve-security/).
- **Faux « support ».** Personne de légitime ne vous contactera en premier en message privé pour réclamer une phrase de récupération ou une signature de « validation ». La phrase de récupération ne quitte jamais votre contrôle. Point final.

Le fil conducteur : le règlement on-chain retire le risque de contrepartie de l''*échange* et le remplace par un risque opérationnel dans *votre portefeuille*. L''agent de séquestre a disparu, et avec lui l''humain qui rattrapait jadis un transfert avec une coquille. Cette responsabilité vous incombe désormais.

## Où cela laisse un flipper

Vendre un domaine en tant que NFT transforme un nom en quelque chose de véritablement liquide : un jeton ERC-721 que vous pouvez mettre en vente sans gas, régler atomiquement, réserver à un acheteur précis et déplacer à travers un écosystème de places de marché profond plutôt que sur le marché secondaire d''un seul registrar. Le face-à-face du séquestre qui définit les ventes traditionnelles se dissout en grande partie. Ce qu''il exige en retour, c''est une littératie on-chain — savoir ce que vous signez, ce que coûtera le gas, et quelles contreparties sont réelles.

Pour la vue d''ensemble sur la façon dont les noms tokenisés changent l''économie de l''échange, le hub sur le [domain flipping](/fr/blog/domain-flipping/) est le point de départ, et [pourquoi tokeniser les domaines](/fr/blog/why-tokenize-domains/) plaide pour l''ajout de la couche on-chain en premier lieu. Si vous voulez tenter une vente de bout en bout sur un véritable nom résoluble dans un navigateur, [Namefi](https://namefi.io) est conçu exactement pour cela — un `.com` tokenisé que vous pouvez mettre en vente et régler on-chain pendant que le DNS continue de se résoudre à travers la passation.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces articles pour nous instruire nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, propres à une zone géographique, ou tout simplement fausses. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n''est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un médium. En bref : **DOYR - Do Your Own Research** (faites vos propres recherches). Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Documentation OpenSea — [Seaport (protocole de place de marché ; propulse OpenSea ; modèle offre/contrepartie)](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [How to sell NFTs (réserver à un acheteur précis ; qui paie le gas ; 1 % de frais vendeur)](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721 (standard de jeton non fongible sur Ethereum)](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Ethereum Improvement Proposals — [EIP-2981 (norme de royalty NFT)](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- Documentation ENS — [Tarification d''enregistrement `.eth` selon la longueur (5 $ / 160 $ / 640 $ par an)](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [Gas et frais (définition du gas)](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
