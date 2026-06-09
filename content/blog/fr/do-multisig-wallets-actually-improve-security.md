---
title: "Les portefeuilles multisig améliorent-ils vraiment la sécurité ? Une analyse par modèle de menace"
date: '2026-05-07'
language: fr
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
description: "Les portefeuilles multisignatures sont largement considérés comme le modèle de conservation sécurisé par défaut dans les cryptomonnaies, mais la réponse à la question « améliorent-ils vraiment la sécurité ? » dépend entièrement du modèle de menace. Cet article explique ce que le multisig permet de contrer, ce qu'il ne peut pas faire, et dans quels cas il peut aggraver la situation."
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['portefeuille multisig', 'multisignature', 'portefeuille safe', 'gnosis safe', 'gestion des clés', 'auto-conservation', 'signature à seuil', 'récupération sociale', 'namefi']
---

Les portefeuilles multisignatures (multisig) — des portefeuilles où M clés sur N doivent signer pour qu'une transaction soit valide — sont généralement présentés comme l'évolution évidente par rapport à un *hot wallet* (portefeuille chaud) à clé unique. La plupart des systèmes de trésorerie des DAO, des plateformes d'échange et des entreprises sérieuses du secteur crypto utilisent une forme ou une autre de multisig (Safe, Squads, Multisig.js, ou des variantes à signature à seuil).

Cette réputation est amplement méritée, mais uniquement face à un modèle de menace *spécifique*. Le multisig permet de déjouer certaines des méthodes de vol de fonds les plus courantes, mais s'avère presque inutile contre d'autres. Voici la version honnête : ce pour quoi le multisig est réellement efficace, ses lacunes, et les cas où son adoption peut rendre une configuration *moins* sûre.

## Ce qu'est le multisig, très brièvement

