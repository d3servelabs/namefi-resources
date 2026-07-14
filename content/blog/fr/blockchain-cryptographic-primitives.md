---
title: "Principales primitives cryptographiques derrière chaque blockchain"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: "Guide des primitives cryptographiques fondamentales qui font fonctionner les blockchains : fonctions de hachage, signatures numériques, arbres de Merkle, cryptographie sur courbes elliptiques et engagements."
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['cryptographie blockchain', 'primitives cryptographiques', 'fonction de hachage', 'SHA-256', 'Keccak-256', 'signature numérique', 'ECDSA', 'EdDSA', 'signature BLS', 'arbre de Merkle', 'cryptographie sur courbes elliptiques', 'secp256k1', 'schéma d’engagement', 'cryptographie post-quantique', 'cryptographie à clé publique', 'sécurité blockchain']
relatedArticles:
  - /fr/blog/blockchain-privacy-technologies/
  - /fr/blog/blockchain-consensus-mechanisms/
  - /fr/blog/blockchain-virtual-machines/
  - /fr/blog/blockchain-scaling-approaches/
  - /fr/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /fr/glossary/hash-function/
  - /fr/glossary/digital-signature/
  - /fr/glossary/merkle-tree/
  - /fr/glossary/public-key/
  - /fr/glossary/private-key/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
---

Chaque affirmation portée par une blockchain — « cette transaction est définitive », « cette adresse possède cet actif », « cet historique n’a pas été modifié » — se ramène en définitive à une poignée de primitives cryptographiques qui effectuent des tâches étroites et clairement définies. Aucune n’est une invention des blockchains. Les fonctions de hachage, les signatures numériques et les arbres de Merkle existaient des décennies avant Bitcoin. Les blockchains les ont simplement combinés dans un système où aucune partie unique n’a besoin d’être digne de confiance pour que ces affirmations tiennent.

Ce guide examine les primitives qui portent réellement cette charge : les [fonctions de hachage](/fr/glossary/hash-function/) qui servent d’empreinte aux données, les [signatures numériques](/fr/glossary/digital-signature/) qui autorisent les transactions, les [arbres de Merkle](/fr/glossary/merkle-tree/) qui rendent de très grands jeux de données vérifiables par morceaux, les mathématiques des courbes elliptiques sur lesquelles reposent ces signatures, et les schémas d’engagement — la brique qui mène aux [preuves à divulgation nulle de connaissance](/fr/glossary/zero-knowledge-proof/). Comprendre chacune d’elles est la manière la plus rapide de saisir ce qu’une blockchain fait réellement en coulisses.

---

## Fonctions de hachage cryptographiques (SHA-256, Keccak)

![Un document introduit dans une machine de hachage produit une empreinte de taille fixe, et la modification d’une seule lettre de l’entrée produit une empreinte entièrement différente, illustrant l’effet d’avalanche](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

Une [fonction de hachage](/fr/glossary/hash-function/) prend une entrée de taille quelconque et produit de façon déterministe une sortie de taille fixe — une « empreinte » — de sorte qu’inverser un seul bit de l’entrée bouleverse entièrement la sortie, et qu’il est infaisable en pratique de trouver deux entrées différentes qui donnent la même sortie de hachage. Cette propriété, la résistance aux collisions, permet d’utiliser un hachage comme empreinte compacte et révélatrice de toute altération, même pour des données arbitrairement volumineuses.

Bitcoin utilise SHA-256 partout : les en-têtes de blocs sont chaînés en intégrant le hachage SHA256(SHA256()) de l’en-tête précédent dans chaque nouvel en-tête ; modifier un bloc passé change donc son hachage et invalide chaque en-tête qui le suit ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). Cette même construction à double SHA-256 hache les transactions dans l’[arbre de Merkle](/fr/glossary/merkle-tree/) du bloc ([référence Bitcoin.org](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

Ethereum standardise plutôt Keccak-256 (la soumission Keccak d’origine, distincte de la norme SHA-3 du NIST publiée plus tard) comme fonction de hachage généraliste. Chaque adresse de compte est dérivée en prenant les 20 derniers octets du hachage Keccak-256 de la [Clé Publique](/fr/glossary/public-key/) du compte ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)), et cette même fonction sous-tend l’adressage par contenu clé/valeur utilisé dans le [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) qui stocke l’état d’Ethereum.

