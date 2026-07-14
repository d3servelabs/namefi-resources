---
title: "Les principales technologies de confidentialité des blockchains : preuves à divulgation nulle, FHE, MPC, TEE et signatures en anneau"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: "Un guide clair des cinq principales technologies de confidentialité des blockchains — preuves à divulgation nulle, FHE, MPC, TEE et signatures en anneau — comparées côte à côte."
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ["confidentialité blockchain", "preuve à divulgation nulle", "ZKP", "chiffrement entièrement homomorphe", "FHE", "calcul multipartite sécurisé", "MPC", "environnement d’exécution de confiance", "TEE", "signatures en anneau", "adresses furtives", "Monero", "Zcash", "zkSync", "Starknet", "technologie de confidentialité", "informatique confidentielle", "confidentialité on-chain", "cryptographie blockchain", "cryptomonnaies confidentielles"]
relatedArticles:
  - /fr/blog/blockchain-cryptographic-primitives/
  - /fr/blog/blockchain-scaling-approaches/
  - /fr/blog/blockchain-virtual-machines/
  - /fr/blog/blockchain-consensus-mechanisms/
  - /fr/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /fr/glossary/zero-knowledge-proof/
  - /fr/glossary/fully-homomorphic-encryption/
  - /fr/glossary/secure-multiparty-computation/
  - /fr/glossary/trusted-execution-environment/
  - /fr/glossary/cryptographic-security/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
---

Chaque transaction sur une [Blockchain](/fr/glossary/blockchain/) publique est, par défaut, visible par quiconque la consulte. Les soldes, les montants transférés et les contreparties demeurent à jamais dans le registre public. Cette transparence est à l’origine des garanties de confiance d’une blockchain, mais elle constitue aussi un handicap : aucune banque ne publie les soldes de ses clients, et aucune entreprise ne souhaite que ses paiements à ses fournisseurs ou ses versements de salaires soient lisibles par ses concurrents.

Les technologies de confidentialité des blockchains cherchent à combler cet écart sans abandonner les propriétés qui rendent les chaînes utiles au départ : la vérifiabilité, la décentralisation et la possibilité pour des inconnus de réaliser des transactions sans intermédiaire de confiance. Cinq techniques dominent le paysage actuel : les [preuves à divulgation nulle](/fr/glossary/zero-knowledge-proof/), le [chiffrement entièrement homomorphe](/fr/glossary/fully-homomorphic-encryption/) (FHE), le [calcul multipartite sécurisé](/fr/glossary/secure-multiparty-computation/) (MPC), les [environnements d’exécution de confiance](/fr/glossary/trusted-execution-environment/) (TEE) et les signatures en anneau avec adresses furtives. Chacune masque une partie différente du problème, repose sur une hypothèse de confiance différente et exige une quantité de calcul différente. Ce guide détaille les cinq, les compare côte à côte et explique pourquoi ce choix compte pour toute personne qui construit sur le [Web3](/fr/glossary/web3/) ou cherche simplement à le comprendre.

---

## Preuves à divulgation nulle

![Un prouveur remet à un vérificateur un badge lumineux de preuve valide tout en gardant un document verrouillé derrière son dos, illustrant comment une preuve à divulgation nulle convainc sans révéler l’énoncé sous-jacent](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

Une [preuve à divulgation nulle](/fr/glossary/zero-knowledge-proof/) (zero-knowledge proof, ZKP) permet à une partie — le *prouveur* — de convaincre une autre partie — le *vérificateur* — qu’une affirmation est vraie sans rien révéler d’autre à son sujet. La documentation destinée aux développeurs d’Ethereum le formule simplement : « une preuve à divulgation nulle permet de prouver la validité d’une affirmation sans révéler l’affirmation elle-même » ; « le “prouveur” est la partie qui cherche à démontrer une allégation, tandis que le “vérificateur” est chargé de valider cette allégation » ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)).

Pour qu’un système de preuve soit un véritable protocole à divulgation nulle, il doit satisfaire trois propriétés : la complétude (« si l’entrée est valide, le protocole à divulgation nulle renvoie toujours “vrai” »), la solidité (« si l’entrée est invalide, il est théoriquement impossible de tromper le protocole à divulgation nulle pour qu’il renvoie “vrai” ») et la divulgation nulle elle-même, c’est-à-dire que « le vérificateur n’apprend rien d’une affirmation au-delà de sa validité ou de sa fausseté » ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)). Concrètement, une preuve se compose d’un témoin (le secret connu du prouveur), d’un défi (une question posée par le vérificateur) et d’une réponse qui permet au vérificateur de contrôler la connaissance du prouveur sans jamais voir le témoin lui-même.

