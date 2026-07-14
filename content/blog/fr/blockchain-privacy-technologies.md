---
title: "Les principales technologies de confidentialité blockchain : preuves à divulgation nulle de connaissance, FHE, MPC, TEE et signatures en anneau"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: Un guide accessible sur les cinq principales technologies de confidentialité blockchain — preuves à divulgation nulle de connaissance, FHE, MPC, TEE et signatures en anneau — comparées côte à côte.
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['confidentialité blockchain', 'preuve à divulgation nulle de connaissance', 'zkp', 'chiffrement entièrement homomorphe', 'fhe', 'calcul multipartite sécurisé', 'mpc', 'environnement d’exécution de confiance', 'tee', 'signatures en anneau', 'adresses furtives', 'monero', 'zcash', 'zksync', 'starknet', 'technologie de confidentialité', 'informatique confidentielle', 'confidentialité sur la blockchain', 'cryptographie blockchain', 'cryptomonnaies de confidentialité']
relatedArticles:
  - /fr/blog/perfect-vs-computational-zero-knowledge/
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/do-multisig-wallets-actually-improve-security/
  - /fr/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /fr/blog/what-are-tokenized-domains/
relatedGlossary:
  - /fr/glossary/blockchain/
  - /fr/glossary/cryptographic-security/
  - /fr/glossary/ethereum/
  - /fr/glossary/smart-contract/
  - /fr/glossary/web3/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
---

Par défaut, chaque transaction sur une [blockchain](/fr/glossary/blockchain/) publique est visible par toute personne qui la consulte. Les soldes, les montants des transferts et les contreparties restent dans le registre ouvert pour toujours. Cette transparence est à l’origine des garanties de confiance d’une blockchain, mais elle constitue aussi un risque : aucune banque ne publie les soldes de ses clients, et aucune entreprise ne souhaite que ses paiements fournisseurs ou ses versements de salaires soient lisibles par ses concurrents.

Les technologies de confidentialité blockchain existent pour combler cet écart sans renoncer aux propriétés qui rendent les chaînes utiles au départ : vérifiabilité, décentralisation et possibilité, pour des inconnus, de réaliser des transactions sans intermédiaire de confiance. Cinq techniques dominent le paysage actuel : les [preuves à divulgation nulle de connaissance](/fr/glossary/zero-knowledge-proof/) (ZKP), le [chiffrement entièrement homomorphe](/fr/glossary/fully-homomorphic-encryption/) (FHE), le [calcul multipartite sécurisé](/fr/glossary/secure-multiparty-computation/) (MPC), les [environnements d’exécution de confiance](/fr/glossary/trusted-execution-environment/) (TEE) et les signatures en anneau avec adresses furtives. Chacune masque une pièce différente du puzzle, repose sur une hypothèse de confiance différente et entraîne un coût de calcul différent. Ce guide examine les cinq, les compare côte à côte et explique pourquoi ce choix est important pour quiconque construit sur le [Web3](/fr/glossary/web3/) — ou cherche simplement à le comprendre.

---

## Preuves à divulgation nulle de connaissance

![Un prouveur remet à un vérificateur un badge lumineux de preuve valide tout en gardant un document verrouillé derrière son dos, illustrant comment une preuve à divulgation nulle de connaissance convainc sans révéler l’énoncé sous-jacent](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

Une [preuve à divulgation nulle de connaissance](/fr/glossary/zero-knowledge-proof/) (ZKP) permet à une partie — le *prouveur* — de convaincre une autre partie — le *vérificateur* — qu’un énoncé est vrai sans rien révéler d’autre à son sujet. La documentation destinée aux développeurs d’Ethereum l’exprime simplement : « Une preuve à divulgation nulle de connaissance est un moyen de prouver la validité d’un énoncé sans révéler l’énoncé lui-même », où « le “prouveur” est la partie qui cherche à prouver une affirmation, tandis que le “vérificateur” est chargé de valider l’affirmation » ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)).

Pour qu’un système de preuve soit considéré comme un véritable protocole à divulgation nulle de connaissance, il doit satisfaire trois propriétés : la complétude (« si l’entrée est valide, le protocole à divulgation nulle de connaissance renvoie toujours “true” »), la solidité (« si l’entrée est invalide, il est théoriquement impossible de tromper le protocole à divulgation nulle de connaissance pour qu’il renvoie “true” ») et la divulgation nulle de connaissance elle-même, c’est-à-dire que « le vérificateur n’apprend rien d’un énoncé au-delà de sa validité ou de sa fausseté » ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)). Concrètement, une preuve se compose d’un témoin (le secret que connaît le prouveur), d’un défi (une question posée par le vérificateur) et d’une réponse qui permet au vérificateur de contrôler la connaissance du prouveur sans jamais voir le témoin lui-même.

