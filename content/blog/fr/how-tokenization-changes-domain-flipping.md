---
title: "Comment la tokenisation transforme le flipping de domaines"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 34
format: explainer
description: "Comment le passage d''un domaine on-chain redéfinit le flipping — propriété vérifiée, règlement atomique et transfert programmable face au lent marché secondaire des registrars."
ogImage: ../../assets/how-tokenization-changes-domain-flipping-og.jpg
keywords: ['flipping de domaines tokenisés', 'flipping de domaines on-chain', 'flipper des domaines tokenisés', 'flipping de domaines NFT', 'règlement atomique de domaine', 'vendre des domaines en NFT', 'place de marché de domaines tokenisés', 'flipping de domaines web3', 'domaine ERC-721', 'transfert de domaine on-chain', 'conservation de domaine tokenisé', 'propriété de domaine programmable', 'alternative au séquestre de domaine', 'flipper des domaines on-chain', 'revente de domaine tokenisé']
relatedArticles:
  - /fr/blog/tokenize-your-com-to-flip-it/
  - /fr/blog/onchain-domain-flipping/
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/selling-domains-as-nfts/
  - /fr/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-investing/
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

L''essentiel du travail dans le [flipping de domaines](/fr/blog/domain-flipping/) n''a rien à voir avec le nom lui-même. Vous le sourcez, l''évaluez, le protégez et trouvez un acheteur — puis vient l''étape que personne n''apprécie : déplacer réellement l''actif et se faire payer sans qu''aucune des deux parties ne se fasse avoir. Cette étape de règlement est lente, manuelle et repose sur la confiance entre inconnus. La tokenisation est le changement qui la réécrit.

Faire passer un domaine on-chain ne rend pas un mauvais nom bon, ni un bon nom bon marché. Ce qu''elle change, c''est la *mécanique* de l''échange — comment vous vérifiez ce que vous achetez, comment vous le détenez, comment il circule et comment l''argent est réglé. Cet article parcourt les quatre points du cycle de vie d''un flip où la tokenisation change réellement le travail : acquisition, conservation, transfert et revente. Si l''idée sous-jacente vous est nouvelle, commencez par [ce que sont les domaines tokenisés](/fr/blog/what-are-tokenized-domains/) ; et si vous voulez le guide approfondi du trader, le pilier du cluster est le [flipping de domaines on-chain](/fr/blog/onchain-domain-flipping/).

## D''abord, ce que « on-chain » veut vraiment dire ici

La précision compte, car trois choses différentes sont regroupées sous l''étiquette « domaines blockchain » alors qu''il ne s''agit pas du même actif.

Les noms [ENS (Ethereum Name Service)](/fr/glossary/ens/) comme `vitalik.eth` et les noms [de type Unstoppable](/fr/blog/ens-vs-unstoppable-vs-tokenized-dns/) comme `brand.crypto` vivent entièrement on-chain, en dehors de la racine [ICANN](/fr/blog/what-are-tokenized-domains/). Ils ne se résolvent pas dans un navigateur classique sans un résolveur ou un pont. Un **domaine tokenisé**, en revanche, est un véritable domaine ICANN — un `.com`, `.xyz` ou `.io` qui fonctionne dans n''importe quel navigateur — dont la propriété est *aussi* représentée par un jeton, généralement un [NFT (Jeton Non Fongible)](/fr/glossary/nft/), dans votre [portefeuille](/fr/glossary/wallet/). L''enregistrement [DNS](/fr/glossary/dns/) et le jeton on-chain restent synchronisés, de sorte que le nom continue de se résoudre comme il l''a toujours fait, tandis que la propriété devient native du portefeuille. La différence entre ces catégories est traitée dans [domaine tokenisé vs domaine web3](/fr/blog/tokenized-domain-vs-web3-domain/), et c''est la distinction sur laquelle repose tout cet article : quand nous disons que le flipping change, nous parlons du flipping de *vrais* domaines qui portent une couche de propriété on-chain — et non de l''échange d''un espace de noms parallèle.

