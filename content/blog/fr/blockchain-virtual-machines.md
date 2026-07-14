---
title: "Principales machines virtuelles blockchain : EVM, SVM, MoveVM, WASM et CairoVM"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: "Guide des principales machines virtuelles blockchain — EVM, SVM, MoveVM, VM fondées sur WASM et CairoVM — comparant langages, modèles d’exécution et écosystèmes."
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['machine virtuelle blockchain', 'machines virtuelles blockchain', 'evm', 'ethereum virtual machine', 'svm', 'solana virtual machine', 'sealevel', 'movevm', 'langage move', 'blockchain wasm', 'cosmwasm', 'polkavm', 'cairovm', 'langage cairo', 'starknet', 'langage de smart contract', 'exécution parallèle blockchain', 'compatible evm', 'environnement d’exécution blockchain', 'machine à états blockchain']
relatedArticles:
  - /fr/blog/blockchain-consensus-mechanisms/
  - /fr/blog/blockchain-scaling-approaches/
  - /fr/blog/blockchain-cryptographic-primitives/
  - /fr/blog/blockchain-privacy-technologies/
  - /fr/blog/what-are-tokenized-domains/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/ethereum-virtual-machine/
  - /fr/glossary/webassembly/
  - /fr/glossary/smart-contract/
  - /fr/glossary/ethereum/
  - /fr/glossary/gas/
---

Chaque [smart contract](/fr/glossary/smart-contract/) doit s’exécuter quelque part. Ce « quelque part » est une machine virtuelle (VM) blockchain : le programme isolé que chaque nœud du réseau exécute de manière identique, afin que la même entrée produise toujours la même sortie, quel que soit celui qui l’exécute. La VM sur laquelle vous construisez façonne presque tout dans une chaîne : les langages que vous pouvez utiliser, la possibilité d’exécuter les transactions simultanément ou seulement les unes après les autres, et la part de l’écosystème de développeurs existant que vous pouvez exploiter dès le premier jour.

Ce guide présente cinq conceptions de VM qui, à elles seules, propulsent aujourd’hui l’essentiel de l’activité de smart contracts dans le [Web3](/fr/glossary/web3/) : l’[Ethereum Virtual Machine](/fr/glossary/ethereum-virtual-machine/) (EVM), la SVM de Solana, la MoveVM employée par Aptos et Sui, les VM fondées sur [WebAssembly](/fr/glossary/webassembly/) (WASM), comme CosmWasm et PolkaVM, et la CairoVM de Starknet.

---

## Qu’est-ce qu’une machine virtuelle blockchain, et pourquoi est-ce important ?

Une VM blockchain est un environnement d’exécution déterministe et isolé : chaque nœud complet télécharge les mêmes transactions, les exécute avec la même VM et aboutit au même état [onchain](/fr/glossary/on-chain/). La documentation d’Ethereum décrit l’EVM comme « a decentralized virtual environment that executes code consistently and securely across all Ethereum nodes » ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)), une description qui se généralise à toutes les VM de ce guide.

Deux propriétés définissent les arbitrages de conception d’une VM :

- **Langage et chaîne d’outils.** Dans quels langages les développeurs peuvent-ils écrire des contrats, et quelle est la taille de la bibliothèque existante de code audité, des outils et du vivier de recrutement qui les maîtrise déjà ?
- **Modèle d’exécution.** La VM traite-t-elle les transactions strictement une à la fois (exécution séquentielle), ou des transactions indépendantes peuvent-elles s’exécuter simultanément sur plusieurs cœurs de processeur (exécution parallèle) ? L’exécution séquentielle est plus simple à raisonner ; l’exécution parallèle augmente le débit théorique mais ajoute de la complexité d’ordonnancement.

Ces choix se répercutent sur les coûts de gas, le comportement en cas de congestion et la capacité des contrats et outils existants à être portés sans réécriture. C’est pourquoi la question de la VM est l’une des premières auxquelles doit répondre toute nouvelle chaîne, ou tout actif [tokenisé](/fr/glossary/tokenize/) construit dessus.

---

## EVM (Ethereum Virtual Machine)

![Schéma vectoriel plat de l’EVM comme machine à pile à voie unique, avec un pointeur d’instruction qui empile et dépile des valeurs sur une pile verticale, et un compteur de gas qui suit le coût d’exécution](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

L’EVM est la VM de smart contracts la plus ancienne et la plus largement déployée, introduite avec [Ethereum](/fr/glossary/ethereum/) en 2015. C’est une machine **à pile** : la documentation Ethereum précise qu’elle fonctionne comme « a stack machine with a depth of 1024 items », chaque élément étant un mot de 256 bits ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)). L’état des contrats réside dans un trie Merkle Patricia associé à chaque compte, et l’état global de la chaîne est lui aussi organisé comme un trie Merkle Patricia modifié qui relie tous les comptes par hachage ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)).

