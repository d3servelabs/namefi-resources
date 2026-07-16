---
title: "Preuve à divulgation nulle parfaite vs computationnelle : ce que la distinction signifie vraiment"
date: '2026-05-13'
language: fr
tags: ['cryptography', 'zero-knowledge', 'zk-snark', 'theory']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: "Les preuves à divulgation nulle se déclinent en trois catégories — parfaite, statistique et computationnelle — et la différence est bien plus importante que ne le laissent entendre la plupart des discussions d'ingénierie. Cet article explique chacune d'elles en termes simples, pourquoi presque tous les systèmes ZK en production en 2026 sont computationnels, et ce que cela implique en termes d'avantages et de coûts."
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ["preuve à divulgation nulle", "divulgation nulle parfaite", "divulgation nulle computationnelle", "zk snark", "zk stark", "cryptographie", "simulateur", "schéma d'engagement", "namefi"]
relatedArticles:
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/working-with-domain-brokers/
  - /fr/blog/how-to-win-domain-auctions/
  - /fr/blog/how-to-sell-a-domain-name-you-own/
  - /fr/blog/onchain-domain-custody-and-recovery/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-investing/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/dns/
  - /fr/glossary/web3/
  - /fr/glossary/registry/
---

Quand les acteurs de la crypto parlent de "preuves à divulgation nulle de connaissance" (zero-knowledge proofs), ils font presque toujours référence à une chose précise : un SNARK ou un STARK qui prouve qu'un calcul a été effectué correctement, sans en révéler les entrées. Ce modèle mental convient à la plupart des discussions d'ingénierie. Il occulte cependant une distinction qui devient capitale dès que l'on essaie de raisonner sur *ce que la sécurité garantit réellement*.

Les preuves à divulgation nulle se déclinent en trois catégories formelles—**parfaite** (perfect), **statistique** (statistical), et **computationnelle** (computational)—et elles diffèrent par *ce que le vérificateur peut éventuellement apprendre, même avec des ressources illimitées*. Le système que vous déployez est presque certainement computationnel. Il est utile de comprendre pourquoi, et ce que cela implique.

## La forme d'une preuve à divulgation nulle

La configuration classique : un *prouveur* veut convaincre un *vérificateur* qu'une affirmation est vraie, sans que le vérificateur n'apprenne quoi que ce soit d'autre. "Vrai" signifie ici quelque chose comme "Je connais un `x` tel que `H(x) = y`" ou "Je connais un chemin dans ce graphe" ou "J'ai exécuté ce programme correctement sur des données d'entrée privées."

Un système de preuve est à **divulgation nulle** lorsque, de manière informelle, *le vérificateur aurait pu générer la preuve lui-même sans connaître le secret*. Formellement, cela se traduit par l'existence d'un **simulateur** : un algorithme en temps polynomial qui, à partir de la seule affirmation publique (sans témoin ou *witness*), produit une transcription de preuve indiscernable d'une transcription réelle.

Les trois catégories de divulgation nulle diffèrent par la signification du terme "indiscernable".

### Divulgation nulle parfaite

Le résultat du simulateur est **distribué de manière identique** à une preuve réelle. Il n'existe aucun test statistique, aucun test exécutable par un ordinateur quantique, aucun test réalisable en 10^100 ans, qui permette de distinguer le simulateur du vrai prouveur. Mathématiquement, les deux distributions sont les *mêmes*.

C'est la référence absolue. Cela signifie que : même un adversaire aux capacités illimitées — sans limite de temps, sans aucune hypothèse de calcul — n'apprend absolument rien de la preuve.

### Divulgation nulle statistique

Le résultat du simulateur est **statistiquement proche** d'une preuve réelle. La distance de variation totale entre les deux distributions est négligeable. En principe, un adversaire illimité pourrait apprendre quelque chose, mais la quantité d'informations qu'il pourrait en tirer diminue de manière exponentielle en fonction du paramètre de sécurité.

À toutes fins pratiques, la ZK statistique est aussi efficace que la ZK parfaite. Le simulateur n'a simplement pas besoin de correspondre exactement à la distribution réelle ; il doit s'en approcher suffisamment pour qu'aucune puissance de calcul ne puisse amplifier l'écart.

