---
title: "ENS vs Unstoppable vs domaines DNS tokenisés"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS vs Unstoppable Domains vs DNS ICANN tokenisé, comparés sur la résolvabilité en navigateur, les renouvellements et qui contrôle réellement le nom."
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS vs Unstoppable Domains', 'ENS vs domaines tokenisés', 'Unstoppable Domains vs ENS', 'comparaison des domaines web3', 'domaines DNS tokenisés', 'flipping de domaines ENS', 'domaines .eth', 'domaines .crypto', 'les domaines web3 se résolvent-ils dans les navigateurs', 'frais de renouvellement ENS', 'Unstoppable Domains sans renouvellement', 'ICANN vs domaines web3', 'qui contrôle un domaine web3', 'domaine tokenisé vs domaine web3', 'comparaison des domaines NFT']
relatedArticles:
  - /fr/blog/onchain-domain-flipping/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/ens-vs-dns-domain-flipping/
  - /fr/blog/onchain-domain-marketplaces-compared/
  - /fr/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /fr/topics/choosing-a-tld/
  - /fr/topics/domain-investing/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-investor-field-guide/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/web3/
---

Si vous flippez des noms on-chain, la première décision est de savoir quel type de « nom on-chain » vous échangez réellement. Les trois catégories que la plupart des gens mettent dans le même sac ne sont pas le même actif, et les différences décident si le nom se résout dans un navigateur, si vous devrez payer un renouvellement l''an prochain et qui le contrôle réellement. Ce guide compare les trois face à face : [ENS (Ethereum Name Service)](/fr/glossary/ens/) (`.eth`), [Unstoppable Domains](https://unstoppabledomains.com) (`.crypto`, `.x`, `.nft`) et les vrais domaines [DNS](/fr/glossary/dns/) ICANN tokenisés (les noms `.com`/`.io`/`.xyz` que vous pouvez [tokeniser](/fr/glossary/tokenize/) sur [Namefi](https://namefi.io)).

Ils se recoupent sur un point : chacun place la propriété du nom dans votre [portefeuille](/fr/glossary/wallet/) sous forme de jeton. Ils divergent sur tout ce qui compte pour la revente. Si vous ne devez retenir qu''une chose, retenez ceci : les noms ENS et Unstoppable vivent *en dehors* de la racine ICANN, tandis qu''un domaine DNS tokenisé *est* un domaine ICANN avec un jeton greffé dessus. Ce simple fait se répercute sur la résolvabilité, les renouvellements et le contrôle.

## Ce que chacun est réellement

![Illustration éditoriale de trois cartes de jetons-noms sur de petits piédestaux côte à côte — un jeton hexagonal de style .eth, un badge de nom Web3 aux coins arrondis et une carte classique de domaine ICANN à globe, sur un pied d''égalité](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS** est un système de nommage sur [Ethereum](/fr/glossary/ethereum/). La documentation officielle le décrit simplement : [ENS associe des noms lisibles par l''humain comme « alice.eth » à des identifiants lisibles par la machine](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names) tels que des adresses Ethereum, des hachages de contenu et des métadonnées. Un nom `.eth` est émis sous forme de jeton sur Ethereum, et vous [transférez votre nom exactement comme n''importe quel autre jeton ERC721](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token) — il s''agit donc, mécaniquement, d''un [NFT (Jeton Non Fongible)](/fr/glossary/nft/) [ERC-721 (norme NFT)](/fr/glossary/erc-721/). Surtout, `.eth` n''est pas délégué par l''ICANN ; c''est un espace de noms qu''ENS a créé on-chain.

**Unstoppable Domains** vend des noms nativement blockchain comme `.crypto`, `.x`, `.nft` et `.dao`. Ces [noms de domaine peuvent aussi être frappés sous forme de jeton non fongible (NFT) sur la blockchain Ethereum](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token), et l''entreprise les stocke dans votre portefeuille — sa documentation d''assistance indique que les [domaines Web3 sont stockés dans votre portefeuille crypto comme des actifs numériques (NFT) et vous appartiennent entièrement](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets). Comme `.eth`, ces TLD ne font pas partie de la racine ICANN.

**Les domaines DNS tokenisés** sont d''une nature différente. L''actif sous-jacent est un domaine ICANN ordinaire — `example.com`, `yourname.io` — enregistré via un [bureau d''enregistrement](/fr/glossary/registrar/) accrédité, avec un jeton on-chain frappé pour refléter sa propriété. Nous décortiquons les mécanismes dans [qu''est-ce que les domaines tokenisés](/fr/blog/what-are-tokenized-domains/), mais en bref : c''est un seul nom avec deux couches synchronisées, et non un nouvel espace de noms. Pour le cadrage plus large de la catégorie, voir [domaine tokenisé vs domaine web3](/fr/blog/tokenized-domain-vs-web3-domain/).

## Résolvabilité en navigateur : le nom fonctionne-t-il simplement ?

![Illustration éditoriale de trois fenêtres de barre d''adresse de navigateur empilées — celle du haut affiche une coche verte tandis que les deux autres nécessitent un petit plugin de passerelle en forme de pièce de puzzle avant de se résoudre](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

C''est la ligne de démarcation la plus nette, et pour un flippeur c''est souvent tout l''enjeu, car la résolvabilité est ce pour quoi la plupart des acheteurs finaux paient réellement.

Un `.com` tokenisé se résout partout où un `.com` normal le fait — tous les navigateurs, tous les clients de messagerie, tous les CDN et autorités de certification — parce qu''il *est* un `.com` normal. Rien de particulier n''est requis du visiteur.

Les noms ENS et Unstoppable ne franchissent pas cette barre par eux-mêmes. Unstoppable est franc sur le fait que ses noms ont besoin d''aide : [vous pouvez télécharger notre extension pour la résolution de domaines sur Chrome & Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download), et ils ne se résolvent nativement que dans une poignée de navigateurs crypto-friendly comme Brave et Opera. Les noms `.eth` d''ENS, c''est la même histoire dans les navigateurs standard sans résolveur, passerelle ni extension. Ce n''est pas une critique de l''ingénierie — c''est un choix de conception délibéré qui donne à ces systèmes la liberté d''itérer en dehors de l''ICANN. Mais cela change qui est votre acheteur : vous vendez principalement à un public [web3](/fr/glossary/web3/) et natif des portefeuilles, pas au marché général qui s''attend à ce qu''un nom se charge dans un Chrome ordinaire.

Une nuance à connaître : ENS jette un pont *vers* le DNS plutôt que de s''en éloigner. Sa documentation note qu''[ENS prend en charge les noms DNS, permettant aux utilisateurs d''importer des noms DNS dans ENS](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names) via [DNSSEC (Extensions de sécurité du DNS)](/fr/glossary/dnssec/). Ainsi, un propriétaire de `.com` peut projeter son vrai nom dans ENS — mais c''est le nom DNS qui assure la résolution dans l''internet ordinaire, ENS ajoutant une couche d''identité on-chain. Cela ne fait pas pour autant que `.eth` lui-même se résolve dans un navigateur standard.

## Renouvellements : devrez-vous payer l''an prochain ?

Le modèle de renouvellement est l''endroit où les trois divergent d''une manière qui touche directement votre coût de portage — et où un flippeur peut avoir une mauvaise surprise.

Les noms `.eth` d''ENS comportent des frais annuels. La documentation officielle du bureau d''enregistrement est explicite sur la tarification : [un `.eth` de 5 lettres ou plus vous coûtera 5 USD par an. Un de 4 lettres 160 USD par an, et un de 3 lettres 640 USD par an](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you), et [ces frais sont payés en ETH](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH). Si vous les manquez, il y a une période de grâce, après laquelle, selon ENS, [90 jours après l''expiration d''un nom (c''est-à-dire après la période de grâce), le nom entre dans une enchère premium temporaire](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires). Pour les noms `.eth` courts et précieux, le renouvellement est un poste de coût bien réel.

Unstoppable Domains commercialise le modèle inverse : un achat unique. Sa documentation indique que les domaines Web3 [ne peuvent pas vous être retirés, ne nécessitent pas de renouvellements et sont à vous pour la vie](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life). L''absence de facture annuelle est attrayante pour un flippeur en buy-and-hold, même si « pour la vie » est une affirmation sur l''intention du protocole, pas une garantie de l''ICANN — ces noms n''existent que tant que l''infrastructure de résolution qui les lit existe.

Les domaines DNS tokenisés suivent l''économie ICANN normale : vous payez le renouvellement annuel d''un bureau d''enregistrement, et les enregistrements de gTLD plafonnent à une durée de 10 ans. C''est un coût récurrent, mais c''est le même coût bien compris que tout investisseur en `.com` budgète déjà. La tokenisation n''ajoute pas un deuxième renouvellement — le jeton suit l''unique enregistrement DNS sous-jacent.

## Qui contrôle réellement le nom

![Illustration éditoriale de trois panneaux de contrôle dotés chacun d''une horloge de renouvellement et d''une clé — une clé entièrement tenue par la main d''un utilisateur, les deux autres s''enfonçant dans une haute tour de registre](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

Le terme « auto-conservation » est employé de façon vague pour les trois, alors soyez précis sur ce que signifie le contrôle à chaque couche.

Pour ENS et Unstoppable, le contrôle on-chain est véritablement le vôtre : détenez la [clé privée](/fr/glossary/private-key/), détenez le nom, sans qu''aucun bureau d''enregistrement ne puisse le récupérer via un ticket d''assistance. C''est le véritable attrait du remplacement de la [propriété custodiale](/fr/glossary/custodial-ownership/) par la garde via portefeuille. Le hic, c''est que « le nom » ne signifie quelque chose qu''à l''intérieur des systèmes de résolution qui l''honorent. Si vous contrôlez le jeton mais que les seuls endroits qui le résolvent sont une extension de navigateur et quelques dApps, votre contrôle est réel mais sa *portée* est limitée par l''adoption.

Pour un domaine DNS tokenisé, le contrôle est en couches. Le jeton dans votre portefeuille régit la propriété et le transfert on-chain ; le nom sous-jacent reste un vrai domaine ICANN, ce qui signifie qu''il demeure soumis au renouvellement, à la politique de l''ICANN et aux litiges [UDRP (Uniform Domain-Name Dispute-Resolution Policy)](/fr/glossary/udrp/) — les mêmes règles sous lesquelles vit chaque `.com`. Une plateforme de tokenisation réputée maintient les deux couches synchronisées, de sorte que transférer le jeton déplace le domaine, avec une continuité DNS pour que le site en ligne ne cligne pas pendant une passation. Vous obtenez un contrôle natif de portefeuille *et* un nom que tout l''internet reconnaît déjà. Le compromis est honnête : vous n''êtes pas « en dehors du système », car l''actif est un vrai domaine qui répond à des règles du monde réel. Nous approfondissons la question de la garde dans [récupérer un domaine tokenisé après la perte du portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/).

## Liquidité et lieux de vente

Parce que les trois sont des NFT de style [ERC-721 (norme NFT)](/fr/glossary/erc-721/) (ou quasiment), ils peuvent être listés sur les [places de marché (ex: OpenSea, Blur)](/fr/glossary/marketplace/) NFT et se transférer via un échange [atomique](/fr/glossary/atomic-transfer/) où l''acheteur paie et reçoit — sans agent de [séquestre](/fr/glossary/escrow/) tiers détenant l''actif au milieu de la transaction. Cette plomberie partagée est exactement ce qui rend les noms on-chain attrayants à flipper, et elle est traitée dans [comment les places de marché tokenisées remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

Les viviers d''acheteurs diffèrent toutefois. ENS possède le marché secondaire le plus profond des trois — des noms `.eth` premium se sont échangés contre des sommes sérieuses. CoinGecko rapporte que [le domaine crypto le plus cher jamais vendu était « paradigm.eth », qui s''est vendu 1,51 million de dollars (420 ETH) le 9 octobre 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for), et The Block a rapporté que [le domaine Ethereum Name Service (ENS) 000.eth a été acheté 300 ETH (315 000 dollars)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH). Ce sont de vrais chiffres, mais traitez-les comme des cas atypiques, de la même manière que `Voice.com` est un cas atypique dans le monde du DNS — ils vous disent qu''un plafond existe, pas ce qu''un nom typique rapporte. Tout chiffre de « prix plancher » que vous voyez cité est une estimation mouvante, pas un fait.

Les domaines DNS tokenisés puisent dans un univers d''acheteurs différent et plus vaste : quiconque veut un vrai domaine universellement résolvable *plus* une propriété native de portefeuille. C''est le public qui veut qu''un nom se charge dans n''importe quel navigateur, fasse tourner la messagerie et porte un certificat SSL — sans renoncer à la possibilité de le vendre en tant que NFT.

## Lequel flipper

Il n''y a pas de gagnant unique ; il y a une adéquation à votre acheteur.

- **Flippez ENS `.eth`** si vous vendez à un public crypto-natif qui valorise les noms courts numériques ou de mots comme identité on-chain, et que vous êtes à l''aise pour porter le renouvellement annuel sur tout ce qui vaut la peine d''être conservé.
- **Flippez les noms Unstoppable** si votre acheteur veut une identité web3 sans renouvellement, axée portefeuille, et que la résolvabilité dans les navigateurs standard n''est pas sa priorité. Voir [TLD web3 premium](/fr/blog/premium-web3-tlds/) pour la façon dont cet espace de noms est valorisé.
- **Flippez les domaines DNS tokenisés** si vous voulez le plus grand vivier d''acheteurs et un nom qui *fonctionne* — un vrai `.com`/`.io`/`.xyz` ICANN que vous pouvez détenir, programmer et vendre on-chain, pendant qu''il se résout pour tout le monde. Commencez par [comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/), et si vous comparez des plateformes, [choisir une plateforme de tokenisation de domaines](/fr/blog/choosing-a-domain-tokenization-platform/) passe en revue les critères.

Pour la vue d''ensemble sur les raisons pour lesquelles tout cela bat l''ancien modèle de séquestre et de confiance, le hub [flipping de domaines](/fr/blog/domain-flipping/) relie l''ensemble de la pile de compétences, et [pourquoi tokeniser des domaines](/fr/blog/why-tokenize-domains/) en couvre l''intérêt en profondeur. Quelle que soit la catégorie que vous échangez, sachez quel actif se trouve dans votre portefeuille avant d''annoncer un prix — car la résolvabilité, les renouvellements et le contrôle ne sont pas des détails, ce sont le produit.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces articles pour nous instruire et par commodité pour nos clients. Les informations ici peuvent être périmées, spécifiques à une zone géographique, ou tout simplement fausses. Nous faisons aussi des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n''est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **FVPR - Faites Vos Propres Recherches**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Documentation ENS — [Protocole ENS : associe des noms lisibles par l''humain à des adresses](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- Documentation ENS — [Bureau d''enregistrement ETH : les transferts `.eth` comme n''importe quel autre jeton ERC721 ; tarification annuelle (5 / 160 / 640 USD par an) ; frais payés en ETH ; grâce de 90 jours](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Documentation ENS — [ENS prend en charge l''importation de noms DNS via DNSSEC](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Assistance Unstoppable Domains — [Domaines Web3 stockés comme NFT dans votre portefeuille ; pas de renouvellements, à vous pour la vie ; extension de navigateur requise pour Chrome & Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap — [Unstoppable Domains frappés comme NFT sur la blockchain Ethereum](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research — [Les domaines crypto les plus chers : paradigm.eth vendu 1,51 million de dollars (420 ETH), 9 oct. 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block — [000.eth acheté 300 ETH (315 000 dollars), deuxième plus grosse vente ENS](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