**Ce qu’elle masque :** les données ou le calcul sous-jacent ; seule la preuve qu’une affirmation est vraie est révélée.

**Utilisation actuelle :** les rollups ZK constituent le principal usage des ZKP en production pour le passage à l’échelle des blockchains. Ils « regroupent (ou “roll up”) les transactions en lots exécutés hors chaîne », puis génèrent une unique preuve de validité qu’Ethereum vérifie avant de finaliser les changements d’état du lot ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era, créé par Matter Labs, est « un ZK Rollup compatible EVM… alimenté par sa propre zkEVM » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)), tandis que Starknet, créé par StarkWare, est un rollup de validité qui exécute sa propre machine virtuelle Cairo plutôt que l’EVM (les contrats Solidity y sont reliés séparément). L2BEAT répertorie les deux comme des rollups sécurisés par des preuves de validité plutôt que par la fenêtre de contestation par preuve de fraude utilisée par les rollups optimistes ([l2beat.com](https://l2beat.com/scaling/summary)). Côté confidentialité, [Zcash](https://z.cash/technology/) a été pionnier des zk-SNARK (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) pour les transactions protégées, où « les adresses des utilisateurs, le montant de leurs transactions » et d’autres détails restent chiffrés, tandis que le réseau confirme toujours la validité de la transaction ([z.cash](https://z.cash/technology/)).

**Le compromis :** générer une preuve ZK est coûteux en calcul — les circuits de preuve parcourent chaque transaction d’un lot et en réexécutent les vérifications — de sorte que le temps de génération et le coût du matériel constituent de véritables contraintes, même si la vérification on-chain est bon marché et rapide. La confiance dans le système revient à faire confiance aux mathématiques et, pour certains systèmes de preuve, à une cérémonie unique de configuration de confiance.

---

## Chiffrement entièrement homomorphe (FHE)

![Une boîte verrouillée traverse une machine mathématique opérée par un serveur cloud sans clé et en ressort toujours verrouillée, mais contenant un résultat calculé, illustrant un calcul effectué directement sur des données chiffrées](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

Le [chiffrement entièrement homomorphe](/fr/glossary/fully-homomorphic-encryption/) adopte une approche différente : au lieu de prouver un fait au sujet de données cachées, il permet de *calculer directement sur des données chiffrées* et d’obtenir un résultat chiffré qui se déchiffre pour donner la même réponse que si le calcul avait été effectué sur des données en clair. Zama, l’une des principales entreprises de recherche et d’infrastructure FHE, le décrit ainsi : « le FHE permet de traiter des données sans les déchiffrer : les entreprises fournissent des services sans accéder aux données des utilisateurs, tandis que les utilisateurs conservent les mêmes fonctionnalités » ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Ce qu’il masque :** les entrées brutes, l’état intermédiaire et les sorties d’un calcul ; toute personne autre que le détenteur de la clé ne voit que le texte chiffré, y compris la partie qui effectue le calcul.

**Fonctionnement, à haut niveau :** les schémas FHE encodent des valeurs en clair dans des textes chiffrés fondés sur des mathématiques de réseaux euclidiens, puis définissent des équivalents chiffrés de l’addition et de la multiplication afin que des circuits arbitraires puissent s’exécuter sur ces textes chiffrés. Appliqué à une blockchain, cela signifie qu’un smart contract peut déplacer des jetons ou évaluer une logique sans jamais voir les montants concernés ; comme le formule l’exemple de Zama, « la blockchain a vérifié qu’Alice disposait de fonds suffisants sans jamais voir les montants réels » ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama note également que les schémas FHE fondés sur les réseaux sont « intrinsèquement résistants aux attaques quantiques », ce qui importe pour toute personne qui réfléchit au risque cryptographique à long terme ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Exemples de projets :** [Zama](https://www.zama.org/) développe les bibliothèques FHE open source (TFHE-rs, Concrete) et la fhEVM utilisée pour ajouter l’exécution confidentielle de smart contracts aux chaînes EVM. [Fhenix](https://cofhe-docs.fhenix.zone/) est une blockchain conçue spécifiquement pour permettre aux « développeurs de construire des smart contracts respectueux de la confidentialité en utilisant le chiffrement entièrement homomorphe », afin que « les données sensibles restent chiffrées pendant tout le calcul » ; elle propose une bibliothèque JavaScript (Cofhejs) pour le chiffrement côté client et une bibliothèque Solidity FHE pour les opérations chiffrées on-chain ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**Le compromis :** le FHE offre la garantie de confidentialité la plus forte de cette liste — rien n’est jamais déchiffré, même pendant le calcul — mais il est aussi de très loin le plus coûteux en calcul par rapport à une exécution sur données en clair. C’est pourquoi les chaînes fondées sur le FHE exécutent aujourd’hui la logique critique pour la confidentialité plutôt que chaque transaction, et pourquoi l’accélération matérielle du FHE fait l’objet d’une course active de recherche.

---

## Calcul multipartite sécurisé (MPC)

![Trois personnes tiennent chacune un fragment de clé en forme de pièce de puzzle, reliés par des lignes pointillées à une même transaction signée, illustrant comment le calcul multipartite sécurisé produit un résultat commun sans qu’aucune partie ne voie le secret complet](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

Le [calcul multipartite sécurisé](/fr/glossary/secure-multiparty-computation/) résout un problème proche, mais distinct : au lieu qu’une partie calcule sur des données chiffrées, *plusieurs* parties qui détiennent chacune une portion privée de l’entrée calculent conjointement une fonction sans révéler leurs entrées individuelles les unes aux autres. Selon la définition formelle, le MPC est « un sous-domaine de la cryptographie dont l’objectif est de créer des méthodes permettant à des parties de calculer conjointement une fonction sur leurs entrées tout en gardant ces entrées privées » ; ainsi, pour trois participants, « Alice, Bob et Charlie peuvent toujours apprendre F(x, y, z) sans révéler qui produit quoi » ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**Ce qu’il masque :** l’entrée individuelle de chaque partie pour toutes les autres ; seule la sortie convenue est révélée, et aucun participant ne voit jamais le secret complet.

**Hypothèse de confiance :** la sécurité dépend du nombre de participants qui peuvent être malhonnêtes avant que le schéma ne cède. Les constructions classiques de partage de secret offrent une sécurité informationnelle tant que moins d’un tiers des parties sont activement malveillantes, ou que moins de la moitié sont seulement curieuses ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)). En d’autres termes, le MPC remplace « faire confiance à un seul dépositaire » par « faire confiance au fait qu’un nombre insuffisant de ces N parties collabore ».

**Utilisation actuelle — la conservation par signature à seuil :** l’application blockchain la plus visible du MPC consiste à répartir une clé privée entre des parties indépendantes, de sorte qu’aucun appareil ou individu ne détienne jamais la clé complète. Le fournisseur d’infrastructure de conservation Fireblocks le décrit directement : « le calcul multipartite (MPC) est une méthode cryptographique qui divise une clé privée en parts distinctes réparties entre plusieurs parties indépendantes » et, surtout, « la clé complète n’est jamais assemblée en un seul endroit, à aucun moment » ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). Lorsqu’une transaction doit être signée, un quorum de points de terminaison valide chacun la transaction et apporte une signature partielle ; « à aucun moment la clé privée n’est assemblée », de sorte que « même si un point de terminaison est compromis… les parts de clé détenues ailleurs sont inutiles isolément » ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). Ce modèle de signature à seuil sous-tend désormais l’essentiel de la conservation institutionnelle de cryptoactifs et de nombreux portefeuilles à signatures multiples.

**Le compromis :** le MPC évite le point de défaillance unique d’une clé privée stockée sur un seul appareil, mais il ajoute des tours de communication entre les parties (de la latence) et exige une conception de protocole rigoureuse. La garantie de sécurité d’un schéma MPC ne vaut que ce que vaut son seuil supposé de majorité honnête ; il s’agit d’une hypothèse sociale et opérationnelle, et non seulement mathématique.

---

## Environnements d’exécution de confiance (TEE)

Un [environnement d’exécution de confiance](/fr/glossary/trusted-execution-environment/) emprunte une autre voie : plutôt que de chiffrer les données pendant tout le calcul, il isole le calcul dans une région d’une puce protégée par le matériel — une *enclave sécurisée* — que même le système d’exploitation de la machine ne peut pas inspecter. SGX (Software Guard Extensions) d’Intel, l’implémentation la plus connue, est décrit sur Wikipedia comme « un ensemble de codes d’instruction mettant en œuvre un environnement d’exécution de confiance, intégré à certaines unités centrales de traitement (CPU) Intel » ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Mécaniquement, « SGX implique le chiffrement par le CPU d’une portion de mémoire (l’enclave) » ; « les données et le code provenant de l’enclave sont déchiffrés à la volée au sein du CPU, ce qui les protège contre l’examen ou la lecture par d’autres codes », notamment « du code exécuté à des niveaux de privilège supérieurs, tels que le système d’exploitation et les hyperviseurs sous-jacents » ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**Ce qu’il masque :** les données et le code contenus dans l’enclave pour tous les autres processus de la même machine, y compris un système d’exploitation compromis ; c’est utile lorsqu’il faut faire confiance à l’exécution d’un morceau de code précis sans faire confiance à l’opérateur du serveur.

**Hypothèse de confiance :** contrairement aux ZKP, au FHE ou au MPC, qui reposent uniquement sur les mathématiques, un TEE vous demande de faire confiance au matériel et au firmware du fabricant de la puce. Cette confiance a été mise à l’épreuve : SGX « ne protège pas contre les attaques par canal auxiliaire », et les chercheurs ont démontré à plusieurs reprises des compromissions concrètes, depuis l’extraction de « clés RSA d’enclaves SGX exécutées sur le même système en cinq minutes » (2017) jusqu’à l’attaque Foreshadow, qui « combine l’exécution spéculative et le dépassement de tampon pour contourner SGX » (2018), en passant par des vulnérabilités plus récentes, dont Plundervolt, LVI, SGAxe et ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). Cet historique explique pourquoi les TEE sont généralement présentés comme un compromis pragmatique et plus rapide plutôt que comme une garantie cryptographiquement étanche.