### Divulgation nulle computationnelle

Le résultat du simulateur est **computationnellement indiscernable** d'une preuve réelle : aucun algorithme en *temps polynomial* ne peut les différencier. Un adversaire aux capacités illimitées — capable de forcer la fonction de hachage sous-jacente ou de résoudre le problème complexe sur lequel elle repose — pourrait très bien être en mesure de les distinguer et de découvrir le témoin (*witness*).

C'est la plus faible des trois catégories, au sens formel, et c'est celle qu'offrent en réalité presque tous les systèmes modernes.

## Pourquoi presque tous les systèmes ZK en production sont computationnels

Il y a un théorème derrière tout cela : **pour les langages NP-complets, il est peu probable que la divulgation nulle parfaite existe** à moins que la hiérarchie polynomiale ne s'effondre ([Goldreich et Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). En d'autres termes, si vous voulez prouver des affirmations *arbitraires* sans rien divulguer — des affirmations aussi expressives que "J'ai exécuté ce programme correctement" — vous ne pouvez pas obtenir de ZK parfaite sans que la preuve elle-même ne dépende d'hypothèses de complexité non prouvées.

Ce que vous *pouvez* obtenir pour des affirmations NP arbitraires :

- **Des preuves à divulgation nulle computationnelle**, qui existent si les fonctions à sens unique existent. ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852).)
- **Une divulgation nulle statistique pour des classes limitées** d'affirmations (problèmes auto-réductibles aléatoires, isomorphisme de graphes), mais pas pour les problèmes NP généraux.

Ainsi, lorsqu'un système réel — Groth16, PLONK, Halo2, STARK, Bulletproofs — se dit "zero-knowledge", cela signifie presque toujours une divulgation nulle *computationnelle*. La preuve ne révèle rien à un vérificateur en temps polynomial, sous réserve d'hypothèses concernant les courbes elliptiques, les fonctions de hachage ou d'autres primitives cryptographiques.

Si ces hypothèses s'effondrent — par exemple, si un futur algorithme résout le problème du logarithme discret sur une courbe dont dépend un système — l'argument de la divulgation nulle peut s'affaiblir rétroactivement. Ce qui devient possible dépend exactement de la construction du système : un attaquant pourrait être capable de distinguer les transcriptions réelles des simulées, de forger des preuves ou d'extraire des informations qui étaient auparavant protégées. Il ne faut pas supposer que les anciennes transcriptions ZK computationnelles conserveront la même marge de confidentialité une fois leurs hypothèses sous-jacentes compromises.

## Un exemple concret : les schémas d'engagement

Les schémas d'engagement (commitment schemes) rendent cette distinction très concrète.

Un engagement revient en gros à dire : "J'enferme une valeur `v` dans une enveloppe scellée `c`, je te remets l'enveloppe, et je révélerai `v` plus tard. Tu pourras vérifier que j'ai bien révélé la valeur d'origine, mais tu ne peux pas regarder `v` avant que je ne le décide."

Deux propriétés de sécurité entrent en jeu :

- **Le masquage (Hiding)** — l'enveloppe ne révèle rien sur `v`.
- **La contrainte (Binding)** — je ne peux pas ouvrir l'enveloppe et présenter une valeur différente de celle à laquelle je me suis engagé au départ.

Il est impossible d'avoir les deux de manière parfaite. Un engagement au masquage parfait est computationnellement contraignant (avec suffisamment de puissance de calcul, un attaquant peut trouver une deuxième ouverture). Un engagement parfaitement contraignant est computationnellement masqué (avec suffisamment de calculs, un attaquant peut extraire la valeur engagée).

Les [engagements de Pedersen](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) ont un masquage parfait et une contrainte computationnelle — ils ne révèlent *rien* de la valeur engagée, même face à un attaquant illimité, mais une future faille dans le logarithme discret permettrait de tricher sur la contrainte. Les engagements basés sur le hachage (`c = H(v || r)`) sont computationnellement masqués et (lorsque le hachage résiste aux collisions) computationnellement contraignants.

