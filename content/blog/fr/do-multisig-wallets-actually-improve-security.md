---
title: 'Les portefeuilles multisig améliorent-ils vraiment la sécurité ? Une approche par modèle de menace'
date: '2026-05-07'
language: fr
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
description: "Les portefeuilles multisignatures sont largement considérés comme le modèle de conservation sécurisé par défaut dans la cryptographie, mais la réponse à la question \"améliorent-ils vraiment la sécurité ?\" dépend entièrement du modèle de menace. Cet article explique ce que le multisig permet d'éviter, ce qu'il ne permet pas de faire, et dans quels cas il peut aggraver la situation."
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['portefeuille multisig', 'multisignature', 'portefeuille safe', 'gnosis safe', 'gestion des clés', 'auto-conservation', 'signature à seuil', 'récupération sociale', 'namefi']
---

Les portefeuilles multisignatures — des portefeuilles où M clés sur N doivent signer pour qu'une transaction soit valide — sont généralement présentés comme l'évolution logique par rapport à un portefeuille chaud (hot wallet) à clé unique. La plupart des configurations de trésorerie dans les DAO, les plateformes d'échange et les entreprises sérieuses natives de la crypto utilisent une variante de multisig (Safe, Squads, Multisig.js, variantes de signatures à seuil).

Cette réputation est amplement méritée, mais uniquement face à un modèle de menace *spécifique*. Le multisig déjoue certaines des méthodes les plus courantes de vol de fonds, mais ne peut presque rien contre d'autres. Voici la version honnête : ce pour quoi le multisig est réellement efficace, ses lacunes, et les cas où son adoption peut rendre une configuration *moins* sûre.

## Ce qu'est le multisig, très brièvement