**Langage.** Les contrats sont presque toujours écrits en **Solidity**, décrit dans la documentation Ethereum comme un « object-oriented, high-level language for implementing smart contracts », fortement influencé par la syntaxe C++ ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)). **Vyper**, un langage « Pythonic » qui réduit délibérément ses fonctionnalités pour rendre les contrats plus faciles à auditer, en est la principale alternative ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)).

**Modèle d’exécution.** L’EVM traite les transactions d’un bloc de façon **séquentielle**, l’une après l’autre dans un ordre déterminé. Cela maintient une logique de transition d’état simple et facile à auditer, mais limite le débit de la couche de base.

**Gas.** Chaque opération coûte du [gas](/fr/glossary/gas/), l’unité Ethereum qui mesure « the computational effort required for operations ». Il tarifie l’exécution et protège le réseau contre le spam ou les boucles infinies ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)).

**Atout distinctif et portée.** Le véritable fossé défensif de l’EVM est son écosystème : c’est la VM la plus implémentée dans les cryptomonnaies, et des dizaines de Layer 2 et de chaînes indépendantes (Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain) proposent des environnements **compatibles EVM** ou **équivalents EVM**, afin que les contrats Solidity, portefeuilles et outils existants puissent être déployés avec peu ou pas de modification.

---

## SVM (Solana / Sealevel)

![Schéma vectoriel plat opposant une autoroute à plusieurs voies où des voitures-transactions roulent en parallèle à une route à voie unique avec des voitures en file, illustrant l’exécution parallèle de Sealevel sur Solana par rapport à l’exécution séquentielle](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Le runtime de Solana, **Sealevel**, repose sur une hypothèse précise : la plupart des transactions touchent des parties distinctes de l’état et peuvent donc s’exécuter simultanément plutôt qu’une par une. L’annonce de Solana décrit Sealevel comme « Solana's parallel smart contracts runtime », capable de « processing thousands of contracts in parallel, using as many cores as are available to the Validator » ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)).

**Fonctionnement du parallélisme.** Les transactions Solana doivent déclarer à l’avance chaque compte qu’elles liront ou écriront. Cette déclaration rend l’ordonnancement possible : le runtime peut « sort millions of pending transactions » et « schedule all the non-overlapping transactions in parallel », tout en laissant s’exécuter simultanément plusieurs transactions qui ne font que *lire* le même compte ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)). Deux transactions ne sont sérialisées que lorsqu’elles écrivent toutes deux dans le même compte.

**Langage et fonctionnement interne de la VM.** Les programmes Solana (le terme employé pour les smart contracts) sont compilés vers une variante de bytecode Berkeley Packet Filter. Solana Labs indique avoir choisi « a variant of the Berkeley Packet Filter (BPF) bytecode » pour la VM onchain ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)). Les programmes sont le plus souvent écrits en **Rust**, tandis que C et C++ sont également pris en charge.

**Atout distinctif.** Comme le parallélisme au niveau des comptes est une propriété du runtime plutôt qu’un mécanisme que chaque auteur de contrat doit mettre en œuvre, Solana peut soutenir un débit élevé sans déplacer l’exécution hors chaîne. En contrepartie, son modèle de déclaration stricte des comptes change la façon dont les contrats sont écrits par rapport au stockage libre de l’EVM.

---

## MoveVM (Aptos et Sui)

![Schéma vectoriel plat d’une pièce traitée comme une ressource physique passée de main en main entre deux boîtes de compte, avec les badges de garde « cannot copy » et « cannot lose » illustrant le modèle de ressources de Move](../../assets/blockchain-virtual-machines-03-move-resource.jpg)

**Move** est un langage de smart contracts initialement créé pour le projet Diem de Meta, et désormais la couche de base d’**Aptos** et de **Sui**, qui exécutent chacun leur propre variante de MoveVM. La documentation d’Aptos décrit Move comme « a safe and secure programming language for Web3 that emphasizes scarcity and access control » ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)).

**Le modèle de ressources.** L’idée déterminante de Move est de traiter les actifs numériques comme des **ressources**, des types de structures particuliers que le système de types du langage garantit qu’ils « cannot be accidentally duplicated or dropped » ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)). Un jeton ou NFT modélisé comme une ressource Move ne peut matériellement pas être copié par un contrat bogué comme un entier naïf représentant un solde de compte pourrait être doublement dépensé : le compilateur rejette le programme. Seules les structures explicitement marquées comme copiables ou supprimables peuvent être dupliquées ou écartées.