**Exemples de projets :** le réseau Sapphire d’[Oasis Protocol](https://oasis.net/technology) exécute des smart contracts à l’intérieur d’enclaves matérielles afin que les utilisateurs puissent « exécuter du code dans des enclaves sécurisées par le matériel », où « les données restent chiffrées même pour les opérateurs de serveurs », tandis que « chaque exécution produit une preuve cryptographique que les utilisateurs peuvent vérifier sans confiance aveugle ». Il fournit ainsi des « smart contracts confidentiels » qui préservent « la compatibilité et la composabilité EVM » ([oasis.net](https://oasis.net/technology)). Secret Network et plusieurs produits de confidentialité liés au restaking reposent aussi sur des TEE, souvent associés à d’autres techniques pour une défense en profondeur.

**Le compromis :** les TEE s’exécutent à une vitesse proche de la vitesse native — bien plus vite que le FHE ou la génération lourde de preuves ZK — ce qui les rend attrayants pour les applications sensibles à la latence. Cette vitesse provient toutefois de la confiance accordée à un matériel qui présente un historique réel et documenté de compromissions par canal auxiliaire ; dans les hypothèses de confiance les plus défavorables, les systèmes fondés sur des TEE sont donc généralement plus faibles que les approches purement cryptographiques.

---

## Signatures en anneau et adresses furtives

La dernière paire de techniques protège une cible plus limitée, mais très concrète : masquer *qui* a envoyé une transaction et *qui* l’a reçue, même si la transaction elle-même est visible on-chain. [Monero](https://www.getmonero.org/) en est le principal exemple en production pour les deux.

Les **signatures en anneau** masquent l’expéditeur. La documentation de Monero explique qu’« une signature en anneau est un type de signature numérique qui peut être produite par n’importe quel membre d’un groupe d’utilisateurs possédant chacun des clés » et qu’« il doit être impossible, du point de vue du calcul, de déterminer laquelle des clés des membres du groupe a servi à produire la signature » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). En pratique, une transaction Monero mélange la clé du véritable dépensier avec des clés publiques leurres « extraites de la blockchain au moyen d’une méthode de distribution gamma », de sorte que, dans un « anneau » de signataires possibles, tous les membres de l’anneau sont égaux et valides, et « aucun observateur extérieur ne peut déterminer lequel des signataires possibles d’un groupe de signatures appartient à votre compte » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

Les **adresses furtives** masquent le destinataire. Au lieu de réutiliser une adresse publique, « l’expéditeur [crée] des adresses aléatoires à usage unique pour chaque transaction au nom du destinataire », de sorte que les paiements entrants « sont envoyés vers des adresses uniques sur la blockchain, où ils ne peuvent être reliés ni à l’adresse publiée du destinataire ni aux adresses d’aucune autre transaction » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). Un destinataire utilise une clé de visualisation privée pour parcourir la chaîne à la recherche de paiements et une clé de dépense privée pour les déplacer ; ainsi, « seuls l’expéditeur et le destinataire peuvent déterminer où un paiement a été envoyé » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**Ce qu’elles masquent :** l’identité de l’expéditeur (signatures en anneau) et celle du destinataire (adresses furtives) ; les *montants* des transactions sont masqués par un mécanisme distinct (Confidential Transactions / RingCT), qui n’est pas couvert par ces deux techniques seules.

