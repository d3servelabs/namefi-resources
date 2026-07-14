---
title: "Principales approches de mise à l’échelle blockchain : rollups, sidechains, canaux et sharding"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: "Guide pour comprendre la mise à l’échelle des blockchains : rollups optimistes, ZK rollups, sidechains, canaux de paiement, sharding et couches de disponibilité des données, comparés."
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['mise à l’échelle blockchain', 'solutions de mise à l’échelle blockchain', 'mise à l’échelle layer 2', 'rollups', 'rollup optimiste', 'zk rollup', 'sidechains', 'canaux de paiement', 'canaux d’état', 'sharding', 'disponibilité des données', 'trilemme de la scalabilité', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /fr/blog/blockchain-virtual-machines/
  - /fr/blog/blockchain-consensus-mechanisms/
  - /fr/blog/blockchain-privacy-technologies/
  - /fr/blog/blockchain-cryptographic-primitives/
  - /fr/blog/premium-web3-tlds/
relatedGlossary:
  - /fr/glossary/rollup/
  - /fr/glossary/optimistic-rollup/
  - /fr/glossary/zk-rollup/
  - /fr/glossary/data-availability/
  - /fr/glossary/layer-2/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
---

Le réseau principal Ethereum traite environ 15 transactions par seconde. Un réseau de paiement comme Visa en traite des dizaines de milliers. Cet écart explique pourquoi les blockchains doivent passer à l’échelle : il faut pouvoir effectuer davantage de travail sans demander à chaque participant de vérifier chaque transaction sur la chaîne de base. Ces dernières années, le secteur a convergé vers quelques approches distinctes — les [rollups](/fr/glossary/rollup/), les sidechains, les canaux de paiement et le sharding — qui arbitrent chacune différemment entre sécurité, décentralisation et coût.

Ce guide présente les principales approches de mise à l’échelle, explique le mécanisme de chacune et les compare côte à côte afin que la différence soit claire la prochaine fois qu’elles apparaîtront dans la documentation d’un projet.

---

## Le trilemme de la scalabilité

La formulation par Vitalik Buterin du **trilemme de la scalabilité** est le modèle mental sur lequel repose l’essentiel de ce domaine. Une blockchain recherche simultanément trois propriétés : « scalability: the chain can process more transactions than a single regular node... can verify », « decentralization: the chain can run without any trust dependencies on a small group of large centralized actors » et « security: the chain can resist a large percentage of participating nodes trying to attack it ». Or les conceptions traditionnelles n’en atteignent que deux sur trois ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin et le premier Ethereum ont privilégié décentralisation et sécurité plutôt que débit ; les chaînes à TPS élevé qui reposent sur un petit ensemble de validateurs puissants obtiennent la scalabilité et la sécurité mais sacrifient la décentralisation ; les conceptions naïves à chaînes multiples peuvent passer à l’échelle tout en restant décentralisées, mais deviennent peu sûres si un attaquant n’a besoin de compromettre qu’une seule chaîne.

Chaque approche ci-dessous répond en réalité à la même question : comment augmenter le débit sans abandonner les deux autres sommets du triangle ?

## Rollups : exécuter hors chaîne, régler sur chaîne

![Schéma vectoriel plat montrant de nombreux petits tickets de transaction converger vers un compacteur intitulé « Rollup Compressor », qui les comprime dans un cube de lots avant de le publier sur une chaîne de blocs liée de couche de base](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

Un **[rollup](/fr/glossary/rollup/)** exécute des transactions en dehors de la couche 1 (L1), puis publie un résumé compact — ainsi que les données de transaction sous-jacentes — sur la chaîne de base. L2BEAT, le principal outil de suivi de ces systèmes, définit les rollups comme des « L2s that periodically post state commitments to Ethereum », des engagements « validated by either Validity Proofs or... accepted optimistically and can be challenged via [a] Fraud Proof mechanism within a certain fraud proof window » ([l2beat.com](https://l2beat.com/scaling/summary)). Comme les données et l’engagement arrivent tous deux sur L1, n’importe qui peut reconstruire l’état du rollup à partir d’Ethereum seul. C’est ce qui permet à un rollup d’hériter de la sécurité de L1 sans demander aux utilisateurs de faire confiance à un nouvel ensemble de validateurs. C’est la technologie qui se trouve derrière les réseaux de [layer 2](/fr/glossary/layer-2/) avec lesquels la plupart des gens interagissent aujourd’hui : Base, Arbitrum, Optimism, zkSync et Starknet sont tous des rollups.

Les rollups se divisent en deux familles selon la manière dont ils prouvent la correction de leur exécution hors chaîne.

### Rollups optimistes

![Illustration vectorielle plate de deux portes côte à côte : une porte orange « Optimistic » avec une horloge de 7 jours et un drapeau représentant la fenêtre de preuve de fraude, et une porte verte « ZK » avec une coche verte instantanée de preuve de validité](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

Un [rollup optimiste](/fr/glossary/optimistic-rollup/) « assume[s] offchain transactions are valid and don't publish proofs of validity for batches of transactions » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). Les opérateurs regroupent les transactions, les exécutent hors chaîne et publient les données compressées sur Ethereum. Une fenêtre de contestation s’ouvre alors, pendant laquelle toute personne exécutant un nœud complet peut contester le lot avec une preuve de fraude ; le retrait de fonds de L2 vers L1 doit attendre que « the challenge period—lasting roughly seven days—elapses » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). Cette fenêtre d’une semaine explique pourquoi un retrait direct depuis un rollup optimiste prend environ une semaine, sauf si un fournisseur de liquidité tiers est utilisé pour une sortie plus rapide, moyennant des frais.

Les rollups optimistes n’ont besoin que d’un système de preuve de fraude, et non d’une chaîne complète de génération de preuves cryptographiques. Historiquement, cela a facilité la prise en charge de smart contracts généralistes. **Arbitrum**, **Optimism** et **Base** — le rollup de Coinbase, décrit par ethereum.org comme « an Optimistic Rollup built with the OP Stack » ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack)) — sont aujourd’hui les plus grands rollups optimistes en termes d’usage.

### ZK rollups

Un [ZK rollup](/fr/glossary/zk-rollup/) adopte l’approche opposée : au lieu de présumer la validité et d’autoriser une période de contestation, il soumet avec chaque lot une preuve de validité — une preuve cryptographique que la transition d’état du lot est correcte. Comme Ethereum vérifie cette preuve onchain, « there are no delays when moving funds from a ZK-rollup to Ethereum... because exit transactions are executed once the ZK-rollup contract verifies the validity proof » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). Les ZK rollups « can process thousands of transactions in a batch and then only post some minimal summary data to Mainnet » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)), avec des systèmes de preuve comme les zk-SNARK (preuves courtes, vérification rapide) ou les zk-STARK (transparents, sans configuration de confiance requise). **zkSync Era**, **Starknet** — « a general purpose ZK Rollup based on STARKs and the Cairo VM » ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM)) — et **Linea** sont des ZK rollups importants ; Polygon zkEVM et Scroll mettent également en œuvre une zkEVM afin d’exécuter des smart contracts Ethereum existants dans un environnement prouvable par ZK.