Dans un multisig 2-sur-3, il existe trois clés privées ; deux d'entre elles doivent signer une transaction pour qu'elle soit exécutée sur la chaîne (*on-chain*). Le portefeuille lui-même est un contrat intelligent (dans l'écosystème Ethereum / EVM) ou un type de sortie multisig natif (sur Bitcoin via [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). Le contrat vérifie les signatures puis transmet la transaction.

L'implémentation la plus utilisée dans les écosystèmes EVM est [Safe](https://safe.global/) (anciennement Gnosis Safe). Sur Solana, [Squads](https://squads.so/) joue le même rôle. Bitcoin possède une longue histoire de prise en charge native du multisig, souvent combinée à des portefeuilles matériels (*hardware wallets*) via des [flux de travail PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Les schémas de signature à seuil (TSS, FROST, MPC) permettent d'obtenir un résultat similaire avec une seule clé on-chain — chaque signataire détient une *part* de la clé privée et ils signent conjointement sans jamais la reconstituer. Du point de vue du modèle de menace, la plupart des points ci-dessous s'appliquent indifféremment aux deux approches, avec quelques nuances précisées plus loin.

## Ce que le multisig permet de déjouer (les bonnes nouvelles)

### La compromission d'une clé unique

C'est le principal avantage. Si le portefeuille matériel d'un signataire est volé, si son téléphone est infecté par un malware, ou si sa phrase de récupération (*seed phrase*) est divulguée, un attaquant détenant cette seule clé ne peut pas déplacer les fonds. Il lui faut compromettre simultanément au moins M-1 autres clés.

Pour une configuration 2-sur-3, cela signifie que l'attaquant doit compromettre *deux points d'accès indépendants*, idéalement détenus par des personnes différentes, sur du matériel différent, dans des lieux physiques différents. La probabilité de deux compromissions indépendantes dans le même laps de temps est généralement de plusieurs ordres de grandeur inférieure à celle d'une seule.

### Le risque interne (menace de l'initié)

Une seule personne ayant la garde totale des fonds peut démissionner avec fracas, faire défection, subir des pressions ou tout simplement commettre une erreur catastrophique. Le multisig rend la collusion obligatoire. Pour les DAO et les entreprises, c'est souvent la motivation *principale* — le gain de sécurité face aux attaquants externes passe au second plan derrière l'avantage en matière de gouvernance face à n'importe quel acteur interne individuel.

### La récupération en cas de perte de clé

Dans une configuration M-sur-N avec N > M, la perte d'une clé n'est pas catastrophique. Les autres signataires peuvent transférer les fonds vers un nouveau multisig et remplacer la clé perdue. Il s'agit d'une amélioration significative par rapport à la conservation à clé unique, où la perte d'une *seed phrase* équivaut à une perte définitive.

### L'hameçonnage (phishing) de l'utilisateur

De nombreuses attaques par hameçonnage ciblant les portefeuilles (faux sites d'airdrop, approbations de jetons malveillants, contrats de type "drainer") reposent sur le fait que l'utilisateur signe une transaction malveillante lors d'une seule session de navigation. Un multisig ajoute une étape de confirmation sur une interface différente — une interface de coordination comme celle de Safe, ou une approbation matérielle sur plusieurs appareils — ce qui offre à l'utilisateur une nouvelle occasion de se rendre compte qu'il signe une transaction non désirée.

## Ce que le multisig ne peut pas empêcher (la partie qui fâche)

C'est la section que la plupart des analyses rapides omettent.

### Les bugs de contrat intelligent dans le multisig lui-même

Le multisig est un contrat intelligent (*smart contract*). Si le contrat comporte un bug, toute la gestion rigoureuse des clés du monde ne sera d'aucun secours. L'incident lié à un multisig le plus coûteux de l'histoire — le [gel du multisig Parity](https://www.parity.io/blog/security-alert/) en novembre 2017 — était dû à un bug de contrat, et non à la compromission d'une clé. Environ 150 millions de dollars en ETH ont été rendus définitivement inaccessibles par une seule transaction.

De nos jours, Safe est l'un des contrats les plus audités sur Ethereum et a fait ses preuves, mais le principe demeure : vous échangez « une clé privée à protéger » contre « un contrat intelligent à qui faire confiance ». Cette confiance doit être gagnée et regagnée au fil du temps et des audits.

### La compromission de l'interface de signature

Presque toutes les validations multisig se font via une interface — l'interface web de Safe, un plugin de portefeuille, un tableau de bord personnalisé. Si cette interface est compromise (détournement de DNS, attaque de la chaîne d'approvisionnement sur une dépendance, extension de navigateur malveillante), l'attaquant peut afficher au signataire A « envoyer 1 ETH à alice.eth » tout en transmettant en réalité « envoyer 1000 ETH à attaquant.eth » au portefeuille matériel pour signature.

La plupart des portefeuilles matériels affichent *effectivement* l'adresse de destination réelle, mais les signataires ne font souvent que la survoler. L'[incident de Bybit](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) survenu début 2025 reposait sur la compromission d'une interface Safe ; tous les signataires ont approuvé ce qu'ils pensaient être une transaction de routine, alors que le contrat proxy était en train d'être modifié.

Le multisig vous protège contre un attaquant qui ne possède *qu'une* seule clé. Il ne vous protège pas contre un attaquant capable de soumettre la mauvaise transaction à l'ensemble de vos signataires.

### L'hameçonnage coordonné de plusieurs signataires

Si les signataires sont connus et joignables — et c'est généralement le cas pour toute trésorerie dont l'adresse Safe est publique —, un attaquant peut tous les cibler. Il lance la même campagne d'hameçonnage auprès de chaque signataire. Puis il attend. Si deux signataires sur trois sont fatigués, distraits ou baissent la garde le même jour, le seuil est atteint.

En pratique, il s'agit de l'attaque la plus réaliste contre des multisigs bien gérés. Les défenses pour la contrer sont principalement procédurales et non techniques : la confirmation hors bande de chaque transaction sur un canal séparé (Signal, une autre messagerie, un appel téléphonique), et une politique stricte exigeant que toute transaction supérieure à X $ soit discutée de vive voix avant d'être signée.

### La compromission du stockage des clés hors chaîne (off-chain)

Si les « clés de signature » sont en réalité un système 2-sur-3 réparti entre les *seed phrases* MetaMask de deux ingénieurs et un portefeuille matériel placé dans le coffre-fort du bureau, vous avez un problème de sécurité opérationnelle (OPSEC) déguisé en multisig. Le seuil est techniquement respecté, mais la diversité est illusoire. Une infection par un malware sur les ordinateurs portables des deux ingénieurs, ou une seule effraction dans le bureau, suffit à compromettre le seuil.

Une véritable diversité exige :

- Différents modèles de matériel (un Ledger, un Trezor, un Keystone).
- Différents systèmes d'exploitation pour toute signature logicielle.
- Différents lieux physiques pour tout stockage persistant.
- Différents individus, le cas échéant, avec des profils de menace différents.

### La perte au-delà du seuil

Le revers de la médaille concernant la récupération : dans un 2-sur-3, la perte de *deux* clés est définitive. Dans un 3-sur-5, la perte de trois clés est définitive. Plus l'écart entre M et N est grand, plus on est protégé contre les pertes individuelles — mais plus il est facile pour un attaquant de trouver M signataires à hameçonner.

C'est une tension inévitable. Un M élevé offre plus de sécurité face aux attaques externes, mais réduit les possibilités de récupération. Un M faible facilite la récupération, mais rend l'attaque plus aisée. Aucune configuration ne permet d'optimiser les deux aspects en même temps.

## Dans quels cas le multisig peut aggraver la situation

Quelques cas concrets et pragmatiques :

- **Pour les très petits soldes**, la lourdeur opérationnelle du multisig (coordination des transactions, frais de gaz sur EVM, courbe d'apprentissage) peut engendrer des erreurs qui n'auraient pas lieu avec une conservation à clé unique. L'outil approprié pour 200 $ d'argent de poche en cryptomonnaie est une clé unique sécurisée par un portefeuille matériel.
- **Pour les utilisateurs individuels qui considèrent le multisig comme un système de récupération** mais qui, en pratique, conservent les trois clés sur des appareils qu'ils sont les seuls à contrôler, le multisig ajoute de la complexité sans modifier le modèle de menace. Si un attaquant parvient à compromettre l'un de ces appareils aujourd'hui, il pourra probablement tous les compromettre.
- **Pour les organisations qui ne disposent pas d'une véritable diversité de signataires** — tout le monde dans le même bureau, sur le même VPN, utilisant le même système d'authentification unique (SSO) —, le seuil devient une simple formalité.

Dans ces trois cas de figure, la solution n'est pas « d'utiliser la conservation à clé unique ». La solution consiste à « utiliser le multisig *correctement*, ou à faire appel à un dépositaire qui le fait ». Toutefois, c'est en s'imaginant que le type de contrat garantit à lui seul la sécurité, indépendamment des pratiques opérationnelles, que surviennent les pertes les plus médiatisées.

## À quoi ressemble une bonne configuration

Un multisig 2-sur-3 ou 3-sur-5 fonctionne bien en tant qu'outil de contrôle de trésorerie lorsque *toutes* les conditions suivantes sont remplies :

- Les signataires sont des personnes différentes, situées dans des juridictions différentes si possible.
- Les appareils de signature sont de marques différentes, avec des systèmes d'exploitation (OS) différents.
- Un canal de communication distinct est utilisé pour la confirmation des transactions, de manière indépendante de l'interface de signature.
- Il existe un processus documenté pour vérifier les données de la transaction (*payload*) par rapport à un différentiel (*diff*) attendu — *calldata*, cible, valeur — avant que le moindre signataire ne l'approuve.
- Le contrat multisig lui-même est rigoureusement audité (Safe est le choix par défaut le plus sûr en 2026) et sa version est figée et connue.
- Une procédure de remplacement des signataires existe et a été testée.

Cela requiert bien plus de discipline que la plupart des équipes ne l'imaginent au départ. La bonne nouvelle, c'est que cette discipline ne nécessite qu'un investissement initial ; la mauvaise, c'est qu'elle compte davantage que le contrat lui-même.

## Le lien avec les noms de domaine

La gestion des noms de domaine offre l'une des analogies les plus parlantes au multisig dans le monde hors chaîne (*off-chain*). Un domaine contrôlé par un compte unique chez un bureau d'enregistrement (*registrar*), protégé par un seul mot de passe, équivaut à un portefeuille à clé unique. Un domaine protégé par un verrouillage du *registrar* + un verrouillage du registre + une authentification à double facteur (2FA) chez le fournisseur DNS + de multiples fournisseurs faisant autorité, constitue, structurellement parlant, un multisig : plusieurs facteurs indépendants doivent tous être compromis avant que le nom de domaine ne puisse être transféré.

Namefi va plus loin en matérialisant la propriété sous la forme d'un enregistrement on-chain qui peut être directement détenu dans un portefeuille multisig. Le même mécanisme à seuil qui protège une trésorerie peut désormais protéger le *plan de contrôle DNS* — ainsi, une seule personne victime d'hameçonnage ne peut pas plus perdre le domaine de l'entreprise qu'elle ne peut vider la trésorerie à elle seule. L'amélioration du modèle de menace est identique dans les deux mondes : remplacer « faire confiance à un seul identifiant » par « compromettre M facteurs indépendants sur N ».

## Sources et lectures complémentaires

- Safe — [Contrats de comptes intelligents et audits](https://safe.global/).
- IETF FROST — [RFC 9591, le protocole Flexible Round-Optimized Schnorr Threshold](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Post-mortem du gel du multisig](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Guide pratique pour gérer un multisig Safe](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).