**Exécution parallèle.** Aptos exécute les contrats Move avec **Block-STM**, que la documentation décrit comme permettant « concurrent execution of transactions without any input from the user ». Le runtime déduit quelles transactions sont indépendantes au moment de l’exécution, plutôt que d’exiger les listes de comptes déclarées que Solana utilise ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)).

**Le modèle objet de Sui.** Sui pousse l’idée de ressource de Move plus loin grâce à une couche de stockage centrée sur les objets : « An object is a fundamental unit of storage on the network. Every resource, asset, or piece of data on-chain is an object », adressable par un identifiant unique plutôt que stocké dans le magasin clé-valeur d’un compte ([docs.sui.io](https://docs.sui.io/concepts/object-model#:~:text=An%20object%20is%20a%20fundamental,piece%20of%20data%20onchain%20is%20an%20object)). Les objets sont soit à propriétaire unique (**owned objects**, qui peuvent s’exécuter en parallèle sans ordre de consensus puisqu’aucune autre transaction ne peut y accéder), soit des **shared objects**, auxquels plusieurs parties peuvent accéder et qui exigent une séquence de consensus.

**Atout distinctif.** Les types de ressources de Move rendent des catégories entières de bogues d’actifs — doubles dépenses, destructions accidentelles — impossibles à représenter à la compilation. Aptos et Sui associent tous deux ce modèle de sûreté à une exécution parallèle pensée dès le départ plutôt qu’ajoutée a posteriori.

---

## VM fondées sur WASM (CosmWasm, PolkaVM)

Plutôt que de définir un format de bytecode sur mesure, une seconde famille de chaînes exécute les smart contracts via **WebAssembly**, un format binaire généraliste conçu à l’origine pour le navigateur. La norme WebAssembly décrit Wasm comme « a binary instruction format for a stack-based virtual machine », conçu comme « a portable compilation target for programming languages » et visant à « execute at native speed » ([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)). Employer Wasm comme VM de contrat signifie que tout langage ayant une cible de compilation Wasm — Rust, C, C++, Go — peut, en principe, produire un contrat déployable.

**CosmWasm.** Principale plateforme de smart contracts fondée sur Wasm dans l’écosystème Cosmos, CosmWasm se décrit comme une « secure, performant, interoperable smart contract platform for the multi-chain world » ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)). Les contrats sont écrits en **Rust** et s’exécutent sur « a highly optimized Web Assembly runtime » ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)). CosmWasm est déployé sur des dizaines de chaînes Cosmos SDK, notamment Osmosis, Neutron, Injective, Secret Network et Terra, et hérite de la messagerie interchaîne IBC native de Cosmos.

**PolkaVM.** La nouvelle VM de smart contracts de Polkadot a choisi une autre voie : au lieu d’exécuter du Wasm brut, Parity a créé PolkaVM, décrite dans son propre dépôt comme « a general purpose user-level RISC-V based virtual machine » ([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)). La justification, selon la documentation de smart contracts ink!, est la performance : l’exécution RISC-V « correlates with transaction throughput and transaction costs », procurant une exécution plus rapide et moins coûteuse que l’interpréteur Wasm qu’ink! utilisait auparavant ([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)). Fait notable, la pile PolkaVM de Polkadot (sous la marque « Revive ») propose aussi une couche d’interpréteur EVM, qui permet aux contrats Solidity de s’exécuter sur le même backend RISC-V.

**Atout distinctif.** Les VM fondées sur WASM échangent un bytecode conçu sur mesure contre une cible de compilation mature et très largement implémentée. Rust, en particulier, apporte de solides garanties de sûreté mémoire au code de contrat, et les runtimes Wasm/RISC-V sous-jacents profitent d’outils conçus pour des usages non blockchain bien plus étendus.

---

## CairoVM (Starknet)

**Cairo** est le langage de smart contracts et la VM conçus spécifiquement pour générer des preuves à divulgation nulle, qui sous-tendent **Starknet**, une [Layer 2](/fr/glossary/layer-2/) Ethereum. La documentation de Starknet est explicite quant à l’objectif de conception : « Cairo is a STARK-friendly Von Neumann architecture capable of generating validity proofs for arbitrary computations » ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)). Le fait d’être « STARK-friendly » signifie que l’ensemble d’instructions est « optimized for the STARK proof system, while remaining compatible with other proof system backends » ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)). C’est la priorité inverse de l’EVM ou de la SVM, qui ont été conçues d’abord pour l’exécution et auxquelles des systèmes de preuve n’ont été ajoutés que plus tard pour la mise à l’échelle.

