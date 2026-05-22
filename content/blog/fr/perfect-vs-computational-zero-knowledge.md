---
title: "Zero-Knowledge parfait vs computationnel : Ce que la distinction signifie réellement"
date: '2026-05-13'
language: fr
tags: ["cryptographie", "zero-knowledge", "zk-snark", "théorie"]
authors: ['namefiteam']
draft: false
description: "Les preuves à divulgation nulle (zero-knowledge) se déclinent en trois variantes — parfaites, statistiques et computationnelles — et leur différence compte bien plus que ce que la plupart des discussions techniques ne le laissent entendre. Cet article explique chacune d'elles en termes simples, pourquoi presque tous les systèmes ZK en production en 2026 sont computationnels, et ce que cela implique en termes d'avantages et de coûts."
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ["preuve à divulgation nulle", "preuve zero knowledge", "zero knowledge parfait", "zero knowledge computationnel", "zk snark", "zk stark", "cryptographie", "simulateur", "schéma d'engagement", "namefi"]
---

Quand on parle de « preuves à divulgation nulle » (zero-knowledge proofs) dans le milieu de la crypto, on fait presque toujours référence à une chose précise : un SNARK ou un STARK qui prouve qu'un calcul a été effectué correctement, sans en révéler les entrées. Ce modèle mental convient à la plupart des discussions d'ingénierie. Cependant, il masque une distinction qui devient importante dès l'instant où l'on essaie de raisonner sur *ce que la sécurité garantit réellement*.

Les preuves à divulgation nulle se déclinent en trois variantes formelles — le zero-knowledge **parfait**, **statistique** et **computationnel** — qui diffèrent par *ce que le vérificateur peut éventuellement apprendre, même avec des ressources illimitées*. Le système que vous mettez en production est presque certainement computationnel. Il est utile de comprendre pourquoi, et ce que cela vous apporte.

## La forme d'une preuve à divulgation nulle

La configuration classique : un *prouveur* veut convaincre un *vérificateur* qu'une affirmation est vraie, sans que le vérificateur n'apprenne rien d'autre. « Vraie » signifie ici quelque chose comme « Je connais un `x` tel que `H(x) = y` », ou « Je connais un chemin dans ce graphe », ou encore « J'ai exécuté ce programme correctement sur des entrées privées ».

De manière informelle, un système de preuve est **zero-knowledge** (à divulgation nulle) lorsque *le vérificateur aurait pu générer la preuve lui-même sans connaître le secret*. Formellement, cela se traduit par l'existence d'un **simulateur** : un algorithme en temps polynomial qui, en ne recevant que l'affirmation publique (sans le témoin ou *witness*), produit une transcription qu'il est impossible de distinguer d'une véritable transcription de preuve.

Les trois variantes du zero-knowledge diffèrent sur le sens exact de l'expression « impossible de distinguer ».

### Le zero-knowledge parfait

La sortie du simulateur suit une **distribution identique** à celle d'une vraie preuve. Il n'existe aucun test statistique, aucun test que vous pourriez exécuter avec un ordinateur quantique, aucun test que vous pourriez lancer pendant 10^100 ans, qui permette de distinguer le simulateur du véritable prouveur. Mathématiquement, les deux distributions sont *identiques*.

C'est la norme de référence absolue. Cela signifie que : même un adversaire aux capacités illimitées — sans limite de temps, sans hypothèse de calcul — n'apprend absolument rien de la preuve.

### Le zero-knowledge statistique

La sortie du simulateur est **statistiquement proche** d'une vraie preuve. La distance de variation totale entre les deux distributions est négligeable. Un adversaire aux ressources illimitées pourrait en principe apprendre quelque chose, mais la quantité d'informations qu'il pourrait extraire diminue de façon exponentielle avec le paramètre de sécurité.

À toutes fins pratiques, le ZK statistique est aussi performant que le ZK parfait. Le simulateur n'a simplement pas besoin de correspondre exactement à la distribution réelle ; il doit s'en approcher suffisamment pour qu'aucune puissance de calcul ne puisse amplifier l'écart.

### Le zero-knowledge computationnel

