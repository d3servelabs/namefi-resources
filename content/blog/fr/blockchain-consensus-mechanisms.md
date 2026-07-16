---
title: "Les principaux mécanismes de consensus des blockchains : preuve de travail, preuve d’enjeu et au-delà"
date: '2026-07-02'
language: fr
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 20
format: roundup
description: "Un guide clair des mécanismes de consensus des blockchains : preuve de travail, preuve d’enjeu, preuve d’enjeu déléguée, consensus BFT et rôle de chacun dans la sécurisation d’un réseau."
ogImage: ../../assets/blockchain-consensus-mechanisms-og.jpg
keywords: ["mécanismes de consensus blockchain", "mécanisme de consensus", "preuve de travail", "preuve d’enjeu", "preuve d’enjeu déléguée", "tolérance aux pannes byzantines", "Tendermint", "CometBFT", "preuve d’histoire", "preuve d’autorité", "preuve d’espace", "problème de la double dépense", "finalité de la blockchain", "The Merge d’Ethereum", "minage de Bitcoin", "validateur", "staking", "résistance Sybil", "Namefi"]
relatedArticles:
  - /fr/blog/blockchain-virtual-machines/
  - /fr/blog/blockchain-scaling-approaches/
  - /fr/blog/blockchain-cryptographic-primitives/
  - /fr/blog/blockchain-privacy-technologies/
  - /fr/blog/what-are-tokenized-domains/
relatedGlossary:
  - /fr/glossary/consensus-mechanism/
  - /fr/glossary/proof-of-work/
  - /fr/glossary/proof-of-stake/
  - /fr/glossary/blockchain/
  - /fr/glossary/ethereum/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
---

Toute [Blockchain](/fr/glossary/blockchain/) doit répondre à une question avant qu’on puisse lui confier l’argent de quiconque : qui décide de ce qui s’est passé, et dans quel ordre ? Il n’y a ni banque, ni notaire, ni serveur central pour trancher. Un **mécanisme de consensus** est l’ensemble des règles que les participants d’un réseau suivent pour s’accorder sur un historique unique et partagé des transactions, sans tiers central et sans permettre à quiconque de dépenser deux fois la même pièce.

Ce guide présente les principaux mécanismes de consensus utilisés aujourd’hui, la manière dont chacun choisit réellement le bloc suivant, ainsi que leurs compromis.

---

## Ce que résout réellement le consensus

Deux problèmes rendent difficile l’accord décentralisé.