**Le compromis :** les deux techniques s’exécutent efficacement sur du matériel ordinaire, sans surcharge de génération de preuve ni dépendance à une enclave, ce qui les rend bien adaptées à un réseau de paiements actif. Leur modèle de confiance repose toutefois sur l’impossibilité statistique de distinguer les ensembles de leurres du véritable signataire : une mauvaise sélection des leurres ou des heuristiques d’analyse de blockchain ont, par le passé, réduit les ensembles d’anonymat dans les premiers déploiements de signatures en anneau. Les choix de paramètres (taille de l’anneau, distribution des leurres) comptent donc autant que la primitive sous-jacente.

---

## Comparaison des cinq approches

| Technologie | Ce qu’elle masque | Hypothèse de confiance | Coût de performance | Maturité actuelle | Exemples de projets |
|---|---|---|---|---|---|
| Preuves à divulgation nulle | Données/calcul sous-jacent ; seule la validité de la preuve est révélée | Mathématiques cryptographiques (+ configuration de confiance pour certains systèmes) | Coût élevé pour générer les preuves ; faible coût de vérification | En production à grande échelle (rollups, paiements protégés) | zkSync, Starknet, Zcash |
| Chiffrement entièrement homomorphe | Toutes les données pendant le calcul, y compris pour le fournisseur de calcul | Mathématiques cryptographiques (fondées sur les réseaux) | Surcharge de calcul très élevée | Production précoce ; recherche active sur l’accélération matérielle | Zama, Fhenix |
| Calcul multipartite sécurisé | L’entrée individuelle de chaque partie | Majorité honnête/seuil parmi les participants | Modéré ; tours de communication supplémentaires | Mature et largement déployé pour la conservation | Fireblocks et autres dépositaires par signature à seuil |
| Environnements d’exécution de confiance | Données/code vis-à-vis de tous les autres processus, y compris le système d’exploitation | Fournisseur du matériel/firmware (fabricant de puces) | Vitesse proche de la vitesse native | En production, mais avec un historique documenté d’attaques par canal auxiliaire | Intel SGX, Oasis Sapphire |
| Signatures en anneau et adresses furtives | Identité de l’expéditeur et du destinataire | Indistinguabilité statistique des ensembles de leurres | Faible ; efficace sur matériel courant | Mature, en fonctionnement depuis plus de dix ans | Monero |