La sortie du simulateur est **indiscernable sur le plan computationnel** d'une vraie preuve : aucun algorithme en *temps polynomial* ne peut les différencier. Un adversaire aux capacités illimitées — quelqu'un capable de forcer par force brute la fonction de hachage sous-jacente ou de résoudre le problème mathématique difficile sous-jacent — pourrait très bien être capable de les distinguer et d'apprendre le témoin (*witness*).

C'est la plus faible des trois variantes, au sens formel, et c'est celle qu'offrent concrètement presque tous les systèmes modernes.

## Pourquoi presque tous les systèmes ZK en production sont computationnels

Un théorème se cache derrière cela : **pour les langages NP-complets, il est peu probable que le zero-knowledge parfait existe**, à moins que la hiérarchie polynomiale ne s'effondre ([Goldreich et Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). En d'autres termes, si vous voulez prouver des affirmations *arbitraires* en zero-knowledge — des affirmations aussi expressives que « J'ai exécuté ce programme correctement » — vous ne pouvez pas obtenir un zero-knowledge parfait sans faire dépendre la preuve elle-même d'hypothèses de complexité non prouvées.

Ce que vous *pouvez* obtenir pour des affirmations NP arbitraires :

- **Des preuves à divulgation nulle computationnelles**, qui existent si les fonctions à sens unique existent. ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852).)
- **Un zero-knowledge statistique pour des classes limitées** d'affirmations (problèmes aléatoires auto-réductibles, isomorphisme de graphes), mais pas pour le NP général.

Ainsi, lorsqu'un système réel — Groth16, PLONK, Halo2, STARK, Bulletproofs — se dit « zero-knowledge », cela signifie presque toujours qu'il s'agit d'un zero-knowledge *computationnel*. La preuve ne révèle rien à un vérificateur en temps polynomial, sous réserve d'hypothèses sur les courbes elliptiques, les fonctions de hachage ou d'autres primitives cryptographiques.

Si ces hypothèses s'effondrent — disons qu'un algorithme futur résout le problème du logarithme discret sur une courbe dont dépend un schéma —, l'argument zero-knowledge peut s'affaiblir rétroactivement. Ce qui devient possible dépend exactement de la construction : un attaquant peut être capable de distinguer les transcriptions réelles des transcriptions simulées, de falsifier des preuves ou d'extraire des informations qui étaient auparavant protégées. Vous ne devriez pas présumer que les anciennes transcriptions de ZK computationnel conserveront la même marge de confidentialité après l'effondrement de leurs hypothèses sous-jacentes.

## Un exemple concret : les schémas d'engagement

Les schémas d'engagement (commitment schemes) rendent cette distinction très concrète.

Un engagement, c'est en gros : « Je verrouille une valeur `v` dans une enveloppe scellée `c`, je vous remets l'enveloppe, et je révèle `v` plus tard. Vous pouvez vérifier que j'ai bien révélé la valeur originale, mais vous ne pouvez pas regarder `v` avant que je ne la révèle. »

Deux propriétés de sécurité entrent en jeu :

- **Le masquage (Hiding)** — l'enveloppe ne révèle rien sur `v`.
- **La liaison (Binding)** — je ne peux pas ouvrir l'enveloppe pour révéler une valeur autre que celle à laquelle je me suis engagé à l'origine.

Vous ne pouvez pas avoir les deux de manière parfaite simultanément. Un engagement au masquage parfait est computationnellement lié (avec suffisamment de calculs, un attaquant peut trouver une deuxième ouverture valide). Un engagement parfaitement lié est computationnellement masqué (avec suffisamment de calculs, un attaquant peut extraire la valeur engagée).

Les [engagements de Pedersen](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) offrent un masquage parfait et une liaison computationnelle — ils ne révèlent *rien* sur la valeur engagée, même face à un attaquant aux ressources illimitées, mais une future résolution du logarithme discret permettrait de tricher sur la liaison. Les engagements basés sur le hachage (`c = H(v || r)`) sont computationnellement masqués et (lorsque le hachage résiste aux collisions) computationnellement liés.