Le hachage relie aussi les en-têtes de blocs en une chaîne plutôt qu’en une simple collection d’enregistrements : modifier un en-tête change son hachage et rompt les références des en-têtes qui en descendent. L’obligation supplémentaire de refaire le travail ultérieur et de rattraper le réseau honnête est propre au consensus par preuve de travail de Bitcoin. Un attaquant qui modifie un ancien bloc doit refaire la preuve de travail de ce bloc et tout le travail qui le suit, puis rattraper la chaîne honnête ([livre blanc de Bitcoin, §4](https://bitcoin.org/bitcoin.pdf)). D’autres blockchains authentifient et finalisent leur historique selon des règles de consensus différentes ; le seul chaînage des hachages ne crée donc pas ce coût de preuve de travail. Les hachages liés des en-têtes sont la raison littérale pour laquelle cette structure de données s’appelle une **blockchain**.

---

## Cryptographie à clé publique et signatures numériques (ECDSA, EdDSA, BLS)

![Une clé privée signe une transaction pour produire une signature numérique ; la clé publique correspondante la vérifie avec une coche verte, tandis qu’une clé publique non correspondante la rejette avec une croix rouge](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

Une blockchain n’a pas de formulaire de connexion ; elle a donc besoin d’un autre moyen de prouver que « cette transaction provient bien du propriétaire de ce compte ». La [cryptographie à clé publique](/fr/glossary/public-key/) résout ce problème avec une paire de clés : une [Clé Privée](/fr/glossary/private-key/) tenue secrète et une clé publique qui peut être librement partagée. Signer une transaction avec la clé privée produit une [signature numérique](/fr/glossary/digital-signature/) que n’importe qui peut vérifier par rapport à la clé publique : l’autorisation est ainsi prouvée sans jamais révéler la clé privée elle-même.

Les comptes Ethereum dérivent leur clé publique de la clé privée au moyen de l’algorithme de signature numérique à courbe elliptique, ECDSA, sur la courbe secp256k1 — la même courbe que Bitcoin utilise ([documentation ethereum.org sur les comptes](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, correctif de malléabilité des signatures secp256k1](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA est rapide à vérifier et a été scruté pendant des décennies, mais présente une faiblesse opérationnelle pertinente pour les conceptions plus récentes : les signatures ECDSA individuelles ne s’agrègent pas efficacement ; en vérifier des milliers revient donc à effectuer des milliers de vérifications séparées.

C’est précisément ce que comblent les signatures EdDSA et BLS. EdDSA (employé par des chaînes comme Solana et Stellar) utilise une construction de courbe différente, déterministe et résistante à certains écueils d’implémentation qui ont historiquement provoqué des bogues de réutilisation de nonce avec ECDSA. Les signatures BLS vont plus loin : grâce à la propriété mathématique d’appariement des courbes qu’elles utilisent, de nombreuses signatures BLS peuvent être réunies en une signature agrégée unique qui les vérifie toutes en une seule fois. La couche de consensus par preuve d’enjeu d’Ethereum repose exactement sur ce mécanisme : les validateurs signent des attestations avec des clés BLS afin que la beacon chain puisse agréger les votes de centaines de milliers de validateurs en signatures assez compactes pour être vérifiées rapidement. C’est ce qui rend la preuve d’enjeu à grande échelle praticable ([ethereum.org, *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). Ethereum expose aussi des opérations sur la courbe BLS12-381 sous forme de précompilations EVM, précisément pour prendre en charge la vérification de signatures BLS dans les smart contracts ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Arbres de Merkle

![Une pyramide de nœuds de hachage d’un arbre de Merkle se combine par paires jusqu’à une racine unique ; un chemin de preuve allant d’une feuille à la racine est surligné en orange pour montrer une preuve de Merkle de client léger](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

Un [arbre de Merkle](/fr/glossary/merkle-tree/) permet à une blockchain de résumer des milliers de transactions dans un unique hachage de 32 octets sans obliger chaque participant à stocker chaque transaction. Les feuilles sont les hachages d’éléments de données individuels (transactions, états de compte) ; chaque paire de hachages est concaténée puis hachée de nouveau, jusqu’à ce qu’il ne reste qu’un hachage — la racine ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). Cette racine est stockée directement dans l’en-tête du bloc, ce qui permet à un nœud complet de prendre un engagement cryptographique sur l’intégralité du contenu d’un bloc avec presque aucun espace supplémentaire.

Le gain est la taille de la preuve. Pour démontrer qu’une transaction est incluse dans un bloc, le bloc entier n’est pas nécessaire : il suffit de la transaction et d’une « branche de Merkle », c’est-à-dire les hachages frères le long du chemin de cette feuille à la racine, soit en général de l’ordre de log₂(n) hachages pour n transactions. C’est le fondement de la vérification de paiement simplifiée (SPV) : un client léger qui ne possède que les en-têtes de blocs peut encore vérifier qu’une transaction précise a eu lieu en comparant sa branche de Merkle à la racine de l’en-tête, sans télécharger l’intégralité de la blockchain ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

Ethereum étend cette idée avec le Merkle Patricia Trie, un hybride d’arbre de Merkle et de trie de préfixes (radix) utilisé pour stocker l’état complet des comptes, et non une simple liste de transactions. Chaque en-tête de bloc contient trois racines de trie distinctes — `stateRoot`, `transactionsRoot` et `receiptsRoot` — chacune pouvant être prouvée indépendamment ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). C’est ce qui permet à un smart contract ou à un client léger de vérifier le solde d’un compte ou un emplacement de stockage donné sans rejouer toute la chaîne.

---

## Cryptographie sur courbes elliptiques

La cryptographie sur courbes elliptiques (ECC) est le fondement mathématique sur lequel reposent ECDSA, EdDSA et BLS. Au lieu de s’appuyer sur la difficulté de factoriser de grands nombres (comme le RSA classique), l’ECC repose sur la difficulté du problème du logarithme discret sur courbe elliptique : étant donné un point de la courbe obtenu en ajoutant un point de base à lui-même de très nombreuses fois, il est infaisable en pratique de retrouver le nombre d’additions — alors que calculer ce point dans le sens direct est facile. Cette asymétrie (facile dans un sens, difficile à inverser) est précisément ce qui permet d’utiliser une clé privée pour signer tout en publiant sans risque la clé publique qui en est dérivée.

La courbe précise et le schéma de signature comptent. Bitcoin et Ethereum utilisent tous deux secp256k1, une courbe de Koblitz normalisée par le Standards for Efficient Cryptography Group avec des paramètres de 256 bits bien étudiés ([SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)). D’autres écosystèmes font des compromis différents : Ed25519 est un schéma de signature EdDSA concret instancié sur la courbe Edwards25519 ([RFC 8032, §5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)), et la RFC 8032 le situe autour d’un niveau de sécurité classique de 128 bits ([§8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)). BLS12-381 est une courbe adaptée aux appariements, choisie pour des opérations telles que l’agrégation de signatures BLS ; l’EIP-2537 décrit un niveau de sécurité supérieur à 120 bits ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)). Ces estimations ne signifient pas que les systèmes offrent une même « sécurité par bit de clé » : ils emploient des groupes, des encodages et des hypothèses différents, et la longueur nominale d’une clé ne constitue pas en elle-même sa force de sécurité. Le NIST associe par exemple une sécurité classique de 128 bits à des clés ECC ordinaires de 256 à 383 bits, mais à des clés RSA de 3 072 bits ([NIST SP 800-57 Part 1 Rev. 5, tableau 2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)). Cela aide à comprendre pourquoi les systèmes sur courbes elliptiques sont devenus la norme pour les comptes blockchain.

---

## Schémas d’engagement (un pont vers la divulgation nulle)

Un schéma d’engagement permet de « verrouiller » une valeur — publier un élément qui vous lie à une donnée précise — sans révéler cette donnée, puis d’« ouvrir » l’engagement plus tard pour prouver de quelle valeur il s’agissait. L’analogie courante est l’enveloppe scellée : vous pouvez remettre aujourd’hui une enveloppe fermée à quelqu’un comme preuve que vous avez déjà choisi une réponse, sans qu’il la voie avant que vous décidiez de l’ouvrir, et une fois l’enveloppe scellée, vous ne pouvez pas échanger la réponse qu’elle contient.

Cette primitive paraît modeste, mais elle soutient la plupart des systèmes de preuve à divulgation nulle. La conception de disponibilité des données d’Ethereum fondée sur les blobs utilise par exemple des engagements polynomiaux KZG pour réduire chaque blob à un petit engagement cryptographique. Une preuve KZG peut authentifier une évaluation ou une cellule échantillonnée par rapport à cet engagement, mais elle ne prouve pas à elle seule que le blob complet est disponible. La disponibilité vient des règles de distribution et d’échantillonnage de la couche de consensus, tandis que KZG contrôle l’intégrité des données reçues ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation) ; [EIP-7594, PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)). Cette séparation permet à un vérificateur de contrôler une petite partie d’un blob sans confondre une preuve compacte d’évaluation avec la preuve que toutes les données du blob ont été publiées. Une racine de Merkle est d’ailleurs elle-même un schéma d’engagement simple : elle engage un jeu de données entier au moyen de son hachage racine, et une branche de Merkle est l’« ouverture » qui révèle l’un de ses éléments. Les ZK-rollups s’appuient sur des schémas d’engagement plus avancés (engagements polynomiaux et vectoriels) pour compresser l’exécution d’un lot entier de transactions dans une preuve peu coûteuse à vérifier onchain — un sujet traité en profondeur dans [Preuve à divulgation nulle parfaite vs computationnelle](/fr/blog/perfect-vs-computational-zero-knowledge/).

---

## Comparaison : primitives cryptographiques blockchain

| Primitive | Propriété apportée | Utilisation onchain | Risque classique ou post-quantique |
|---|---|---|---|
| Fonctions de hachage (SHA-256, Keccak-256) | Empreinte résistante aux collisions ; chaînage des blocs | Hachage des blocs, dérivation d’adresses, racines de Merkle | Solides avec les tailles de sortie actuelles dans le cadre classique ; les schémas fondés sur le hachage sont généralement considérés comme plus résistants aux attaques quantiques que les signatures actuelles sur courbe elliptique |
| Signatures numériques — ECDSA | Autorisation de transaction au moyen d’une paire de clés privée/publique | Signatures des comptes Bitcoin et Ethereum | Sûres dans le cadre classique ; un ordinateur quantique à grande échelle suffisamment capable devrait casser les schémas fondés sur les courbes elliptiques, raison pour laquelle le NIST a normalisé des alternatives post-quantiques ([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| Signatures numériques — EdDSA / BLS | Signature déterministe (EdDSA) ; agrégation efficace de signatures (BLS) | Signatures Solana/Stellar (EdDSA) ; attestations des validateurs Ethereum (BLS) | Même hypothèse sous-jacente de courbe elliptique qu’ECDSA — donc même exposition quantique à long terme |
| Arbres de Merkle | Engagement compact envers un grand jeu de données ; petites preuves d’inclusion | En-têtes de blocs, vérification par client léger (SPV), tries d’état/de transactions/de reçus d’Ethereum | Dépend uniquement de la résistance aux collisions de la fonction de hachage sous-jacente ; hérite donc de son profil quantique sans ajouter de nouvelle exposition |
| Cryptographie sur courbes elliptiques | Base mathématique de clés et de signatures compactes | secp256k1 (Bitcoin, Ethereum), Ed25519, BLS12-381 | Vulnérable de la même manière qu’ECDSA/EdDSA/BLS à un futur ordinateur quantique à grande échelle ; c’est le moteur principal de la recherche sur la migration post-quantique |
| Schémas d’engagement | S’engager maintenant sur une valeur, la révéler ou la prouver plus tard sans l’exposer d’emblée | Engagements KZG pour la disponibilité des données Ethereum ; racines de Merkle comme engagements simples ; brique des ZK-rollups | La sécurité dépend de l’hypothèse de hachage ou de courbe elliptique utilisée pour construire le schéma |

---

## Lien avec les domaines tokenisés

Chacune de ces primitives intervient directement lorsque vous [tokenisez](/fr/glossary/tokenize/) un domaine. Le [NFT](/fr/glossary/nft/) qui représente la propriété est protégé par les règles d’autorisation des comptes et des jetons de la chaîne. S’il est détenu par un compte externe (EOA), la clé privée de ce compte autorise les actions du compte ; un compte de contrat ne possède aucune clé privée et son code en assure le contrôle ([ethereum.org, *Comptes Ethereum*](https://ethereum.org/en/developers/docs/accounts/#account-types)). Pour un jeton ERC-721, une adresse approuvée ou un opérateur peut également déclencher un transfert ([ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)). C’est pourquoi les [portefeuilles matériels](/fr/glossary/hardware-wallet/) et la conservation rigoureuse de la [phrase de récupération](/fr/glossary/seed-phrase/) comptent pour une détention autogérée via un EOA, tandis que les portefeuilles fondés sur des smart contracts et les portefeuilles sous garde introduisent des périmètres d’autorisation et de confiance différents. L’enregistrement de propriété du domaine se trouve dans le même état dont l’engagement cryptographique est assuré par une racine de Merkle, qui sécurise chaque autre solde de compte et chaque [Smart contract](/fr/glossary/smart-contract/) de la chaîne. C’est exactement ce qui confère à un domaine tokenisé la même résistance à l’altération que tout autre actif on-chain : il est transférable, vérifiable et sa propriété est démontrable sans que la base de données d’un bureau d’enregistrement soit l’unique source de vérité.

Comprendre ces primitives clarifie aussi ce que la tokenisation change, et ce qu’elle ne change pas : l’enregistrement DNS et le statut au registre du domaine suivent toujours les règles de l’ICANN, mais la preuve de propriété s’appuie désormais sur la cryptographie décrite ci-dessus plutôt que sur un compte de [bureau d’enregistrement](/fr/glossary/registrar/) protégé par des identifiants de connexion. Découvrez le tableau d’ensemble dans [Mécanismes de consensus blockchain](/fr/blog/blockchain-consensus-mechanisms/) et [Approches de mise à l’échelle des blockchains](/fr/blog/blockchain-scaling-approaches/), ou commencez à tokeniser sur [namefi.io](https://namefi.io).

---

## Sources et lectures complémentaires

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html), chaînage via SHA256(SHA256()) de l’en-tête précédent
- Bitcoin — [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), réécriture de l’historique de preuve de travail et travail cumulé
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html), construction de la racine de Merkle
- Bitcoin Developer Guide — [Operating Modes](https://developer.bitcoin.org/devguide/operating_modes.html), SPV et branches de Merkle
- ethereum.org — [Ethereum Accounts](https://ethereum.org/en/developers/docs/accounts/), ECDSA et dérivation d’adresse Keccak-256 ; contrôle des EOA et des comptes de contrat
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), racines d’état/de transactions/de reçus
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), engagements polynomiaux KZG
- EIP-4844 — [Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844), engagements de blobs, preuves et disponibilité sur la couche de consensus
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594), preuves de cellules et échantillonnage de disponibilité des données
- ERC-721 — [Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721), propriété des jetons, approbations et opérateurs
- EIP-2 — [Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2), contraintes de signature secp256k1
- EIP-2537 — [Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html), schéma, courbe et niveau de sécurité d’Ed25519
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final), niveaux de sécurité comparables de l’ECC et du RSA
- *The Eth2 Book* — [Signatures and BLS aggregation](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST Releases First 3 Finalized Post-Quantum Encryption Standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
