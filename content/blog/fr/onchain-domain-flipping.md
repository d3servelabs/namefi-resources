---
title: "Flipping de domaines onchain : trader des domaines ENS et tokenisés"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "Comment fonctionne le flipping de domaines onchain — trader des domaines ENS et tokenisés en tant qu'actifs détenus dans un portefeuille, liquides comme des NFT, et en quoi cela diffère du flipping via bureau d'enregistrement."
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['flipping de domaines onchain', 'flipper des domaines ENS', 'flipping de domaines tokenisés', 'trader des domaines tokenisés', 'flipping de domaines NFT', 'flipper des domaines web3', 'investissement dans les domaines ENS', 'place de marché de domaines NFT', 'vendre des domaines en tant que NFT', 'trading de domaines onchain', 'domaines ERC-721', 'domaines détenus en portefeuille', 'règlement atomique de domaine', 'liquidité des domaines tokenisés', 'flipping de domaines web3']
relatedArticles:
  - /fr/blog/tokenize-your-com-to-flip-it/
  - /fr/blog/how-tokenization-changes-domain-flipping/
  - /fr/blog/selling-domains-as-nfts/
  - /fr/blog/onchain-domain-marketplaces-compared/
  - /fr/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/tld/
  - /fr/glossary/icann/
  - /fr/glossary/dns/
  - /fr/glossary/web3/
---