Aucune technologie ne l’emporte sur tous les axes ; c’est pourquoi la recherche actuelle les combine de plus en plus, par exemple des preuves ZK qui vérifient la correction d’un calcul MPC, ou des TEE utilisés avec le FHE pour une défense en profondeur.

---

## Le lien avec les domaines tokenisés

Les domaines [tokenisés](/fr/glossary/tokenize/) héritent de la même transparence par défaut que tout autre actif on-chain : les transferts de propriété, les enchères et les mises à jour de métadonnées sont lisibles publiquement. C’est surtout une fonctionnalité — la provenance et l’historique de propriété sont précisément ce qui rend un [domaine tokenisé](/fr/blog/what-are-tokenized-domains/) digne de confiance en tant qu’actif négociable — mais cela signifie aussi que les avoirs et les prix de vente d’un portefeuille de domaines sont visibles par toute personne qui observe la chaîne.

Les technologies de confidentialité décrites ici indiquent la direction que pourrait prendre l’infrastructure de domaines sous forme de NFT : la conservation à seuil fondée sur le MPC sécurise déjà les [portefeuilles](/fr/glossary/wallet/) institutionnels qui détiennent des NFT de domaine de la même manière qu’elle sécurise d’autres actifs numériques ; les preuves ZK pourraient un jour permettre à un enchérisseur de prouver qu’il peut financer une offre sans révéler l’intégralité de son solde ; et les techniques de calcul confidentiel pourraient permettre à un bureau d’enregistrement ou à une place de marché de vérifier des règles d’éligibilité sans exposer l’identité complète d’un acheteur. Rien de cela n’est déployé aujourd’hui dans la tokenisation de domaine, mais les primitives sous-jacentes sont les mêmes que celles qui sécurisent actuellement des milliards de dollars dans l’infrastructure DeFi et de conservation.

---

## Sources et lectures complémentaires

- [Preuves à divulgation nulle — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [Rollups ZK — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Résumé du passage à l’échelle L2BEAT](https://l2beat.com/scaling/summary)
- [Présentation de la technologie Zcash](https://z.cash/technology/)
- [Introduction au chiffrement homomorphe — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Documentation cofhe de Fhenix](https://cofhe-docs.fhenix.zone/)
- [Calcul multipartite sécurisé — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [Qu’est-ce que le MPC ? — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Technologie Oasis Protocol](https://oasis.net/technology)
- [Signatures en anneau — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Adresses furtives — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