La catégorie que vous choisirez dépend de la propriété dont on peut tolérer l'affaiblissement avec le temps. Pour garantir la confidentialité à long terme d'un vote ou d'une enchère, on privilégie généralement un masquage parfait, même si la contrainte n'est que computationnelle — car il est possible de reprouver la contrainte avant que l'hypothèse du logarithme discret ne soit cassée, alors qu'il est impossible de masquer à nouveau un vote divulgué.

## Pourquoi cela compte pour les rollups ZK et les systèmes L2

La plupart des rollups ZK utilisent des SNARK avec une divulgation nulle computationnelle. Les implications pratiques sont les suivantes :

- **Aujourd'hui**, les preuves ne révèlent rien à un attaquant réaliste. La garantie de confidentialité est robuste.
- **À long terme**, les preuves révéleront ce que l'hypothèse sous-jacente protégeait. Si un rollup utilise un SNARK dont la sécurité repose sur le logarithme discret de la courbe BN254, et que BN254 est craquée en 2050, chaque preuve publiée jusque-là pourrait potentiellement être démasquée.
- **Les considérations post-quantiques** sont importantes : les SNARK basés sur le logarithme discret (Groth16, PLONK sur des courbes de couplage standard) ne sont *pas* résistants aux ordinateurs quantiques. Les STARK, qui ne dépendent que de la résistance aux collisions des fonctions de hachage, le sont. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), l'article ayant établi l'acronyme STARK.)
- **La divulgation nulle statistique ou parfaite** est possible dans des contextes restreints (par ex., pour prouver certaines relations algébriques) et est parfois utilisée lorsque le budget de confidentialité à long terme importe davantage que l'expressivité.

Pour des applications telles que le vote anonyme, les canaux de lanceurs d'alerte et d'autres systèmes où les transcriptions pourraient être archivées pendant des décennies, le choix entre la ZK computationnelle et statistique n'est pas qu'un détail d'ordre théorique. C'est ce qui différencie une confidentialité qui résiste à l'adversaire de demain d'une confidentialité qui résiste à n'importe quel adversaire.

## Un arbre de décision simple

Si vous devez choisir un système ZK pour la production :

- **Confidentialité uniquement vis-à-vis du vérificateur, données éphémères, priorité absolue aux performances :** une ZK computationnelle issue d'un SNARK ou STARK éprouvé au combat est suffisante. C'est le cas de la plupart des rollups, systèmes ZK-KYC ou ZK-login.
- **Confidentialité à long terme, grande sensibilité juridique et vis-à-vis des audits :** privilégiez un système basé sur le hachage (STARK) ou reposant sur un engagement de type Pedersen. Documentez bien cette hypothèse.
- **Confidentialité prouvable indépendamment des hypothèses computationnelles :** tournez-vous vers la ZK parfaite ou statistique sur une classe d'affirmations restreinte. Attendez-vous à devoir sacrifier une part d'expressivité ou d'interactivité.

On n'a rien sans rien (il n'y a pas de repas gratuit). Les différentes catégories de ZK impliquent des compromis entre elles et face à l'efficacité du système. La vraie question est de savoir *quel compromis vous choisissez d'accepter en toute conscience*.

## L'approche de Namefi sur cette question

Dans les processus de propriété de domaines, l'utilisation la plus intéressante de la ZK est de prouver que vous possédez un nom de domaine sans révéler *lequel*. Les preuves de propriété comparées à un [registre](/fr/glossary/registry/) *[on-chain](/fr/glossary/on-chain/)* peuvent être réalisées via une ZK computationnelle avec des outils très matures (Groth16, PLONK), et c'est ce sur quoi reposent les systèmes de production d'aujourd'hui. Pour des flux plus sensibles — par exemple, prouver qu'un domaine appartient à un *ensemble* d'entités de confiance sans préciser laquelle — des schémas de ZK statistiques ou parfaits appliqués à des affirmations restreintes peuvent devenir pertinents. L'objectif de cet article est de rendre ce compromis lisible : choisissez ce dont vous avez réellement besoin, et mettez par écrit les hypothèses que vous validez.

## Sources et lectures complémentaires

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich et Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (Article sur STARK, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — [Justin Thaler's "Proofs, Arguments, and Zero-Knowledge"](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), l'ouvrage moderne de référence en la matière.