Le flipping de domaines a une forme familière : acheter un nom à bas prix, trouver un acheteur qui en a besoin, le vendre à prix élevé. La version classique de cet échange passe par des [bureaux d'enregistrement](/fr/glossary/registrar/), des places de marché secondaires et un agent de séquestre qui détient l'argent le temps que le transfert s'effectue. Le flipping de domaines onchain repose sur le même instinct « acheter bas, vendre haut », déplacé sur une [blockchain](/fr/glossary/blockchain/), où le nom lui-même est un jeton que vous détenez dans un [portefeuille](/fr/glossary/wallet/) et que vous pouvez trader comme n'importe quel autre [NFT](/fr/glossary/nft/).

Ce seul changement — le nom devenu jeton — réécrit presque chaque étape de l'opération. La conservation, la mise en vente et le règlement cessent d'être des opérations au niveau d'un compte chez un bureau d'enregistrement et deviennent des transactions onchain que vous contrôlez directement. Ce guide explique ce qu'est réellement le flipping de domaines onchain, trace la distinction importante entre les deux types très différents de « nom onchain » que vous pouvez flipper, et parcourt tout l'arc de l'opération : acquérir, conserver, mettre en vente, régler. C'est le pilier onchain du playbook plus large du [flipping de domaines](/fr/blog/domain-flipping/).

## Ce que signifie « flipping de domaines onchain »

Dans un flip classique, la propriété réside dans la base de données d'un bureau d'enregistrement. Vous vous connectez à un compte, les registres du bureau d'enregistrement indiquent que vous contrôlez le nom, et le transmettre à un acheteur passe par un [transfert](/fr/glossary/atomic-transfer/) de compte à compte ou de bureau d'enregistrement à bureau d'enregistrement, médiatisé par le bureau d'enregistrement. L'actif est réel, mais vous ne le détenez jamais vous-même — vous détenez un compte qui pointe vers lui.

Le flipping onchain remplace ce compte par un [jeton](/fr/glossary/tokenize/). Le nom est représenté sous forme de NFT selon la norme [ERC-721](/fr/glossary/erc-721/), que la spécification d'Ethereum décrit comme une [API standard pour les NFT au sein de smart contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) — et que son propre résumé appelle une interface standard pour les [jetons non fongibles, aussi connus sous le nom de deeds (titres)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). Ce mot, « deeds » (titres), résume toute l'idée : le jeton est le titre de propriété du nom, qui se trouve dans votre portefeuille, et non un reçu pour un registre tenu par quelqu'un d'autre. Quiconque détient le jeton contrôle le nom, et transférer ce contrôle est un appel à un [smart contract](/fr/glossary/smart-contract/) plutôt qu'un ticket d'assistance.

C'est cette propriété qui explique pourquoi les noms onchain se tradent comme une classe d'actifs liquide. Ils sont mis en vente sur les mêmes [places de marché NFT](/fr/glossary/marketplace/) que l'art et les objets de collection, se règlent en quelques minutes et portent un historique de propriété public et auditable. Le flip lui-même ressemble moins à un transfert via bureau d'enregistrement qu'à du [trading de domaines](/fr/glossary/domain-trading/) sur des rails conçus pour les actifs numériques.

## Deux types de noms onchain — ne les confondez pas

![Illustration éditoriale de deux actifs onchain différents côte à côte — une puce d'identité de portefeuille avec un jeton face à un globe et un certificat de titre cerclé de NFT](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

La chose la plus importante à bien saisir avant de trader, c'est que « domaine onchain » recouvre deux actifs réellement différents qui se comportent différemment pour un flipper.

Le premier est le nom natif du [Web3](/fr/glossary/web3/), l'archétype étant l'[ENS](/fr/glossary/ens/) (`.eth`). Ces noms vivent entièrement sur Ethereum. Ils ne font pas partie de la racine [ICANN](/fr/glossary/icann/), donc `vitalik.eth` ne se résout pas dans un navigateur ordinaire sans résolveur ni passerelle. Leur valeur réside dans l'identité de portefeuille et la nomenclature crypto-native. L'ENS est aussi ouvertement un marché d'enregistrement : selon la documentation ENS, un [nom `.eth` de 5 lettres et plus vous coûtera 5 USD par an](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), les noms de quatre et trois lettres étant tarifés plus cher par conception, et une fois enregistré, un nom peut être déplacé [comme n'importe quel autre jeton ERC721](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token). Ce plancher d'enregistrement bas et transparent est exactement la raison pour laquelle les noms `.eth` courts et premium sont devenus un marché spéculatif à part entière.

Le second est le **domaine ICANN tokenisé** — un véritable `.com`, `.xyz` ou `.io` dont la propriété est reflétée sous forme de NFT tandis que le nom DNS sous-jacent continue de se résoudre partout. Comme l'explique notre article sur [ce que sont les domaines tokenisés](/fr/blog/what-are-tokenized-domains/), ce sont de vrais domaines DNS qui ont *aussi* une représentation onchain, et non un espace de noms parallèle. Pour un flipper, la distinction est concrète : un `.com` tokenisé porte la résolvabilité universelle, le support de la messagerie et des certificats de l'internet traditionnel, tandis qu'un nom ENS porte une utilité crypto-native mais a besoin d'une passerelle pour se comporter comme un site web. Les deux peuvent être flippés onchain ; ce ne sont pas le même produit, et un acheteur paie pour des choses différentes dans chaque cas. Nous comparons directement ces familles dans [domaine tokenisé vs domaine Web3](/fr/blog/tokenized-domain-vs-web3-domain/).

Une troisième catégorie — les TLD Web3 de plateformes comme Unstoppable Domains — se situe plus près de l'ENS que des noms ICANN tokenisés ; le guide sur les [TLD Web3 premium](/fr/blog/premium-web3-tlds/) couvre leur positionnement. Gardez les trois bien distincts et vous les évaluerez chacun correctement.

## En quoi cela diffère du flipping sur le marché secondaire des bureaux d'enregistrement

![Illustration éditoriale du règlement atomique — des pièces et un jeton NFT s'emboîtant comme des pièces de puzzle entre deux mains, avec un agent de séquestre grisé mis de côté](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

Les mécanismes divergent le plus nettement au moment du règlement, là où les flips traditionnels deviennent nerveux. Dans le monde des bureaux d'enregistrement, l'acheteur et le vendeur se font face dans une impasse : le vendeur ne veut pas transférer avant d'être payé, l'acheteur ne veut pas payer avant de recevoir le nom, et un agent de [séquestre](/fr/glossary/escrow/) tiers doit se tenir au milieu en détenant les deux côtés. Nous décortiquons ce flux de travail classique dans [le séquestre de domaine expliqué](/fr/blog/domain-escrow-explained/).

Onchain, cette impasse peut s'effondrer en une seule transaction atomique. Les protocoles de places de marché conçus pour les NFT font en sorte que le paiement et le transfert se produisent ensemble, ou pas du tout. Le protocole d'ordres d'OpenSea, Seaport, se décrit lui-même comme un [protocole de place de marché pour acheter et vendre des NFT de manière sûre et efficace](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), et l'effet pratique est que le paiement de l'acheteur et le jeton du vendeur s'échangent en une seule étape de règlement. Aucun agent ne détient l'actif en cours de transaction — le contrat impose l'échange. C'est le mécanisme auquel nous faisons référence lorsque nous disons que les places de marché tokenisées [remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

Les autres grandes différences :

- **La conservation vous appartient.** Au lieu d'un compte chez un bureau d'enregistrement, l'actif réside dans votre portefeuille. Cela élimine la dépendance à une plateforme et le risque de saisie de compte, mais vous confie tout le poids de la [gestion des clés](/fr/glossary/custodial-ownership/) — perdez les clés, perdez le nom.
- **La liquidité est plus large.** Un nom tokenisé peut être mis en vente sur des places de marché NFT généralistes aux côtés de tous les autres actifs ERC-721, et pas seulement sur des marchés secondaires spécifiques aux domaines, ce qui élargit le bassin de regards et d'offres.
- **La provenance est publique.** Chaque vente et chaque transfert antérieurs sont visibles onchain, de sorte qu'un acheteur peut vérifier l'historique sans avoir à se fier à la parole d'une place de marché — utile pour l'évaluation et pour prouver qu'un nom n'est pas volé.

## L'opération, étape par étape : acquérir, conserver, mettre en vente, régler

![Illustration éditoriale d'un flux de flip onchain en quatre étapes — une loupe sur une étiquette de nom, une clé et un portefeuille, une vitrine de place de marché, et un échange circulaire pièces-contre-jeton](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### Acquérir

Vous sourcez les noms onchain de la même manière que pour n'importe quel flip — en cherchant des actifs mal évalués — mais les canaux diffèrent. Les noms ENS proviennent du marché d'enregistrement ENS ou de places de marché NFT secondaires ; le plancher est transparent parce que n'importe qui peut lire les frais d'enregistrement onchain. Les domaines ICANN tokenisés proviennent de l'enregistrement ou de la [tokenisation d'un vrai `.com`](/fr/blog/how-to-tokenize-your-com/) que vous estimez déjà sous-évalué, ou de l'achat d'un domaine déjà tokenisé. La discipline est identique au reste du [trading de domaines](/fr/glossary/domain-trading/) : ne tombez pas amoureux d'un nom que personne n'achètera, et ne surpayez pas à l'entrée, car le prix d'entrée détermine toute votre marge.

### Conserver

C'est l'étape qui n'a pas d'équivalent dans le flipping via bureau d'enregistrement, et celle que les nouveaux flippers sous-estiment. Une fois que le nom est un NFT, c'est *vous* le système de conservation. Un hot wallet est pratique pour le trading actif mais c'est le plus exposé ; un portefeuille matériel ou un dispositif [multi-signature](/fr/glossary/multi-sig/) échange un peu de commodité contre une bien meilleure protection d'un nom que vous détenez pendant des mois. Savoir si le multi-sig est la bonne réponse est une vraie question — nous la pesons dans [les portefeuilles multi-sig améliorent-ils réellement la sécurité](/fr/blog/do-multisig-wallets-actually-improve-security/). Et parce qu'une clé perdue peut signifier un nom perdu, ayez un plan de récupération avant d'en avoir besoin ; [récupérer un domaine tokenisé après la perte d'un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) couvre ce qui est possible et ce qui ne l'est pas.

### Mettre en vente

Mettre en vente un nom onchain est une action de place de marché, et non une page de destination « à vendre » sur un domaine parqué. Vous fixez un prix d'achat immédiat fixe ou vous ouvrez une enchère directement sur une place de marché NFT, et la mise en vente est elle-même un ordre onchain (ou signé par la place de marché) que n'importe quel acheteur peut exécuter. Pour les domaines ICANN tokenisés, vous conservez aussi l'option d'un tunnel de vente classique — la différence étant que la conclusion passe par un échange de jetons plutôt que par une remise via séquestre. Pour les noms tokenisés en particulier, la [continuité DNS](/fr/blog/dns-on-tokenized-domains/) compte ici : un domaine tokenisé bien construit continue de se résoudre proprement tout au long du transfert, de sorte qu'un site en ligne ne tombe pas en panne en pleine vente.

### Régler

Le règlement est la récompense de toute cette plomberie onchain. L'acheteur exécute votre ordre, le paiement et le transfert de jeton s'exécutent ensemble, et la propriété se déplace en une seule transaction confirmée. Pour un nom ENS, c'est terminé là — le nouveau détenteur contrôle désormais le nom `.eth`. Pour un domaine ICANN tokenisé, le transfert de jeton est le titre de propriété, et la plateforme maintient l'enregistrement DNS sous-jacent synchronisé, de sorte que l'acheteur se retrouve à contrôler un véritable domaine résolvable. Dans les deux cas, aucune partie n'a eu à bouger en premier, et aucun agent n'a détenu l'actif entre-temps.

## À quoi ressemblent les chiffres

Le flipping onchain reste un jeu de portefeuille, et non une loterie — la plupart des noms que vous détenez ne se vendront pas, et les gains financent le portage. Mais les ventes phares montrent pourquoi la catégorie attire l'attention. Le nom ENS le plus cher vendu à ce jour, selon The Block, était [paradigm.eth, qui a été acheté en octobre 2021 pour 420 ETH (environ 1,5 million de dollars à l'époque)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH) ; le même rapport note que [000.eth a été acheté pour 300 ETH (315 000 $)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH) en juillet 2022.

Traitez-les comme des cas aberrants, et non comme un modèle économique — le même rappel à la réalité qui s'applique aux méga-ventes de `.com` s'applique doublement ici, avec la complication supplémentaire que les prix des noms onchain suivent la volatilité du marché crypto. Un plancher mesuré en ETH peut être divisé par deux en termes de dollars sans qu'un seul nom ne change de mains. Une évaluation lucide, et non le montage des temps forts, est ce qui maintient un portefeuille onchain dans le vert.

## Là où Namefi s'inscrit

La version épurée d'un flip onchain — titre détenu dans un portefeuille, règlement atomique, pas d'impasse de séquestre — est exactement le flux de travail que [Namefi](https://namefi.io) est conçu pour offrir aux *vrais* domaines ICANN. La propriété tokenisée rend le contrôle d'un `.com` auditable et transférable comme un NFT, tandis que la continuité DNS maintient le nom résolvable tout au long du transfert, de sorte qu'un flipper obtient la liquidité onchain sans renoncer à la résolvabilité universelle pour laquelle les acheteurs paient réellement. Si vous voulez faire entrer dans ce modèle un nom que vous possédez déjà, le pas-à-pas se trouve dans [comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/), et les compromis entre plateformes sont dans [choisir une plateforme de tokenisation de domaines](/fr/blog/choosing-a-domain-tokenization-platform/).

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces articles pour nous instruire et par commodité pour nos clients. Les informations ici peuvent être obsolètes, spécifiques à une zone géographique, ou tout simplement erronées. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, demandez sur Twitter, demandez sur Reddit, demandez à une IA, ou demandez à un médium. En bref : **DOYR - Do Your Own Research (faites vos propres recherches)**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Ethereum Improvement Proposals — [Norme de jeton non fongible ERC-721 (NFT « aussi connus sous le nom de deeds »)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Documentation ENS — [ETH Registrar (tarification d'enregistrement ; transfert comme un jeton ERC-721)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea — [Seaport (protocole de place de marché pour acheter et vendre des NFT de manière sûre et efficace)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block — [Le domaine ENS 000.eth se vend pour 300 ETH ; paradigm.eth reste la plus grande vente ENS à 420 ETH](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