Le standard de jeton derrière l''essentiel de tout cela est [ERC-721 (norme NFT)](/fr/glossary/erc-721/), l''interface Ethereum qui, selon la spécification d''origine, [permet l''implémentation d''une API standard pour les NFT au sein des smart contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts). Cette « API standard » est le héros discret de toute l''histoire : parce qu''un domaine tokenisé parle la même interface que n''importe quel autre NFT, chaque portefeuille, place de marché et [smart contract](/fr/glossary/smart-contract/) qui gère déjà les NFT peut gérer votre domaine sans aucune intégration sur mesure.

## Acquisition : acheter un nom que vous pouvez réellement vérifier

![Illustration éditoriale d''une loupe révélant un portefeuille contenant un jeton NFT de domaine, entouré d''un registre public de blocs et d''une piste de provenance transparente](../../assets/how-tokenization-changes-domain-flipping-01-verify.jpg)

Sur le marché secondaire des registrars, vérifier ce que vous achetez est une corvée. Vous faites confiance à une annonce de place de marché, à un enregistrement WHOIS qui peut être masqué par une protection de la vie privée et à la parole d''un vendeur qui prétend réellement contrôler le nom et le remettre. Vous ne savez pas vraiment que vous en êtes propriétaire avant qu''un [transfert inter-registrars](/fr/blog/how-tokenized-marketplaces-replace-escrow/) ne se finalise des jours plus tard.

On-chain, la propriété est un fait public. Le NFT du domaine se trouve à une adresse que n''importe qui peut lire ; le [smart contract](/fr/glossary/smart-contract/) qui l''a émis est auditable ; l''historique des transferts est là, sur l''explorateur de blocs. Avant de dépenser le moindre dollar, vous pouvez confirmer exactement quel portefeuille détient le nom, quel contrat le régit et s''il a été déplacé ou enveloppé dans quoi que ce soit d''inhabituel. C''est une véritable amélioration pour la diligence raisonnable — le genre de vérification de provenance que, sur le marché secondaire traditionnel, vous ne pouvez tout simplement pas mener vous-même. Cela compte surtout lorsque vous essayez d''évaluer un actif dont vous n''avez pas encore pris possession, et la provenance on-chain est un élément de plus pour étayer un prix défendable.

L''avertissement honnête : vérifier *le jeton* est facile, mais vous devez encore vérifier *le nom qui se cache derrière*. Un `.com` tokenisé ne vaut que ce que vaut le domaine DNS qu''il reflète, donc le statut de renouvellement, l''exposition à la politique de l''[ICANN](/fr/glossary/icann/) et le risque de marque ne disparaissent pas simplement parce que le titre est on-chain. La tokenisation rend la propriété lisible ; elle ne rend pas un nom légal à flipper.

## Conservation : détenir l''actif soi-même

Voici le changement structurel dont tout le reste découle. Dans le modèle traditionnel, vous ne détenez pas vraiment un domaine — vous détenez un *compte* chez un registrar qui détient le domaine pour vous. C''est la [propriété custodiale](/fr/glossary/custodial-ownership/) : si le compte est verrouillé, suspendu ou perdu, le nom l''est aussi, quel que soit le prix que vous avez payé.

Un domaine tokenisé se trouve dans votre propre portefeuille. Vous détenez la clé privée ; vous détenez l''actif. C''est le même modèle d''auto-conservation qui rend les actifs crypto portables, appliqué à un nom — et il coupe dans les deux sens, c''est la partie que les flippers sous-estiment. L''auto-conservation supprime le registrar comme point de défaillance unique, mais elle fait de *vous* le point de défaillance unique à la place. Perdez la clé et il n''y a aucune ligne d''assistance pour réinitialiser votre mot de passe.

Pour quiconque détient un portefeuille d''actifs d''une valeur significative, c''est un argument pour traiter la sécurité du portefeuille comme une compétence centrale du flipping, et non comme une réflexion après coup. Un [portefeuille multi-signature (multi-sig)](/fr/glossary/multi-sig/), où déplacer un actif nécessite plus d''une clé, est l''outil standard ici, même si, comme nous l''expliquons dans [les portefeuilles multi-signature améliorent-ils vraiment la sécurité](/fr/blog/do-multisig-wallets-actually-improve-security/), c''est un compromis, pas un bouclier magique. Et puisque l''auto-conservation signifie que la récupération vous incombe, connaître les options avant que le désastre ne frappe n''est pas négociable : voyez [récupérer un domaine tokenisé après la perte d''un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) pour savoir ce qui est réellement possible quand une clé disparaît.