**Modèle d’exécution.** Cairo est compilé vers un ensemble d’instructions Turing-complet (la « machine Cairo »), défini comme un ensemble de représentations intermédiaires algébriques. La trace d’exécution de tout programme Cairo peut ainsi être transformée en une preuve STARK concise vérifiable sur Ethereum L1 ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)). Starknet peut donc regrouper des milliers de transactions hors chaîne et publier une preuve compacte de correction sur Ethereum, au lieu de rejouer chaque transaction.

**Atout distinctif.** Puisque la facilité de génération de preuves a été la contrainte de conception initiale, et non un ajout tardif, les programmes Cairo coûtent moins cher à prouver qu’un calcul équivalent exécuté dans une VM généraliste adaptée ensuite à un zk-prover (une « zkEVM »). Le compromis est un écosystème de langage plus récent et plus petit, ainsi qu’une courbe d’apprentissage plus abrupte que Solidity pour les développeurs venant d’Ethereum.

---

## Tableau comparatif

| VM | Langage(s) de contrat | Modèle d’exécution / d’état | Exécution parallèle | Taille de l’écosystème | Compatible EVM |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | Machine à pile ; état des comptes/du stockage dans un trie Merkle Patricia | Non — séquentielle dans un bloc | Le plus grand ; cible par défaut des L2 et des chaînes applicatives | Native |
| **SVM (Solana)** | Rust, C, C++ | Bytecode dérivé de BPF ; état fondé sur les comptes avec ensembles lecture/écriture déclarés | Oui — Sealevel ordonne simultanément les transactions qui ne se chevauchent pas | Grand, en croissance rapide, principalement natif de Solana | Non (écosystème distinct) |
| **MoveVM (Aptos/Sui)** | Move | Objets typés comme ressources ; Aptos utilise Block-STM, Sui un modèle d’objets détenus/partagés | Oui — déduit au runtime (Aptos) ou via la propriété des objets (Sui) | Plus petit, en croissance ; deux écosystèmes Move indépendants | Non |
| **Fondées sur WASM (CosmWasm, PolkaVM)** | Rust (CosmWasm) ; chaînes d’outils Rust/C/RISC-V (PolkaVM) | Bytecode Wasm (CosmWasm) ou RISC-V (PolkaVM) | Dépend de la chaîne ; ce n’est pas une propriété universelle de l’exécution Wasm | Moyen ; réparti entre de nombreuses chaînes Cosmos et l’ensemble de parachains Polkadot | PolkaVM/Revive ajoute une couche d’interpréteur EVM ; CosmWasm n’est pas compatible EVM |
| **CairoVM (Starknet)** | Cairo | Machine Turing-complète fondée sur AIR, conçue pour les preuves STARK | Ce n’est pas l’objectif principal — optimisée pour la prouvabilité, non pour la concurrence | La plus petite des cinq, mais grandit avec l’activité L2 de Starknet | Non (les projets zkEVM font entrer les contrats Solidity séparément) |

---

## Lien avec les domaines tokenisés

La VM d’une chaîne importe directement pour l’infrastructure des [domaines tokenisés](/fr/glossary/tokenized-domain/). Un domaine représenté par un [NFT](/fr/glossary/nft/) est, au fond, un smart contract qui impose qui possède un jeton et ce qu’il peut en faire. C’est le même type de logique que le modèle de ressources de Move a été conçu pour rendre manifestement sûr, et que les outils matures de l’EVM rendent facile à auditer et à intégrer aux portefeuilles et places de marché existants. Le modèle de tokenisation de Namefi vise délibérément l’écosystème EVM : la compatibilité EVM signifie que le NFT de propriété d’un domaine `.com` ou `.ai` tokenisé fonctionne immédiatement avec l’univers existant de portefeuilles, places de marché et protocoles DeFi EVM, sans exiger une intégration sur mesure pour chaque nouvelle VM. Découvrez les domaines tokenisés sur [namefi.io](https://namefi.io).

---

## Sources et lectures complémentaires

- [The Ethereum Virtual Machine (EVM) — ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [Smart Contract Languages — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — Parallel Processing Thousands of Smart Contracts — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Documentation Aptos](https://aptos.dev/en/network/blockchain/move)
- [Object Model — Documentation Sui](https://docs.sui.io/concepts/object-model)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub (paritytech)](https://github.com/paritytech/polkavm)
- [Why RISC-V and PolkaVM for Smart Contracts — documentation ink!](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo Architecture — The Cairo Programming Language / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