Dans un multisig 2-sur-3, trois clés privées existent ; deux d'entre elles doivent signer une transaction pour qu'elle s'exécute sur la blockchain (on-chain). Le portefeuille lui-même est un smart contract (dans l'univers Ethereum / EVM) ou un type de sortie multisig natif (sur Bitcoin via [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). Le contrat vérifie les signatures puis transmet la transaction.

L'implémentation la plus utilisée dans les écosystèmes EVM est [Safe](https://safe.global/) (anciennement Gnosis Safe). Sur Solana, [Squads](https://squads.so/) joue le même rôle. Bitcoin possède une longue histoire de prise en charge native du multisig, souvent combinée à des portefeuilles matériels (hardware wallets) via les [flux de travail PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Les schémas de signature à seuil (TSS, FROST, MPC) aboutissent à un résultat similaire avec une seule clé on-chain — chaque signataire détient une *partie* de la clé privée et ils signent conjointement sans jamais la reconstruire. Du point de vue du modèle de menace, la plupart des points ci-dessous s'appliquent indifféremment aux deux méthodes, avec quelques nuances précisées plus loin.

## Ce que le multisig permet de déjouer (les bonnes nouvelles)

### La compromission d'une clé unique

C'est le principal avantage. Si le portefeuille matériel d'un signataire est volé, si son téléphone est infecté par un malware, ou si sa phrase de récupération (seed phrase) fuite, un attaquant détenant cette seule clé ne peut pas déplacer les fonds. Il doit compromettre au moins M-1 autres clés simultanément.

Pour une configuration 2-sur-3, cela signifie que l'attaquant doit compromettre *deux terminaux indépendants*, idéalement détenus par des personnes différentes, sur du matériel différent, dans des lieux physiques différents. La probabilité de deux compromissions indépendantes dans le même laps de temps est généralement inférieure de plusieurs ordres de grandeur à la probabilité d'une seule.

### Le risque interne

Une seule personne ayant la garde totale des fonds peut démissionner avec fracas, faire défection, subir des pressions ou tout simplement commettre une erreur catastrophique. Le multisig oblige à la collusion. Pour les DAO et les entreprises, c'est souvent la motivation *principale* — l'avantage en matière de sécurité contre les attaquants externes est secondaire par rapport à l'avantage en matière de gouvernance face à un acteur interne individuel.

### La récupération en cas de perte de clé

Dans une configuration M-sur-N avec N > M, la perte d'une clé n'est pas catastrophique. Les autres signataires peuvent transférer les fonds vers un nouveau multisig et remplacer la clé perdue. Il s'agit d'une amélioration significative par rapport à la conservation à clé unique, où la perte d'une phrase de récupération entraîne une perte définitive.

### L'hameçonnage (phishing) de l'utilisateur

De nombreuses attaques par hameçonnage de portefeuille (faux sites d'airdrop, approbations de jetons malveillantes, contrats siphonneurs) reposent sur le fait que l'utilisateur signe une transaction malveillante au cours d'une seule session de navigation. Le multisig ajoute une étape de confirmation sur une interface différente — une interface utilisateur de coordination comme celle de Safe, ou une approbation matérielle sur plusieurs appareils — ce qui offre à l'utilisateur une occasion supplémentaire de s'apercevoir qu'il signe quelque chose qu'il n'avait pas l'intention d'approuver.

## Ce que le multisig *ne permet pas* de déjouer (la partie inconfortable)

C'est la partie que la plupart des analyses rapides omettent.

### Les bugs de smart contracts dans le multisig lui-même

Le multisig est un smart contract. Si le contrat comporte un bug, toute la gestion rigoureuse des clés au monde n'y changera rien. L'incident multisig le plus coûteux de l'histoire — le [gel du multisig Parity](https://www.parity.io/blog/security-alert/) en novembre 2017 — était dû à un bug du contrat, et non à la compromission d'une clé. Environ 150 millions de dollars en ETH ont été rendus définitivement inaccessibles par une seule transaction.

Le contrat Safe moderne est l'un des plus audités sur Ethereum et a fait ses preuves, mais le constat demeure : vous échangez "une clé privée à protéger" contre "un smart contract auquel faire confiance". Cette confiance doit être gagnée et consolidée par des audits réguliers et l'épreuve du temps.

### La compromission de l'interface de signature

Presque toutes les validations multisig se font via une interface : l'interface web de Safe, un plugin de portefeuille, un tableau de bord personnalisé. Si cette interface est compromise (détournement DNS, attaque de la chaîne logistique sur une dépendance, extension de navigateur malveillante), l'attaquant peut afficher au signataire A "envoyer 1 ETH à alice.eth" tout en transmettant en réalité "envoyer 1000 ETH à attaquant.eth" au portefeuille matériel pour signature.

La plupart des portefeuilles matériels affichent *effectivement* l'adresse de destination réelle, mais les signataires ont souvent tendance à la lire en diagonale. L'[incident de Bybit](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) début 2025 reposait sur une compromission de l'interface utilisateur de Safe ; tous les signataires ont approuvé ce qu'ils pensaient être une transaction de routine, alors que le contrat proxy était en train d'être modifié.

Le multisig vous protège contre un attaquant qui ne possède *qu'une seule* clé. Il ne vous protège pas contre un attaquant capable de soumettre la mauvaise transaction à tous vos signataires.

### L'hameçonnage coordonné de plusieurs signataires

Si les signataires sont connus et joignables — ce qui est généralement le cas pour toute trésorerie dont l'adresse Safe est publique —, un attaquant peut tous les cibler. Il lance la même campagne d'hameçonnage auprès de chaque signataire. Puis il attend. Si deux d'entre eux sur trois sont fatigués, distraits ou pris au dépourvu le même jour, le seuil est atteint.

C'est l'attaque la plus réaliste en pratique contre des multisigs bien gérés, et les défenses pour s'en prémunir sont principalement procédurales, et non techniques : la confirmation hors bande de chaque transaction via un canal distinct (Signal, une autre messagerie, un appel téléphonique), et une politique stricte exigeant que toute transaction supérieure à X $ soit discutée de vive voix avant signature.

### La compromission du stockage hors ligne des clés

Si les "clés de signature" sont en réalité un 2-sur-3 réparti entre les phrases de récupération MetaMask de deux ingénieurs et un portefeuille matériel conservé dans le coffre-fort du bureau, vous avez un problème de sécurité opérationnelle (OPSEC) déguisé en multisig. Le seuil est techniquement respecté, mais la diversité est illusoire. Une infection par un malware sur les ordinateurs des deux ingénieurs, ou une seule effraction dans les bureaux, peut suffire à compromettre ce seuil.

Une véritable diversité exige :

- Des modèles de matériel différents. (Un Ledger, un Trezor, un Keystone.)
- Des systèmes d'exploitation différents pour toute signature logicielle.
- Des emplacements physiques différents pour tout stockage permanent.
- Des personnes différentes, le cas échéant, avec des profils de menace distincts.

### La perte au-delà du seuil

Le revers de la médaille de la récupération : dans un 2-sur-3, perdre *deux* clés équivaut à une perte définitive. Dans un 3-sur-5, perdre trois clés est irréversible. Plus l'écart entre M et N est grand, plus on est à l'abri des pertes isolées — mais plus il est facile pour un attaquant de trouver M signataires à hameçonner.

C'est un compromis inévitable. Un M plus élevé est plus sûr contre les attaques externes mais réduit les possibilités de récupération. Un M plus faible facilite la récupération mais rend le système plus vulnérable aux attaques. Aucun paramètre ne permet d'optimiser les deux à la fois.

## Les cas où le multisig peut aggraver la situation

Quelques cas concrets abordés en toute franchise :

- **Pour les très petits soldes**, la lourdeur opérationnelle du multisig (coordination des transactions, frais de gaz sur EVM, courbe d'apprentissage) peut entraîner des erreurs que la conservation à clé unique permettrait d'éviter. Le bon outil pour 200 $ d'argent de poche en crypto est une simple clé adossée à un portefeuille matériel.
- **Pour les utilisateurs solitaires qui voient le multisig comme un système de récupération** mais qui, en pratique, conservent les trois clés sur des appareils qu'ils sont les seuls à contrôler, le multisig ajoute de la complexité sans modifier le modèle de menace : si un attaquant parvient à compromettre l'un de ces appareils, il pourra probablement tous les compromettre.
- **Pour les organisations qui n'ont pas de véritable diversité de signataires** — tout le monde dans le même bureau, sur le même VPN, en utilisant le même SSO —, le seuil devient une simple formalité.

Dans ces trois cas, la solution n'est pas "d'utiliser une conservation à clé unique". Elle consiste à "utiliser le multisig *correctement* ou faire appel à un dépositaire (custodian) qui le fait". Mais prétendre que le type de contrat suffit à garantir la sécurité, indépendamment des pratiques opérationnelles, c'est ce qui mène aux pertes les plus médiatisées.

## À quoi ressemble une bonne configuration

Un multisig 2-sur-3 ou 3-sur-5 fonctionne bien pour le contrôle d'une trésorerie lorsque *toutes* les conditions suivantes sont réunies :

- Les signataires sont des personnes différentes, se trouvant dans des juridictions différentes si possible.
- Les appareils de signature proviennent de marques de matériel différentes et tournent sur des systèmes d'exploitation distincts.
- Un canal de communication séparé est utilisé pour confirmer les transactions, de façon indépendante de l'interface de signature.
- Un processus documenté existe pour vérifier la charge utile (payload) de la transaction par rapport à un écart attendu — calldata, cible, valeur — avant que le moindre signataire ne l'approuve.
- Le contrat multisig lui-même a fait l'objet d'audits rigoureux (Safe reste l'option prudente par défaut en 2026) et sa version est figée et connue.
- Une procédure de remplacement des signataires existe et a été testée en amont.

Cela requiert beaucoup plus de rigueur que la plupart des équipes ne l'imaginent au départ. La bonne nouvelle, c'est que cette rigueur est un investissement initial ponctuel ; la mauvaise nouvelle, c'est qu'elle a plus d'importance que le contrat lui-même.

## Le lien avec les noms de domaine

La gestion des noms de domaine est l'une des analogies les plus parlantes au multisig dans le monde hors chaîne (off-chain). Un domaine contrôlé par un compte de registraire unique, protégé par un seul mot de passe, équivaut à un portefeuille à clé unique. Un domaine protégé par le verrouillage du registraire (registrar lock) + le verrouillage du registre (registry lock) + l'authentification à deux facteurs (2FA) chez le fournisseur DNS + plusieurs fournisseurs faisant autorité est, structurellement, un multisig : plusieurs facteurs indépendants doivent tous être compromis pour que le nom soit transféré.

Namefi va encore plus loin en représentant la propriété sous forme d'enregistrement on-chain pouvant être directement conservé dans un portefeuille multisig. Le même mécanisme à seuil qui protège une trésorerie peut désormais sécuriser le *plan de contrôle DNS* — ainsi, une seule personne victime de hameçonnage ne peut pas plus faire perdre le domaine de l'entreprise qu'elle ne peut vider la trésorerie à elle seule. L'amélioration du modèle de menace est identique dans les deux mondes : remplacer "faire confiance à un seul identifiant" par "devoir compromettre M facteurs indépendants sur N".

## Sources et lectures complémentaires

- Safe — [Contrats de comptes intelligents (Smart accounts) et audits](https://safe.global/).
- IETF FROST — [RFC 9591, le protocole Flexible Round-Optimized Schnorr Threshold](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Post-mortem du gel du multisig](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Guide pratique pour gérer un multisig Safe](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).