## Transfert : des minutes, pas une semaine

![Illustration éditoriale opposant un lent transfert par registrar fait de jours de calendrier barrés et d''un cadenas à un transfert rapide on-chain où un NFT de domaine passe d''un portefeuille à un autre en un seul bloc confirmé](../../assets/how-tokenization-changes-domain-flipping-02-transfer.jpg)

C''est là que le contraste avec le monde des registrars est le plus saisissant, et là où réside réellement l''essentiel des frictions d''un flip.

Déplacer un domaine d''un propriétaire à un autre à l''ancienne est régi par une politique de transfert assortie de véritables délais d''attente intégrés. Lorsque vous enregistrez un domaine gTLD ou que vous le transférez à un nouveau registrar, les règles de l''ICANN le verrouillent : les registrars doivent imposer un verrou qui empêchera [tout transfert vers un autre registrar pendant soixante (60) jours](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days) suivant certains changements de propriété. Même un transfert inter-registrars normal fonctionne avec des codes d''autorisation, des confirmations par e-mail et une fenêtre de finalisation de plusieurs jours. Rien de tout cela n''est malveillant ; cela existe pour combattre le détournement. Mais c''est de la friction, et la friction tue les flips qui dépendent de la rapidité.

Un transfert on-chain est une seule transaction. Le jeton passe d''un portefeuille à un autre et se confirme dans un bloc ; la plateforme maintient l''enregistrement côté DNS synchronisé, de sorte que le nom ne cesse jamais de se résoudre. ENS fait le même constat à propos de ses propres noms — les utilisateurs peuvent interagir avec le registre pour transférer un nom [exactement comme avec n''importe quel autre jeton ERC721](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token) — et les domaines ICANN tokenisés héritent de cette propriété exacte. Pour un flipper, « le transfert est une transaction » signifie qu''une transaction peut se conclure dans la session même où elle est convenue, au lieu que l''acheteur et le vendeur surveillent un transfert de registrar pendant une semaine.

## Revente : le règlement atomique remplace le séquestre

![Illustration éditoriale d''un échange atomique où une pièce de monnaie et un jeton NFT de domaine s''échangent simultanément dans une seule boucle, avec un agent de séquestre barré et mis de côté comme désormais inutile](../../assets/how-tokenization-changes-domain-flipping-03-atomic.jpg)

La plus grande chose que la tokenisation change dans le flipping, c''est la manière dont l''argent est réglé.

L''impasse classique de toute vente de domaine est l''ordre de confiance : le vendeur ne veut pas transférer avant d''être payé, l''acheteur ne veut pas payer avant de recevoir le nom. La solution traditionnelle est le [séquestre](/fr/glossary/escrow/) — un tiers neutre détient les fonds, les libère une fois le transfert finalisé et prélève une commission (couramment quelques pour cent) pour combler l''écart. Cela fonctionne, mais c''est lent et cela coûte de l''argent à chaque échange.

On-chain, cet écart peut être comblé mécaniquement. Le paiement et le transfert de l''actif se produisent dans la même transaction grâce à un [transfert atomique](/fr/glossary/atomic-transfer/) : soit les fonds de l''acheteur *et* le NFT du domaine se déplacent tous les deux, soit rien ne se déplace du tout. Il n''y a aucune fenêtre où l''une des parties est exposée, donc il n''y a rien qu''un agent de séquestre puisse combler. Nous parcourons toute la mécanique dans [comment les places de marché tokenisées remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/), mais le message clé pour un flipper est simple : vous supprimez une commission, un délai et une contrepartie de chaque vente.