**Ce qu’elle masque :** les données ou le calcul sous-jacents — seule est révélée la preuve qu’une affirmation est vraie.

**Utilisation actuelle :** les ZK-rollups constituent le plus grand usage des ZKP en production pour la mise à l’échelle des blockchains. Ils « regroupent (ou “roll up”) les transactions en lots exécutés hors chaîne », puis génèrent une unique preuve de validité qu’Ethereum vérifie avant de finaliser les changements d’état du lot ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era, développé par Matter Labs, est « un ZK Rollup compatible EVM… propulsé par son propre zkEVM » ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)), tandis que Starknet, développé par StarkWare, est un rollup de validité qui exécute sa propre VM Cairo plutôt que l’EVM (les contrats Solidity y sont interconnectés séparément). L2BEAT recense les deux comme des rollups sécurisés par des preuves de validité plutôt que par la fenêtre de contestation des preuves de fraude utilisée par les rollups optimistes ([l2beat.com](https://l2beat.com/scaling/summary)). Côté confidentialité, [Zcash](https://z.cash/technology/) a été pionnier des zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) pour les transactions protégées, où « les adresses des utilisateurs, le montant de leur transaction » et d’autres détails restent chiffrés tandis que le réseau confirme tout de même que la transaction est valide ([z.cash](https://z.cash/technology/)).

**Le compromis :** générer une preuve ZK est coûteux en calcul — les circuits de preuve parcourent chaque transaction d’un lot et réexécutent ses vérifications — de sorte que le temps de preuve et le coût du matériel constituent de vraies contraintes, même si la vérification sur la chaîne est peu coûteuse et rapide. La confiance dans le système se réduit à la confiance dans les mathématiques et, pour certains systèmes de preuve, dans une cérémonie unique de configuration de confiance.

---

## Chiffrement entièrement homomorphe (FHE)

![Une boîte verrouillée passe dans une machine mathématique opérée par un serveur cloud sans clé et ressort toujours verrouillée mais contenant un résultat calculé, illustrant un calcul effectué directement sur des données chiffrées](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

Le [chiffrement entièrement homomorphe](/fr/glossary/fully-homomorphic-encryption/) adopte une approche différente : au lieu de prouver un fait à propos de données cachées, il vous permet de *calculer directement sur des données chiffrées* et d’obtenir un résultat chiffré qui, une fois déchiffré, donne la même réponse que si vous aviez calculé sur le texte en clair. Zama, l’une des principales entreprises de recherche et d’infrastructure FHE, le décrit ainsi : « Le FHE permet de traiter des données sans déchiffrement — les entreprises fournissent des services sans accéder aux données des utilisateurs, tandis que les utilisateurs conservent les mêmes fonctionnalités » ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Ce qu’il masque :** les entrées brutes, l’état intermédiaire et les sorties d’un calcul — toutes les personnes à l’exception du détenteur de la clé ne voient que du texte chiffré, y compris la partie qui effectue le calcul.

**Fonctionnement général :** les schémas FHE encodent des valeurs en clair dans des textes chiffrés construits sur des mathématiques fondées sur les réseaux, puis définissent des équivalents chiffrés de l’addition et de la multiplication afin que des circuits arbitraires puissent s’exécuter sur les textes chiffrés. Appliqué à une blockchain, cela signifie qu’un contrat intelligent peut déplacer des tokens ou évaluer une logique sans jamais voir les montants concernés — comme l’indique l’exemple de Zama, « la blockchain a vérifié qu’Alice disposait de fonds suffisants sans jamais voir les montants réels » ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama note également que les schémas FHE fondés sur les réseaux sont « intrinsèquement résistants au post-quantique », ce qui compte pour quiconque réfléchit à long terme au risque cryptographique ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Exemples de projets :** [Zama](https://www.zama.org/) développe les bibliothèques FHE open source (TFHE-rs, Concrete) et le fhEVM utilisé pour ajouter l’exécution confidentielle de contrats intelligents aux chaînes EVM. [Fhenix](https://cofhe-docs.fhenix.zone/) est une blockchain construite spécifiquement pour permettre aux « développeurs de créer des contrats intelligents préservant la confidentialité grâce au chiffrement entièrement homomorphe », afin que « les données sensibles restent chiffrées tout au long du calcul », avec une bibliothèque JavaScript (Cofhejs) pour le chiffrement côté client et une bibliothèque Solidity FHE pour les opérations chiffrées sur la chaîne ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**Le compromis :** le FHE offre la garantie de confidentialité la plus forte de cette liste — rien n’est jamais déchiffré, même pendant le calcul — mais il est aussi, de loin, le plus coûteux en calcul par rapport à une exécution en clair. C’est pourquoi les chaînes basées sur le FHE exécutent aujourd’hui une logique critique pour la confidentialité plutôt que chaque transaction, et pourquoi l’accélération matérielle du FHE est un domaine de recherche actif.

---

## Calcul multipartite sécurisé (MPC)

![Trois personnes tiennent chacune une part de clé en forme de pièce de puzzle, reliées par des lignes pointillées à une transaction signée unique, illustrant comment le calcul multipartite sécurisé produit un résultat conjoint sans qu’aucune partie ne voie le secret entier](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

Le [calcul multipartite sécurisé](/fr/glossary/secure-multiparty-computation/) résout un problème connexe mais distinct : au lieu qu’une partie calcule sur des données chiffrées, *plusieurs* parties qui détiennent chacune une portion privée de l’entrée calculent conjointement une fonction sans révéler leurs entrées individuelles les unes aux autres. Selon la définition formelle, le MPC est « un sous-domaine de la cryptographie dont l’objectif est de créer des méthodes permettant à des parties de calculer conjointement une fonction sur leurs entrées tout en les gardant privées », de sorte que, pour trois participants, « Alice, Bob et Charlie peuvent tout de même apprendre F(x, y, z) sans révéler qui produit quoi » ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**Ce qu’il masque :** l’entrée individuelle de chaque partie vis-à-vis de toutes les autres — seule la sortie convenue est révélée, et aucun participant ne voit jamais le secret entier.

**Hypothèse de confiance :** la sécurité dépend du nombre de participants qui peuvent être malhonnêtes avant que le schéma ne cède. Les constructions classiques de partage de secret assurent une sécurité informationnelle tant que moins d’un tiers des parties sont activement malveillantes, ou que moins de la moitié sont simplement curieuses ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)). En d’autres termes, le MPC remplace « faire confiance à un dépositaire » par « faire confiance au fait qu’un nombre pas trop élevé de ces N parties colludent ».

**Utilisation actuelle — garde avec signatures à seuil :** l’application blockchain la plus visible du MPC consiste à répartir une clé privée entre des parties indépendantes afin qu’aucun appareil ni aucune personne ne détienne jamais la clé entière. Le fournisseur d’infrastructures de garde Fireblocks le décrit directement : « Le calcul multipartite (MPC) est une méthode cryptographique qui répartit une clé privée en parts distinctes distribuées entre plusieurs parties indépendantes », et surtout « la clé complète n’est jamais réunie en un seul endroit, à aucun moment » ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). Lorsqu’une transaction doit être signée, un quorum de points de terminaison valide la transaction, chacun apportant une signature partielle ; « à aucun moment la clé privée n’est reconstituée », si bien que « même si une extrémité est compromise… les parts de clé détenues ailleurs sont inutiles isolément » ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). Ce modèle de signature à seuil sous-tend désormais la plupart des services institutionnels de garde de cryptoactifs et de nombreux portefeuilles à plusieurs signataires.

**Le compromis :** le MPC évite le point de défaillance unique d’une clé privée stockée sur un appareil, mais il ajoute des cycles de communication entre les parties (latence) et exige une conception rigoureuse du protocole — la garantie de sécurité d’un schéma MPC n’est aussi solide que le seuil de majorité honnête qu’il suppose, lequel relève d’une hypothèse sociale et opérationnelle, et pas seulement mathématique.

---

## Environnements d’exécution de confiance (TEE)

Un [environnement d’exécution de confiance](/fr/glossary/trusted-execution-environment/) emprunte une autre voie : plutôt que de chiffrer les données pendant tout un calcul, il isole le calcul dans une région d’une puce protégée par le matériel — une *enclave sécurisée* — que même le système d’exploitation de la machine ne peut pas inspecter. Intel SGX (Software Guard Extensions), l’implémentation la plus connue, est décrit sur Wikipedia comme « un ensemble de codes d’instruction implémentant un environnement d’exécution de confiance intégré à certains processeurs centraux (CPU) Intel » ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Concrètement, « SGX implique le chiffrement par le CPU d’une portion de mémoire (l’enclave) », de sorte que « les données et le code provenant de l’enclave sont déchiffrés à la volée dans le CPU, ce qui les protège contre l’examen ou la lecture par d’autres codes », y compris « du code exécuté à des niveaux de privilège plus élevés, comme le système d’exploitation et les hyperviseurs sous-jacents » ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**Ce qu’il masque :** les données et le code à l’intérieur de l’enclave vis-à-vis de tous les autres processus de la même machine, y compris d’un OS compromis — utile lorsque vous devez faire confiance à l’exécution d’un fragment de code précis sans faire confiance à l’opérateur du serveur.

**Hypothèse de confiance :** contrairement aux ZKP, au FHE ou au MPC, qui reposent uniquement sur les mathématiques, un TEE vous demande de faire confiance au matériel et au firmware du fabricant de puces. Cette confiance a été mise à l’épreuve : SGX « ne protège pas contre les attaques par canaux auxiliaires », et des chercheurs ont démontré à plusieurs reprises des compromissions pratiques, depuis l’extraction de « clés RSA d’enclaves SGX exécutées sur le même système en cinq minutes » (2017) jusqu’à l’attaque Foreshadow qui « combine exécution spéculative et dépassement de tampon pour contourner SGX » (2018), en passant par des vulnérabilités ultérieures, dont Plundervolt, LVI, SGAxe et ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). Cet historique explique pourquoi les TEE sont généralement décrits comme un compromis pragmatique et plus rapide plutôt que comme une garantie cryptographique hermétique.