Le compromis : la génération de preuves de validité est coûteuse en calcul et, pour une équivalence EVM complète, techniquement plus difficile à construire qu’un système de preuve de fraude. C’est en partie pourquoi les rollups optimistes ont atteint l’adoption grand public en premier, même si les ZK rollups offrent une finalité plus rapide.

## Sidechains

Une **sidechain** est « a separate blockchain that runs independent of Ethereum and is connected to Ethereum Mainnet by a two-way bridge » et, contrairement à un rollup, « a sidechain uses a separate consensus mechanism and doesn't benefit from Ethereum's security guarantees » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). Voilà la différence fondamentale avec une layer 2 : une sidechain échange la sécurité héritée contre une liberté de conception indépendante et, en général, des frais plus faibles et des blocs plus rapides, car elle dépend de son propre ensemble de validateurs plutôt que d’Ethereum.

**Polygon PoS** en est l’exemple le plus connu. Sa propre page produit le décrit comme « Ethereum's most-used sidechain—battle-tested with billions in value secured, near-instant transactions, and sub-cent fees » ([polygon.technology](https://polygon.technology/polygon-pos)), protégé par son propre ensemble de validateurs en preuve d’enjeu plutôt que par celui d’Ethereum. **Gnosis Chain** (anciennement xDai) est une autre sidechain largement utilisée, avec Skale et Metis Andromeda. Comme vous faites confiance à un ensemble de validateurs différent, généralement plus petit, la sécurité d’une sidechain n’est jamais plus forte que cet ensemble. Il s’agit d’une garantie sensiblement différente de celle d’un rollup, où les états invalides peuvent en principe être détectés et annulés au moyen de données ancrées sur L1.