La variante que vous choisirez dépend de la propriété qui est autorisée à s'affaiblir avec le temps. Pour la confidentialité à long terme d'un vote ou d'une enchère, vous souhaitez généralement un masquage parfait, même si la liaison n'est que computationnelle — parce que vous pouvez reprouver la liaison avant que l'hypothèse du logarithme discret ne soit brisée, mais vous ne pouvez pas masquer rétroactivement un vote qui a déjà fuité.

## Pourquoi cela est important pour les rollups ZK et les systèmes L2

La plupart des rollups ZK utilisent des SNARK avec un zero-knowledge computationnel. Les implications pratiques sont les suivantes :

- **Aujourd'hui**, les preuves ne révèlent rien à un attaquant réaliste. La garantie de confidentialité est très forte.
- **À long terme**, les preuves révéleront ce que l'hypothèse sous-jacente protège. Si un rollup utilise un SNARK dont la sécurité repose sur le logarithme discret de la courbe BN254, et que la BN254 est brisée en 2050, chaque preuve publiée avant cette date devient potentiellement démasquable.
- **Les considérations post-quantiques** ont leur importance : les SNARK basés sur le logarithme discret (Groth16, PLONK sur des courbes de couplage standard) ne sont *pas* sécurisés face aux attaques quantiques. Les STARK, qui reposent uniquement sur la résistance aux collisions de hachage, le sont. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), l'article fondateur de l'acronyme STARK.)
- **Le ZK statistique ou parfait** est possible dans des contextes restreints (par exemple, pour prouver certaines relations algébriques) et est parfois utilisé lorsque le budget de confidentialité à long terme est plus important que l'expressivité.

Pour des applications telles que le vote anonyme, les canaux de lanceurs d'alerte et d'autres systèmes où les transcriptions peuvent être archivées pendant des décennies, le choix entre un ZK computationnel et statistique n'est pas un détail de puriste. C'est la différence entre une confidentialité qui résiste à l'adversaire de demain et une confidentialité qui résiste à n'importe quel adversaire.

## Un arbre de décision simple

Si vous devez choisir un système ZK pour la production :

- **Confidentialité limitée au vérificateur, données à courte durée de vie, la performance prime :** un ZK computationnel issu d'un SNARK ou d'un STARK éprouvé au combat est idéal. C'est le cas de la majorité des rollups, des processus de KYC basés sur ZK et de l'authentification ZK (ZK-login).
- **Confidentialité à long terme, sensibilité juridique ou d'audit :** privilégiez un système basé sur le hachage (STARK) ou un engagement de type Pedersen en arrière-plan. Documentez rigoureusement votre hypothèse.
- **Confidentialité prouvable indépendamment des hypothèses de calcul :** vous recherchez un ZK parfait ou statistique sur une classe d'affirmations restreinte. Attendez-vous à devoir faire des concessions sur l'expressivité ou l'interactivité.

Rien n'est gratuit. Les différentes variantes du ZK impliquent des compromis entre elles et face à l'efficacité. La véritable question est de savoir *quel compromis vous faites consciemment*.

## L'approche de Namefi sur cette question

Dans les processus liés à la propriété de domaines, l'utilisation la plus intéressante du ZK consiste à prouver que vous possédez un nom sans révéler *lequel*. Les preuves de propriété par rapport à un registre sur la blockchain (on-chain) peuvent être réalisées en ZK computationnel avec des outils très matures (Groth16, PLONK), et c'est ce qui fait tourner les systèmes de production d'aujourd'hui. Pour des processus plus sensibles — par exemple, prouver qu'un domaine appartient à un *ensemble* d'entités de confiance sans révéler laquelle —, les schémas de ZK statistiques ou parfaits appliqués à des affirmations restreintes peuvent devenir pertinents. L'objectif de cet article est de rendre ce compromis lisible : choisissez ce dont vous avez réellement besoin, et consignez par écrit les hypothèses que vous acceptez.

## Sources et lectures complémentaires

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich et Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (Article sur les STARK, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — ["Proofs, Arguments, and Zero-Knowledge" de Justin Thaler](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), le manuel moderne de référence.