---
title: "Tokeniser votre .com pour le flipper : un guide pas à pas Namefi"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 39
format: guide
description: "Un guide pas à pas Namefi : faire passer un .com on-chain, garder le DNS opérationnel et le flipper sous forme de NFT avec un règlement atomique plutôt qu''un bras de fer autour du séquestre."
ogImage: ../../assets/tokenize-your-com-to-flip-it-og.jpg
keywords: ['tokeniser un .com pour le flipper', 'tokeniser votre com', 'flipper des domaines tokenisés', 'vendre un domaine sous forme de NFT', 'flipping de .com tokenisé', 'flipping de domaines on-chain', 'règlement atomique de domaine', 'place de marché de domaines tokenisés', 'continuité DNS domaine tokenisé', 'comment tokeniser un domaine pour le vendre', 'tokeniser et vendre avec namefi', '.com détenu en portefeuille', 'domaine ERC-721', 'liquidité des domaines tokenisés', 'flipper un domaine com on-chain']
---

La plupart des flips d'un `.com` se terminent dans la même fébrilité : l'acheteur ne veut pas payer avant que le nom ne bouge, le vendeur ne veut pas transférer le nom avant d'être payé, et un agent de [séquestre](/fr/glossary/escrow/) se tient au milieu en gardant l'argent pendant qu'un transfert chez le registraire se finalise sur plusieurs jours. Ce bras de fer est la taxe de friction de chaque vente à forte valeur. Tokeniser d'abord le `.com` change la forme de toute la transaction : le nom devient un jeton que vous détenez dans un [portefeuille](/fr/glossary/wallet/), et la vente devient un unique échange on-chain plutôt qu'un transfert à plusieurs parties étalé sur plusieurs jours.