Parce qu''un domaine tokenisé est un NFT standard, il s''inscrit aussi sur une infrastructure qui existe déjà. Vous pouvez le [vendre en NFT](/fr/blog/selling-domains-as-nfts/) sur des places de marché généralistes — OpenSea, qui est devenue [l''une des plus grandes places de marché de NFT](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces), en est l''exemple évident — aux côtés de plateformes spécialisées dans les domaines. Les compromis entre ces plateformes méritent d''être étudiés avant de publier une annonce ; [comparatif des places de marché de domaines on-chain](/fr/blog/onchain-domain-marketplaces-compared/) est l''endroit pour le faire. La conséquence pratique est une plus grande surface de [liquidité](/fr/glossary/domain-trading/) : un seul actif, listable en de nombreux endroits, réglé sans intermédiaire.

## Propriété programmable : la partie sans équivalent traditionnel

Tout ce qui précède a un analogue dans le monde des registrars que la tokenisation rend plus rapide ou moins cher. Pas cette dernière.

Parce que le domaine est un actif de type [smart contract](/fr/glossary/smart-contract/), la propriété devient programmable. Un nom peut servir de garantie pour un prêt, être vendu via une enchère on-chain dont les règles sont appliquées par le code, [fractionné](/fr/glossary/domain-trading/) entre plusieurs détenteurs ou loué selon des conditions qui s''exécutent automatiquement. Aucun de ces schémas n''existe sur le marché secondaire traditionnel, où un domaine n''est qu''une entrée dans une base de données de registrar qui ne peut être qu''achetée, vendue ou pointée quelque part. Pour un flipper qui réfléchit au-delà du simple « acheter bas, vendre haut », la programmabilité ouvre des options de financement et de structuration qui n''étaient auparavant accessibles qu''à ceux qui pouvaient se payer des avocats et des contrats sur mesure.

C''est aussi la partie la plus en amont de sa courbe d''adoption, alors traitez les cas d''usage exotiques comme émergents plutôt que matures. Les gains fiables et disponibles dès aujourd''hui sont les quatre premiers : acquisition vérifiable, auto-conservation, transfert rapide et règlement sans séquestre.

## Ce qui ne change pas

Il vaut la peine d''être franc sur les limites, car la tokenisation est parfois survendue. Les parties difficiles du flipping restent difficiles. Vous devez toujours sourcer des noms qui valent la peine d''être achetés, les évaluer honnêtement, éviter les pièges de marques et — surtout — trouver un acheteur. Un nom tokenisé dont personne ne veut est exactement aussi invendable qu''un nom détenu chez un registrar dont personne ne veut ; la vente médiatisée de `Voice.com`, qui a atteint [30 millions de dollars américains](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com), portait sur la demande pour le nom, pas sur les rails sur lesquels elle s''est réglée. La tokenisation ne fabrique pas de demande. Elle supprime la friction des échanges que la demande soutient déjà.

Si vous possédez déjà un `.com` et voulez ressentir la différence par vous-même, la voie d''accès la plus simple est de tokeniser un nom que vous contrôlez et de faire passer une vente par les nouveaux rails — voyez [comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/) pour le pas-à-pas, et [choisir une plateforme de tokenisation de domaine](/fr/blog/choosing-a-domain-tokenization-platform/) au moment de décider où le faire. Des plateformes comme [Namefi](https://namefi.io) gardent la couche DNS pleinement fonctionnelle tout du long, de sorte que le nom continue de fonctionner comme un domaine pendant que vous gagnez la mécanique on-chain décrite ci-dessus.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou toute autre forme de conseil professionnel.** Nous écrivons ces articles pour nous instruire nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, propres à une région, ou tout simplement fausses. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou, si ce n''est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un médium. En bref : **DOYR - Do Your Own Research** (faites vos propres recherches). Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Ethereum Improvement Proposals — [EIP-721 : Non-Fungible Token Standard (API standard pour les NFT)](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts)
- Documentation ENS — [Le registrar .eth (transférer un nom exactement comme n''importe quel autre jeton ERC721 ; frais d''enregistrement)](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token)
- DNSimple — [Verrou ICANN de 60 jours après un changement de titulaire (politique de verrouillage des transferts)](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days)
- Wikipédia — [OpenSea (l''une des plus grandes places de marché de NFT)](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces)
- SIDN — [Voice.com vendu pour 30 millions USD (Block.one, 2019)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com)