## Canaux d’état et de paiement

Un **canal d’état** permet à deux parties ou plus de traiter hors chaîne en verrouillant des fonds dans un contrat partagé et en échangeant directement des mises à jour signées. Ainsi, « channel peers can conduct an arbitrary number of offchain transactions while only submitting two onchain transactions to open and close the channel » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). Un canal de paiement en est la spécialisation pour les simples transferts de solde et « is best described as a 'two-way ledger' collectively maintained by two users » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). Les participants peuvent traiter entre eux autant de fois qu’ils le souhaitent, hors chaîne et instantanément, en touchant la chaîne de base uniquement pour ouvrir le canal (verrouiller une garantie) et le fermer (régler le solde final).

L’implémentation la plus connue est le **Lightning Network** de Bitcoin, décrit sur son propre site comme « a decentralized network using smart contract functionality in the blockchain to enable instant payments across a network of participants », construit à partir de « bidirectional payment channels » qui acheminent les paiements comme les paquets de données sur Internet ([lightning.network](https://lightning.network/)). Le revers : les canaux ne font passer à l’échelle que les transactions *entre des parties reliées par un chemin de canaux ouverts*, les fonds doivent être engagés à l’avance pour ouvrir un canal, et les réseaux de canaux nécessitent un routage de liquidité pour bien fonctionner à grande échelle. Rien de cela ne s’applique à un rollup généraliste capable d’exécuter des smart contracts arbitraires pour n’importe qui.

## Sharding et couches de disponibilité des données

![Schéma vectoriel plat de transactions réparties entre quatre voies de shards parallèles (Shard 1 à Shard 4), chacune traitant indépendamment sa propre chaîne de blocs, toutes alimentant une bande de couche de disponibilité des données en dessous](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

Le **sharding** répartit le travail de validation d’une blockchain entre plusieurs sous-ensembles parallèles (« shards ») de nœuds, afin qu’aucun nœud unique n’ait à traiter la charge transactionnelle de l’ensemble du réseau. Vitalik Buterin affirme que « sharding is a technique that gets you all three » sommets du trilemme à la fois ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)), en utilisant des comités de validateurs échantillonnés aléatoirement pour vérifier différents shards en parallèle. La technologie qui rend le sharding sûr sans forcer chaque nœud à télécharger l’intégralité des données de chaque shard est l’échantillonnage de [disponibilité des données](/fr/glossary/data-availability/) (DAS) — « a way for the network to check that data is available without putting too much strain on any individual node » ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)). Un nœud léger ne télécharge que de petits fragments choisis aléatoirement parmi les données d’un bloc et peut néanmoins, grâce au codage à effacement, acquérir la certitude que les données complètes ont été publiées.