**Exemples de projets :** le réseau Sapphire d’[Oasis Protocol](https://oasis.net/technology) exécute des contrats intelligents à l’intérieur d’enclaves matérielles afin que les utilisateurs puissent « exécuter du code dans des enclaves sécurisées par le matériel », où « les données restent chiffrées même pour les opérateurs de serveurs », tandis que « chaque exécution produit une preuve cryptographique que les utilisateurs peuvent vérifier sans confiance aveugle » — fournissant des « contrats intelligents confidentiels » qui conservent « compatibilité et composabilité EVM » ([oasis.net](https://oasis.net/technology)). Secret Network et plusieurs produits de confidentialité liés au restaking s’appuient également sur les TEE, souvent en combinaison avec d’autres techniques pour une défense en profondeur.

**Le compromis :** les TEE s’exécutent à une vitesse proche du natif — bien plus rapide que le FHE ou les lourdes preuves ZK — ce qui les rend attrayants pour les applications sensibles à la latence. Mais cette vitesse découle de la confiance accordée à un matériel dont l’historique réel et documenté d’attaques par canaux auxiliaires est établi ; les systèmes fondés sur les TEE sont donc généralement moins robustes dans leurs hypothèses de confiance les plus défavorables que les approches cryptographiques pures.

---

## Signatures en anneau et adresses furtives

La dernière paire de techniques protège une cible plus étroite mais très pratique : masquer *qui* a envoyé une transaction et *qui* l’a reçue, même lorsque la transaction elle-même reste visible sur la chaîne. [Monero](https://www.getmonero.org/) est le principal exemple de production pour les deux.

Les **signatures en anneau** masquent l’expéditeur. La documentation de Monero explique qu’« une signature en anneau est un type de signature numérique pouvant être effectuée par tout membre d’un groupe d’utilisateurs possédant chacun des clés », et qu’« il devrait être impossible, en pratique, de déterminer laquelle des clés des membres du groupe a servi à produire la signature » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). En pratique, une transaction Monero mélange la clé du véritable dépensier avec des clés publiques leurres « extraites de la blockchain à l’aide d’une méthode de distribution gamma », de sorte que, dans un « anneau » de signataires possibles, tous les membres de l’anneau sont égaux et valides, et « aucun observateur extérieur ne peut savoir lequel des signataires possibles d’un groupe de signatures appartient à votre compte » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

Les **adresses furtives** masquent le destinataire. Au lieu de réutiliser une adresse publique, « l’expéditeur [crée] des adresses aléatoires à usage unique pour chaque transaction au nom du destinataire », de sorte que les paiements entrants « vont vers des adresses uniques sur la blockchain, où ils ne peuvent être reliés ni à l’adresse publiée du destinataire ni aux adresses d’autres transactions » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). Un destinataire utilise une clé de visualisation privée pour parcourir la chaîne à la recherche de paiements et une clé de dépense privée pour les déplacer ; ainsi, « seuls l’expéditeur et le destinataire peuvent déterminer où un paiement a été envoyé » ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**Ce qu’elles masquent :** l’identité de l’expéditeur (signatures en anneau) et celle du destinataire (adresses furtives) ; les *montants* des transactions sont masqués par un mécanisme distinct (Confidential Transactions / RingCT), que ces deux techniques seules ne couvrent pas.