Voici un guide pratique de ce parcours sur [Namefi](https://namefi.io) — faire passer on-chain un `.com` que vous possédez déjà, le garder résolu partout, puis le mettre en vente et le régler sous forme de [NFT](/fr/glossary/nft/). Il s'inscrit dans le playbook plus large du [flipping de domaines](/fr/blog/domain-flipping/) et dans le pilier du [flipping de domaines on-chain](/fr/blog/onchain-domain-flipping/). Si vous voulez le *pourquoi* avant le *comment*, commencez par [pourquoi tokeniser les domaines on-chain](/fr/blog/why-tokenize-domains/).

## Pourquoi flipper un .com tokenisé plutôt qu'un .com classique

Un `.com` traditionnel est bien réel, mais vous ne le détenez jamais réellement — vous détenez un compte chez un [bureau d'enregistrement](/fr/glossary/registrar/) dont la base de données dit que vous contrôlez le nom. Vendre implique un mouvement de compte à compte ou de registraire à registraire que le registraire arbitre, avec un séquestre qui comble le déficit de confiance entre les deux.

La tokenisation transforme ce compte en un [jeton](/fr/glossary/tokenize/) dont vous assurez vous-même la conservation. Le nom est représenté par un NFT selon la norme [ERC-721](/fr/glossary/erc-721/), que la spécification d'Ethereum décrit comme une [API standard pour les NFT au sein de contrats intelligents](https://eips.ethereum.org/EIPS/eip-721#:~:text=standard%20API%20for%20NFTs) — et dont l'abstract même la présente comme une interface standard pour les [jetons non fongibles, aussi appelés titres (« deeds »)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). Ce mot, « titres » (« deeds »), c'est tout l'enjeu : le jeton est le titre de propriété du nom, dans votre portefeuille, et non un reçu pour un enregistrement que quelqu'un d'autre conserve. Pour un flippeur, cela achète trois avantages concrets :

- **Le règlement se réduit à une seule transaction.** Paiement et transfert s'exécutent ensemble ou pas du tout, donc aucune des deux parties n'a à bouger en premier.
- **La liquidité est plus large.** Un `.com` tokenisé peut être mis en vente sur les [places de marché NFT](/fr/glossary/marketplace/) généralistes aux côtés de tout autre actif ERC-721, et pas seulement sur les marchés secondaires réservés aux domaines.
- **La provenance est publique.** Chaque transfert antérieur est auditable [on-chain](/fr/glossary/on-chain/), de sorte qu'un acheteur peut vérifier l'historique sans se fier à la parole d'une place de marché.

Surtout, rien de tout cela ne sacrifie ce que l'acheteur paie réellement dans un `.com`. Contrairement à un nom natif du Web3 comme un `.eth` [ENS](/fr/glossary/ens/) — qui vit en dehors de la racine [ICANN](/fr/glossary/icann/) et a besoin d'un résolveur ou d'une passerelle pour se charger dans un navigateur normal — un `.com` tokenisé reste un vrai domaine [DNS](/fr/glossary/dns/) qui se résout partout, avec e-mail et certificats fonctionnels. Cette distinction est la raison d'être même de ce guide ; nous la développons pleinement dans [ce que sont les domaines tokenisés](/fr/blog/what-are-tokenized-domains/) et [domaine tokenisé vs domaine Web3](/fr/blog/tokenized-domain-vs-web3-domain/). Ne confondez pas les deux : un `.com` ICANN tokenisé et un nom `.eth` se flippent sur les mêmes rails mais vendent des choses complètement différentes.

## Étape 1 : faire passer le .com on-chain

![Illustration éditoriale d'une carte de domaine en forme de globe entrant dans un portail de tokenisation et en ressortant sous forme de médaillon NFT à facettes, tandis qu'un globe illuminé en dessous continue de briller pour montrer que le DNS se résout toujours](../../assets/tokenize-your-com-to-flip-it-01-bring-onchain.jpg)

Le processus complet, écran par écran, se trouve dans [comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/) ; voici la forme générale pour un flippeur.

Vous connectez un portefeuille à conservation autonome sur [namefi.io](https://namefi.io) — ce portefeuille devient le propriétaire du [domaine tokenisé](/fr/glossary/tokenized-domain/), de sorte que quiconque le détient détient le nom. Vous ajoutez le `.com` que vous possédez déjà, Namefi vérifie l'éligibilité au regard des règles de transfert de l'ICANN et du registraire où il se trouve actuellement, et vous choisissez une voie. La plus courante est le transfert-puis-tokenisation : vous déplacez le domaine vers le partenaire registraire accrédité de Namefi à l'aide du [code d'autorisation](/fr/glossary/auth-code/) de votre registraire actuel, puis vous mintez le jeton. Certaines intégrations de registraires prennent en charge une voie sur place où le nom reste où il est et la couche on-chain est ajoutée par-dessus.

Deux remarques de calendrier qui comptent quand vous flippez sous échéance. Premièrement, la partie lente est le transfert chez le registraire, pas quoi que ce soit lié à la blockchain — prévoyez plusieurs jours à cause du flux inter-registraires de l'ICANN, et ne lancez pas une tokenisation la semaine où vous espérez conclure une vente. Deuxièmement, les noms récemment transférés peuvent se trouver dans une fenêtre de verrouillage de transfert ICANN et tout simplement ne pas pouvoir bouger encore, alors vérifiez l'éligibilité avant de promettre quoi que ce soit à un acheteur. Le mint lui-même — une unique confirmation de portefeuille qui paie le [gas](/fr/glossary/gas/) et fait atterrir le NFT — est l'étape *finale* et la plus rapide.

Une fois terminé, vous détenez deux couches synchronisées : l'enregistrement DNS / registraire traditionnel, et un jeton ERC-721 dans votre portefeuille qui représente la propriété. Transférez le jeton et le domaine suit.

## Étape 2 : le conserver comme un actif que vous comptez vendre

C'est l'étape qui n'a pas d'équivalent dans le flipping chez un registraire, et celle que les nouveaux flippeurs on-chain sous-estiment : une fois que le nom est un NFT, *c'est vous* le système de conservation. Un nom que vous prévoyez de garder des mois en attendant de trouver un acheteur ne devrait pas rester dans un portefeuille « chaud » que vous utilisez aussi pour vos transactions quotidiennes.

Un portefeuille matériel est le minimum. Pour les noms à plus forte valeur, un dispositif [multi-signature](/fr/glossary/multi-sig/) échange un peu de commodité contre une bien meilleure protection face à une clé unique compromise — même si la question de savoir si cela en vaut la peine pour vous est une vraie question que nous pesons dans [les portefeuilles multisig améliorent-ils vraiment la sécurité](/fr/blog/do-multisig-wallets-actually-improve-security/). Le revers de la détention de vos propres [clés en conservation autonome](/fr/glossary/custodial-ownership/), c'est qu'une clé perdue peut signifier un nom perdu, alors ayez un plan de récupération en place *avant* d'en avoir besoin — [récupérer un domaine tokenisé après la perte d'un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) couvre ce qui est possible et ce qui ne l'est pas. Une conservation saine fait aussi partie de l'argumentaire auprès d'un acheteur : un nom dont la chaîne de propriété est propre et auditable est plus facile à vendre qu'un nom dont vous ne pouvez pas prouver la provenance.

## Étape 3 : garder le DNS opérationnel pendant toute la vente

![Illustration éditoriale d'un médaillon NFT de propriété glissant de la main d'un vendeur vers celle d'un acheteur au-dessus d'une vitrine illuminée et ininterrompue avec un globe stable, montrant que le site reste en ligne pendant le changement de propriétaire](../../assets/tokenize-your-com-to-flip-it-02-dns-continuity.jpg)

Voici l'avantage qui sépare un `.com` tokenisé d'un nom `.eth`, et il vaut la peine d'être protégé délibérément. La tokenisation ne change pas la façon dont le domaine se résout — serveurs de noms, enregistrements A, MX, [DNSSEC](/fr/glossary/dnssec/) continuent tous de fonctionner, gérés depuis le tableau de bord Namefi ou délégués à votre fournisseur DNS existant. Nous détaillons exactement ce qui change et ce qui ne change pas dans [le DNS sur les domaines tokenisés](/fr/blog/dns-on-tokenized-domains/).

Pour un flippeur, **la continuité du DNS fait toute la différence entre une vente propre et un acheteur qui regarde un site en production s'éteindre en plein milieu de la transaction.** Un domaine tokenisé bien construit continue de se résoudre proprement tout au long du transfert, de sorte que lorsque la propriété du jeton change, le site web, l'e-mail et les certificats ne clignotent pas. Cette continuité est en soi un argument de vente : un acheteur qui voit le nom se résoudre d'un bout à l'autre a bien moins de raisons de négocier le prix à la baisse en invoquant le risque de transfert.

## Étape 4 : le mettre en vente sous forme de NFT

Mettre en vente un `.com` tokenisé est une action de place de marché, pas une page d'atterrissage « à vendre » sur un domaine parqué. Vous fixez un prix d'achat immédiat ou ouvrez une [enchère](/fr/glossary/auction/) directement sur une place de marché NFT, et la mise en vente est elle-même un ordre signé que n'importe quel acheteur peut exécuter. Parce que l'actif est un jeton ERC-721 standard, votre visibilité n'est pas limitée aux personnes qui fréquentent les marchés secondaires réservés aux domaines — le nom se trouve dans les mêmes lieux que tout autre NFT. Nous parcourons les options de mise en vente dans [vendre des domaines sous forme de NFT](/fr/blog/selling-domains-as-nfts/), et comparons les endroits où mettre en vente dans [les places de marché de domaines on-chain comparées](/fr/blog/onchain-domain-marketplaces-compared/).

Vous gardez aussi l'option d'un tunnel de page de vente traditionnel pour un nom tokenisé. La différence est purement au moment de conclure : la transaction se règle par un échange de jetons plutôt que par un transfert via séquestre, ce qui nous amène à la récompense.

## Étape 5 : régler sans bras de fer autour du séquestre

![Illustration éditoriale d'un acheteur et d'un vendeur échangeant un médaillon-jeton et une pile de pièces à travers deux engrenages imbriqués, la place de l'agent de séquestre intermédiaire restant visiblement vide entre eux](../../assets/tokenize-your-com-to-flip-it-03-atomic-settlement.jpg)

C'est ici que la plomberie on-chain prouve son utilité. Les protocoles de place de marché conçus pour les NFT permettent au paiement et au transfert de se produire de façon atomique — ensemble ou pas du tout. Le protocole d'ordres d'OpenSea, Seaport, se décrit comme un [protocole de place de marché pour acheter et vendre des NFT en toute sécurité et de façon efficace](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), et l'effet pratique est que le paiement de l'acheteur et votre transfert de jeton s'échangent en une seule étape de règlement. Aucun agent tiers ne détient l'actif en plein milieu de la transaction ; le contrat impose l'échange.

Pour votre `.com` tokenisé, le transfert du jeton *est* le transfert du titre, et Namefi maintient l'enregistrement DNS sous-jacent synchronisé de sorte que l'acheteur se retrouve à contrôler un domaine réel et résolu — et non un simple NFT pointant vers le vide. Ce mécanisme unique est ce que nous entendons quand nous disons que les places de marché tokenisées [remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/) ; cet article détaille l'arithmétique de la confiance. Aucune des parties n'a bougé en premier, aucun agent n'a gardé l'argent, et tout le règlement qui prenait autrefois des jours de séquestre prend désormais une seule transaction confirmée.

## Un regard réaliste sur l'économie

La tokenisation ne change pas le calcul de fond du flipping : cela reste un jeu de portefeuille, pas un ticket de loterie. La plupart des noms que vous détenez ne se vendront pas, et un petit nombre de bonnes ventes finance le coût de portage du reste. Faire passer un nom on-chain élargit votre vivier d'acheteurs et supprime la friction du règlement, mais cela ne fabrique pas de la demande pour un nom dont personne ne veut. Une [évaluation](/fr/blog/onchain-domain-flipping/) lucide décide toujours si un flip fonctionne.

Il y a aussi une pile de coûts à garder honnête. Vous payez les frais de renouvellement habituels du registraire indépendamment de la tokenisation, quelques dollars de gas pour minter (Base est moins cher que [Ethereum](/fr/glossary/ethereum/) en L1), et les frais de protocole de Namefi pour le service de tokenisation — tout cela affiché sur l'écran de confirmation avant que vous ne vous engagiez. Si l'écart entre votre prix d'entrée et votre prix de vente réaliste ne couvre pas confortablement ces coûts, tokeniser un nom marginal ne fait qu'ajouter des étapes. Tokenisez les noms qui valent la peine d'être flippés, pas chaque nom que vous détenez.

Un élément de contexte à garder en vue : le potentiel sur les excellents `.com` est réel mais rare. La vente record reste `Voice.com`, où, selon le registre `.nl` SIDN, [le fournisseur blockchain Block.one a payé 30 millions de dollars américains](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid) pour le nom — encore aujourd'hui, note SIDN, [la plus grande somme publiquement divulguée jamais payée pour un nom de domaine](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=the%20highest%20publicly%20disclosed%20sum). C'est une valeur aberrante qui survit dans les gros titres précisément parce qu'elle est rare, pas un business plan.

## Où Namefi s'inscrit

La version propre de ce flip — titre détenu en portefeuille, règlement atomique, pas de bras de fer autour du séquestre, et un nom qui continue de se résoudre d'un bout à l'autre — est exactement le flux de travail que [Namefi](https://namefi.io) est conçu pour offrir aux *vrais* domaines ICANN. La propriété tokenisée rend le contrôle d'un `.com` auditable et transférable comme un NFT, tandis que la continuité du DNS préserve la résolvabilité universelle que les acheteurs paient réellement. Pour faire entrer dans ce modèle un nom que vous possédez déjà, le pas-à-pas est [comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/) ; pour comparer d'abord les fournisseurs, voyez [choisir une plateforme de tokenisation de domaines](/fr/blog/choosing-a-domain-tokenization-platform/).

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou de quelque autre nature professionnelle que ce soit.** Nous écrivons ces articles pour nous instruire nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, propres à une zone géographique, ou tout simplement erronées. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre style, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DOYR - Do Your Own Research (faites vos propres recherches)**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard (« API standard pour les NFT » ; NFT « aussi appelés titres / deeds »)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea — [Seaport (protocole de place de marché pour acheter et vendre des NFT en toute sécurité et de façon efficace)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- SIDN — [Voice.com vendu pour 30 millions USD (Block.one, 2019 ; plus grande vente de domaine publiquement divulguée)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid)