Ce même problème de disponibilité des données concerne directement les rollups, d’où l’émergence des couches dédiées de disponibilité des données comme catégorie d’infrastructure à part entière. **Celestia** est une blockchain modulaire conçue spécifiquement pour que « rollups and L2s use Celestia as a network for publishing and making transaction data available for anyone to download » ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)), ce qui permet à un rollup de publier ses données sur une couche DA dédiée, moins coûteuse, plutôt que sur le réseau principal Ethereum. **EigenDA**, construit sur l’infrastructure de restaking d’EigenLayer, propose un service comparable, sécurisé par des stakers Ethereum qui choisissent également de sécuriser la couche DA. Les rollups qui publient leurs données sur une couche DA externe plutôt que sur Ethereum L1 sont parfois appelés *validiums* ou *optimiums* plutôt que des rollups « purs », car L2BEAT les suit comme une catégorie distincte à côté des rollups et d’autres solutions L2 ([l2beat.com](https://l2beat.com/scaling/summary)). Ils échangent une partie de cette garantie de sécurité ancrée dans L1 contre des coûts de publication des données plus faibles.

## Comparaison des approches

| Approche | Lieu d’exécution du calcul | Hérite de la sécurité de L1 ? | Disponibilité des données | Principal compromis | Exemples |
|---|---|---|---|---|---|
| Rollup optimiste | Hors chaîne (L2) | Oui — données + preuve de fraude sur L1 | Données complètes publiées sur L1 | Fenêtre de contestation du retrait d’environ 7 jours | Arbitrum, Optimism, Base |
| ZK rollup | Hors chaîne (L2) | Oui — données + preuve de validité sur L1 | Données complètes publiées sur L1 | Génération de preuves coûteuse ; équivalence EVM complète plus difficile | zkSync, Starknet, Linea |
| Sidechain | Chaîne indépendante | Non — consensus/validateurs propres | Chaîne propre, non publiée sur L1 | Sécurité seulement aussi forte que son propre ensemble de validateurs | Polygon PoS, Gnosis Chain |
| Canal d’état/de paiement | Hors chaîne, entre participants | Indirectement — fonds verrouillés sur L1 | Non publiée ; seul l’état final est onchain | Ne fait passer à l’échelle que les transactions entre parties reliées par canaux ; fonds à pré-verrouiller | Lightning Network |
| Sharding / couche DA | Shards parallèles ou réseau DA séparé | Variable — le sharding L1 en hérite ; les couches DA externes ajoutent une nouvelle hypothèse de confiance | Vérifiée par échantillonnage de disponibilité des données | Une DA externe réduit le coût mais ajoute une dépendance hors de L1 | Feuille de route de sharding d’Ethereum, Celestia, EigenDA |

Aucune approche ne gagne sur tous les axes ; c’est pourquoi les systèmes de production les combinent de plus en plus. Un ZK rollup qui publie par exemple ses données sur Celestia plutôt que sur Ethereum emprunte la sécurité de preuve de validité à une couche et une disponibilité des données moins coûteuse à une autre.

---

## Lien avec les domaines tokenisés

Les choix de mise à l’échelle comptent pour les [domaines tokenisés](/fr/glossary/tokenized-domain/), car chaque frappe, transfert, mise à jour DNS ou action de garantie est une transaction onchain dont le coût et le délai de finalité dépendent de la couche où elle se règle. Le transfert d’un `.com` tokenisé confirmé sur un rollup optimiste peut sembler peu coûteux et rapide sur L2, mais la transaction du rollup [n’est définitive qu’une fois le bloc du rollup accepté sur Ethereum](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=transactions%20conducted%20on%20the%20rollup%20are%20only%20final%20after%20the%20rollup%20block%20is%20accepted%20on%20Ethereum). Un bridge de sortie rapide n’accélère pas la finalité de l’état du rollup sur L1 : lors d’un retrait, un fournisseur de liquidité [devient à la place propriétaire du retrait L2 en attente et paie l’utilisateur sur L1](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=A%20liquidity%20provider%20assumes%20ownership%20of%20a%20pending%20L2%20withdrawal%20and%20pays%20the%20user%20on%20L1), généralement moyennant des frais, tandis que le retrait canonique attend toujours la fin de la période de contestation. Le même transfert sur un ZK rollup devient définitif face à L1 dès que la preuve de validité est publiée. Les sidechains peuvent être encore moins coûteuses, mais un NFT de domaine vivant uniquement sur une sidechain hérite de la sécurité de l’ensemble de validateurs plus restreint de cette sidechain plutôt que de celle d’Ethereum. Comprendre ces compromis aide à comprendre ce que l’on possède réellement lorsqu’un domaine est représenté onchain — la même habitude de diligence raisonnable qui importe, de façon générale, dans les [fondations du Web3](/fr/topics/web3-foundations/).

---

## Sources et lectures complémentaires

- [The Limits to Blockchain Scalability — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [Optimistic Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Sidechains — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [State Channels — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [Data Availability — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT Scaling Summary](https://l2beat.com/scaling/summary)
- [What Is Celestia? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