**Le problème de la double dépense.** Dans un système numérique, une unité de valeur n’est que de la donnée, et la donnée peut être copiée. Sans arbitre, rien n’empêche quelqu’un de diffuser deux transactions contradictoires qui dépensent toutes deux la même pièce. Le livre blanc de Bitcoin formule directement l’objectif : le réseau a besoin « d’un système permettant aux participants de s’accorder sur un historique unique de l’ordre dans lequel les transactions ont été reçues », afin que le destinataire puisse être certain qu’un paiement antérieur ne soit pas annulé par un paiement ultérieur contradictoire ([livre blanc de Bitcoin](https://bitcoin.org/bitcoin.pdf)).

**L’accord sans tiers central.** Dans une base de données ordinaire, la parole d’un opérateur est définitive. Dans un réseau public sans autorisation, chacun peut exécuter un nœud, proposer des transactions et tenter d’ajouter le bloc suivant, y compris des participants susceptibles de mentir, de censurer ou de réécrire l’historique. Un mécanisme de consensus doit rendre l’attaque du registre excessivement coûteuse ou autrement dissuasive, tout en restant suffisamment peu coûteux pour que les participants honnêtes puissent faire fonctionner le réseau.

Chaque mécanisme ci-dessous apporte une réponse différente à la question : « qui propose le bloc suivant, et comment savoir qu’on peut lui faire confiance ? » Les deux axes les plus importants pour les comparer sont la **[résistance Sybil](/fr/glossary/consensus-mechanism/)** — ce qui empêche un attaquant de créer un nombre illimité de fausses identités afin de surpasser tous les autres au vote — et la **finalité** — la rapidité et le caractère définitif avec lesquels une transaction devient irréversible.

---

## Preuve de travail

![Plusieurs mineurs s’affrontent pour résoudre la même énigme de hachage, l’un d’eux brandissant un bloc portant la mention « trouvé ! », tandis que des éclairs illustrent le coût énergétique élevé du minage](../../assets/blockchain-consensus-mechanisms-01-proof-of-work.jpg)

La [preuve de travail](/fr/glossary/proof-of-work/) (Proof of Work, PoW) est le mécanisme introduit par Bitcoin en 2009 et celui auquel la plupart des gens pensent lorsqu’ils entendent le mot « blockchain ». Les mineurs rivalisent pour résoudre une énigme cryptographique : ils hachent à répétition les données d’un bloc candidat avec un nonce jusqu’à ce que le hachage obtenu soit inférieur à une valeur cible. La documentation pour développeurs d’Ethereum décrit simplement cette course : un mineur fait passer « de façon répétée un ensemble de données… dans une fonction mathématique » afin de trouver une solution valide avant les autres ([ethereum.org : preuve de travail](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/#:~:text=When%20racing%20to%20create%20a%20block%2C%20a%20miner%20repeatedly%20put%20a%20dataset)). Celui qui trouve en premier un hachage valide peut proposer le bloc suivant et percevoir la récompense de bloc ainsi que les frais de transaction.

La **résistance Sybil** provient de l’énigme elle-même : calculer des hachages consomme de l’électricité et du matériel réels ; multiplier les identités fictives ne confère donc aucun avantage, seule la puissance de calcul brute compte. **La finalité est probabiliste.** Le livre blanc de Bitcoin indique que les nœuds étendent toujours « la chaîne la plus longue comme étant la bonne » ([livre blanc de Bitcoin](https://bitcoin.org/bitcoin.pdf)), et un destinataire gagne en confiance dans le règlement d’une transaction en attendant que des blocs supplémentaires soient minés au-dessus d’elle : chaque nouveau bloc rend la réécriture de l’historique exponentiellement plus coûteuse, mais aucun bloc isolé n’est instantanément et mathématiquement définitif.

Le compromis est l’énergie. Sécuriser le réseau par des calculs ancrés dans le monde réel implique une consommation d’électricité réelle ; c’est pourquoi le minage de Bitcoin se mesure en térawattheures par an. **Exemples de chaînes :** Bitcoin, Litecoin, Dogecoin et Ethereum avant 2022.

---

## Preuve d’enjeu

![Un validateur verrouille une pile de pièces dans un coffre comme dépôt mis en jeu, puis une roue de loterie le sélectionne pour proposer le bloc suivant, avec une étiquette d’avertissement sur la pénalisation attachée au coffre](../../assets/blockchain-consensus-mechanisms-02-proof-of-stake.jpg)

La [preuve d’enjeu](/fr/glossary/proof-of-stake/) (Proof of Stake, PoS) remplace le travail de calcul par une garantie économique. Au lieu de miner, les participants font du **staking** — ils verrouillent l’actif natif du réseau — et le protocole sélectionne de manière pseudo-aléatoire un participant ayant misé des actifs pour proposer chaque bloc. Le rôle de validateur d’Ethereum fournit une bonne référence : un validateur dépose 32 ETH et exécute un logiciel client ; le protocole sélectionne ensuite aléatoirement « un validateur… pour être le proposeur de bloc à chaque créneau », tandis qu’un comité choisi au hasard parmi les autres validateurs atteste la validité de ce bloc ([ethereum.org : preuve d’enjeu](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=One%20validator%20is%20randomly%20selected%20to%20be%20a%20block%20proposer%20in%20every%20slot)).

La **résistance Sybil** vient de l’enjeu lui-même : créer de nombreux faux validateurs revient simplement à répartir le même capital entre davantage d’identités, ce qui n’apporte aucune influence supplémentaire. Les comportements malhonnêtes, comme proposer des blocs contradictoires ou des attestations incompatibles, sont sanctionnés par le **slashing** : le protocole détruit une partie de l’enjeu du validateur fautif ([ethereum.org : preuve d’enjeu](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=Two%20primary%20behaviors%20can%20be%20considered%20dishonest)). Ethereum finalise les blocs par époques à l’aide d’un mécanisme de points de contrôle (Casper FFG combiné à la règle de choix de fourche LMD-GHOST), offrant des garanties de finalité plus fortes que la preuve de travail pure sans exiger un vote unique de type BFT.

Le compromis principal par rapport à la preuve de travail concerne l’énergie : le staking ne requiert aucun matériel spécialisé rivalisant pour résoudre des énigmes ; ainsi, comme l’indique ethereum.org, « il n’est pas nécessaire d’utiliser beaucoup d’énergie pour des calculs de preuve de travail » ([ethereum.org : preuve d’enjeu](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=there%20is%20no%20need%20to%20use%20lots%20of%20energy%20on%20proof)). L’ampleur de cette économie est bien documentée : une analyse indépendante (CCRI) a conclu que la transition d’Ethereum de la PoW à la PoS en septembre 2022 — « The Merge » — avait réduit de plus de 99.988% la consommation annuelle d’électricité du réseau ([ethereum.org : consommation d’énergie](https://ethereum.org/en/energy-consumption/#:~:text=CCRI%20estimates%20that%20The%20Merge%20reduced%20Ethereum%27s%20annualized%20electricity%20consumption%20by%20more%20than%2099.988%25)). **Exemples de chaînes :** Ethereum, Cardano, Solana (qui utilise la PoS pour la sécurité économique en complément de la preuve d’histoire) et Polkadot.

---

## Preuve d’enjeu déléguée

La preuve d’enjeu déléguée (Delegated Proof of Stake, DPoS) conserve le modèle du staking, mais y ajoute une couche électorale. Au lieu de permettre à chaque participant ayant misé des actifs de proposer individuellement des blocs, les détenteurs de jetons affectent leur enjeu par vote à un petit ensemble de **délégués** (également appelés témoins ou producteurs de blocs), et seul cet ensemble élu produit effectivement les blocs. Le poids de vote évolue avec les jetons détenus ; le secteur résume bien le mécanisme central : « le pouvoir de vote de chaque détenteur de jetons est proportionnel au nombre de jetons qu’il détient », et les élections sont continues, de sorte que les détenteurs peuvent réaffecter leurs votes ou évincer à tout moment les délégués peu performants ([Binance Academy : explication de la preuve d’enjeu déléguée](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)).

La **résistance Sybil** repose toujours sur l’enjeu — les votes sont pondérés par les jetons détenus, et non par le nombre de comptes — mais la *production* des blocs est concentrée dans un petit comité élu plutôt qu’ouverte à tous les participants ayant misé des actifs. Cette concentration est précisément l’objectif : parce que l’ensemble actif des validateurs est restreint et connu à l’avance, les réseaux DPoS « peuvent atteindre des temps de bloc rapides, souvent bien inférieurs à trois secondes » ([Binance Academy : explication de la preuve d’enjeu déléguée](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). Le compromis porte sur la décentralisation : la plupart des réseaux DPoS fonctionnent avec environ « 21 à 101 validateurs actifs », un ensemble bien plus réduit que les centaines ou milliers de validateurs habituels des réseaux PoS ouverts, et l’apathie des votants peut permettre aux mêmes délégués de s’installer durablement ([Binance Academy : explication de la preuve d’enjeu déléguée](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). **Exemples de chaînes :** EOS, TRON et, sous une forme modifiée, de nombreuses premières chaînes applicatives fondées sur le Cosmos SDK.

---

## Consensus de type BFT (Tendermint / CometBFT, PBFT)

![Un conseil de validateurs réuni autour d’une table, où plus des deux tiers lèvent des palettes vertes avec une coche pour valider instantanément un bloc affiché avec une icône de cadenas](../../assets/blockchain-consensus-mechanisms-03-bft.jpg)

Le consensus tolérant aux fautes byzantines (Byzantine Fault Tolerant, BFT) adopte une approche entièrement différente : au lieu de faire la course ou de sélectionner aléatoirement un proposeur par bloc, un ensemble connu de validateurs exécute des tours de vote explicites et ne valide un bloc qu’une fois qu’une supermajorité — généralement plus des deux tiers du pouvoir de vote — l’a approuvé lors de ce même tour. **CometBFT** (le successeur de Tendermint Core, le moteur de consensus qui sous-tend le Cosmos SDK) se décrit comme réalisant la « réplication byzantine tolérante aux fautes (BFT) de machines à états (SMR) pour des machines à états finies, déterministes et arbitraires » ([documentation Cosmos : CometBFT](https://docs.cosmos.network/cometbft)) ; autrement dit, il transforme un ensemble de nœuds exploités indépendamment en un registre cohérent et répliqué, même si certains sont défaillants ou malveillants.

Dans les chaînes de type Tendermint, la **résistance Sybil** est généralement apportée par-dessus le protocole au moyen du staking (les validateurs sont pondérés selon leur enjeu, comme en PoS), tandis que le protocole de vote BFT fournit la **finalité** : dès qu’un bloc recueille la supermajorité requise de signatures de validateurs dans un tour, il est validé et n’est plus susceptible d’être réorganisé comme peut l’être un bloc PoW. Cela permet un règlement rapide et concret : le Cosmos Network met en avant un règlement des transactions en moins d’une seconde entre les chaînes fondées sur CometBFT ([Cosmos Network](https://cosmos.network/#:~:text=%3C1%20second%20transaction%20settlement)), contrairement au modèle PoW où la confirmation exige d’attendre. Le compromis est que les protocoles BFT exigent que l’ensemble des validateurs soit connu et de taille limitée (la charge de communication augmente avec le nombre de validateurs), ce qui plafonne le nombre de validateurs pouvant participer directement. **Exemples de chaînes :** Cosmos Hub et d’autres chaînes Cosmos SDK (CometBFT), Binance Chain et les registres avec autorisation ou d’entreprise fondés sur le modèle original de tolérance aux fautes byzantines pratique (PBFT).

---

## Au-delà : preuve d’histoire, preuve d’autorité, preuve d’espace

Quelques autres mécanismes complètent le paysage ; chacun résout un problème plus circonscrit plutôt que de remplacer la question centrale de la résistance Sybil.

La **preuve d’histoire** (Proof of History, PoH), utilisée par Solana avec la PoS, n’est pas un mécanisme de consensus autonome, mais une horloge cryptographique. Elle insère des horodatages vérifiables directement dans la chaîne en hachant à répétition « les données des états générés précédemment », créant une séquence qui prouve le temps écoulé entre les événements sans que les validateurs aient besoin de communiquer au sujet du temps ([Solana : preuve d’histoire](https://solana.com/news/proof-of-history#:~:text=inserting%20data%20into%20the%20sequence%20by%20appending%20the%20hash%20of%20the%20data%20of%20the%20previously%20generated%20states)). Cette horloge fournit aux validateurs un ordre vérifiable pour le consensus, mais ce n’est pas elle qui exécute les transactions en parallèle. L’exécution parallèle vient de **Sealevel** : les transactions Solana déclarent chaque compte auquel elles accéderont en lecture ou en écriture, ce qui permet à l’environnement d’exécution de traiter simultanément les transactions qui ne se chevauchent pas, ainsi que celles qui ne font que lire le même état ([Solana : Sealevel](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=The%20reason%20why%20Solana%20is%20able%20to%20process%20transactions%20in%20parallel,transactions%20that%20are%20only%20reading%20the%20same%20state%20to%20execute%20concurrently%20as%20well)).

La **preuve d’autorité** (Proof of Authority, PoA) remplace le minage ouvert ou la validation fondée sur l’enjeu par un ensemble restreint de signataires autorisés. Par rapport à la PoW, elle réduit fortement le coût en ressources de la production de blocs ; ethereum.org indique que la PoA évite les besoins élevés en ressources du minage PoW ([ethereum.org : preuve d’autorité](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=as%20it%20overcomes%20the%20need%20for%20high%20quality%20resources%20as%20PoW%20does)). Elle ne supprime toutefois pas les coûts d’exploitation ou de sécurisation du réseau. La charge de la sécurité et de la gouvernance est transférée aux identités et à la réputation des validateurs de confiance, ainsi qu’aux règles d’admission des signataires : la PoA exige de faire confiance à des signataires connus, souvent identifiés au moyen d’une procédure KYC ou par leur appartenance à une organisation identifiable ([ethereum.org : signataires de confiance](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Proof%2Dof%2Dauthority%20requires%20trusting%20a%20set%20of%20authorized%20signers,if%20a%20validator%20does%20anything%20wrong%2C%20their%20identity%20is%20known)), et l’implémentation décrite par ethereum.org permet aux signataires de voter pour ajouter ou retirer leurs pairs ([ethereum.org : admission des signataires](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Each%20signer%20votes%20for%20the%20addition%20or%20removal%20of%20a%20signer%20in%20their%20block%20when%20they%20create%20a%20new%20block)). Ce modèle échange de la décentralisation contre de la rapidité et un faible coût d’exploitation ; il est donc surtout utilisé sur des chaînes privées, des réseaux de test et des réseaux de développement locaux plutôt que sur des réseaux publics adversariaux.

La **preuve d’espace** (et son proche parent, la preuve d’espace-temps) substitue l’espace de stockage sur disque alloué à la puissance de calcul ou à l’enjeu : les participants prouvent qu’ils ont réservé de l’espace inutilisé sur un disque dur, et le protocole leur demande périodiquement de démontrer qu’ils le détiennent toujours. Elle fournit une résistance Sybil comparable à celle de la PoW avec une empreinte énergétique beaucoup plus faible, au prix d’un besoin important en matériel de stockage. Chia en est l’exemple le plus connu.

---

## Comparaison des mécanismes

| Mécanisme | Base de la résistance Sybil | Finalité | Coût énergétique | Décentralisation | Exemples de chaînes |
|---|---|---|---|---|---|
| Preuve de travail | Coût de calcul (hachage) | Probabiliste (confirmations) | Très élevé | Élevée (minage sans autorisation) | Bitcoin, Litecoin, Dogecoin |
| Preuve d’enjeu | Enjeu économique exposé au risque | Par points de contrôle / quasi définitive au sein des époques | Très faible | Élevée (centaines de milliers de validateurs) | Ethereum, Cardano, Polkadot |
| Preuve d’enjeu déléguée | Vote pondéré par l’enjeu pour les délégués | Rapide, quasi instantanée par producteur élu | Très faible | Plus faible (petit ensemble élu de validateurs) | EOS, TRON |
| Type BFT (Tendermint/CometBFT, PBFT) | Enjeu ou identité autorisée + vote à supermajorité | Instantanée/déterministe une fois validée | Faible | Modérée (ensemble de validateurs limité) | Cosmos Hub, Binance Chain |
| Preuve d’autorité | Identité/réputation contrôlée | Rapide, quasi instantanée | Très faible | Faible (petit ensemble de validateurs de confiance) | Chaînes privées/d’entreprise, réseaux de test |
| Preuve d’espace | Capacité de stockage allouée | Probabiliste (par blocs) | Faible | Modérée (dépend du matériel de stockage) | Chia |

---

## Le lien avec les domaines tokenisés

Les mécanismes de consensus constituent le socle invisible de chaque [domaine tokenisé](/fr/blog/what-are-tokenized-domains/). Lorsqu’un domaine `.com`, `.ai` ou `.io` est frappé sous forme de [NFT (jeton non fongible)](/fr/glossary/nft/), le consensus de la chaîne sécurise l’enregistrement onchain de sa propriété, ainsi que tout transfert du jeton ou règlement de vente qui y est consigné. Il ne remplace pas les processus du bureau d’enregistrement et du registre qui assurent le renouvellement du domaine DNS sous-jacent et maintiennent la validité de son enregistrement. Un NFT de domaine frappé sur [Ethereum](/fr/glossary/ethereum/) hérite des garanties de finalité par points de contrôle de la PoS d’Ethereum ; le même actif sur une chaîne PoW hérite du modèle de confirmation probabiliste de cette chaîne. Les frais de transaction et le délai constaté par les utilisateurs avant le règlement effectif dépendent également de la capacité d’exécution, de la demande sur le réseau et du recours à la L1 ou à une L2 : ils ne sont pas déterminés par le seul choix entre PoW et PoS. Comprendre le mécanisme qui sous-tend une chaîne, ce qu’il sécurise réellement et la portée de ses garanties de résistance Sybil et de finalité fait partie de l’évaluation de tout actif onchain, y compris les domaines tokenisés.

---

## Sources et lectures complémentaires

- [Bitcoin : un système de monnaie électronique pair à pair (livre blanc de Nakamoto)](https://bitcoin.org/bitcoin.pdf)
- [ethereum.org — preuve de travail](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/)
- [ethereum.org — preuve d’enjeu](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- [ethereum.org — preuve d’autorité](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/)
- [ethereum.org — consommation d’énergie](https://ethereum.org/en/energy-consumption/)
- [Documentation Cosmos — CometBFT](https://docs.cosmos.network/cometbft)
- [Cosmos Network](https://cosmos.network/)
- [Binance Academy — explication de la preuve d’enjeu déléguée](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)
- [Solana — preuve d’histoire](https://solana.com/news/proof-of-history)
- [Solana — Sealevel : traitement parallèle de milliers de contrats intelligents](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