**Le compromis :** ces deux techniques fonctionnent efficacement sur du matériel ordinaire, sans surcharge de preuve ni dépendance à une enclave, ce qui les rend bien adaptées à un réseau de paiements actif. Mais leur modèle de confiance repose sur le fait que les ensembles de leurres soient statistiquement indiscernables du véritable signataire — la sélection de leurres de faible qualité ou les heuristiques d’analyse de blockchain ont historiquement réduit les ensembles d’anonymat lors des premiers déploiements de signatures en anneau ; les choix de paramètres (taille de l’anneau, distribution des leurres) comptent donc autant que le mécanisme cryptographique sous-jacent.

---

## Comparaison des cinq approches

| Technologie | Ce qu’elle masque | Hypothèse de confiance | Coût en performances | Maturité actuelle | Exemples de projets |
|---|---|---|---|---|---|
| Preuves à divulgation nulle de connaissance | Données/calcul sous-jacents ; seule la validité de la preuve est révélée | Mathématiques cryptographiques (+ configuration de confiance pour certains systèmes) | Coût élevé pour générer des preuves ; coût faible pour les vérifier | Production à grande échelle (rollups, paiements protégés) | zkSync, Starknet, Zcash |
| Chiffrement entièrement homomorphe | Toutes les données pendant le calcul, y compris vis-à-vis du fournisseur de calcul | Mathématiques cryptographiques (fondées sur les réseaux) | Surcharge de calcul très élevée | Première phase de production ; recherche active sur l’accélération matérielle | Zama, Fhenix |
| Calcul multipartite sécurisé | L’entrée individuelle de chaque partie | Majorité honnête/seuil parmi les participants | Modéré ; cycles de communication supplémentaires | Mature et largement déployé dans la garde | Fireblocks et d’autres dépositaires à signatures à seuil |
| Environnements d’exécution de confiance | Données/code vis-à-vis de tous les autres processus, y compris l’OS | Fournisseur de matériel/firmware (fabricant de puces) | Vitesse proche du natif | En production, mais avec un historique documenté d’attaques par canaux auxiliaires | Intel SGX, Oasis Sapphire |
| Signatures en anneau et adresses furtives | Identité de l’expéditeur et identité du destinataire | Indiscernabilité statistique des ensembles de leurres | Faible ; efficace sur du matériel standard | Mature, actif depuis plus de dix ans | Monero |

Aucune technologie ne l’emporte sur tous les axes — c’est pourquoi la recherche actuelle les combine de plus en plus, par exemple des preuves ZK vérifiant l’exactitude d’un calcul MPC, ou des TEE utilisés avec le FHE pour une défense en profondeur.

---

## Lien avec les domaines tokenisés

Les [domaines tokenisés](/fr/glossary/tokenize/) héritent de la même transparence par défaut que tout autre actif sur la chaîne : les transferts de propriété, les offres et les mises à jour de métadonnées sont lisibles publiquement. C’est surtout une fonctionnalité — la provenance et l’historique de propriété sont précisément ce qui rend un [domaine tokenisé](/fr/blog/what-are-tokenized-domains/) digne de confiance en tant qu’actif échangeable — mais cela signifie aussi que les avoirs et les prix de vente d’un portefeuille de domaines sont visibles pour toute personne qui surveille la chaîne.

Les technologies de confidentialité présentées dans ce guide indiquent l’orientation possible de l’infrastructure des domaines sous forme de NFT : la garde à seuil fondée sur le MPC sécurise déjà les [portefeuilles](/fr/glossary/wallet/) institutionnels qui détiennent des NFT de domaines, de la même manière qu’elle sécurise d’autres actifs numériques ; les preuves ZK pourraient un jour permettre à un enchérisseur de prouver qu’il peut se permettre une offre sans révéler l’intégralité de son solde ; et les techniques de calcul confidentiel pourraient permettre à un bureau d’enregistrement ou à une place de marché de vérifier des règles d’éligibilité sans exposer l’identité complète d’un acheteur. Rien de cela n’est déployé aujourd’hui dans la tokenisation des domaines, mais les mécanismes sous-jacents sont ceux qui sécurisent actuellement des milliards de dollars dans les infrastructures DeFi et de garde.

---

## Sources et lectures complémentaires

- [Preuves à divulgation nulle de connaissance — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Résumé de la mise à l’échelle L2BEAT](https://l2beat.com/scaling/summary)
- [Présentation de la technologie Zcash](https://z.cash/technology/)
- [Introduction au chiffrement homomorphe — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Documentation cofhe de Fhenix](https://cofhe-docs.fhenix.zone/)
- [Calcul multipartite sécurisé — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [Qu’est-ce que le MPC ? — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Technologie Oasis Protocol](https://oasis.net/technology)
- [Signatures en anneau — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Adresses furtives — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
