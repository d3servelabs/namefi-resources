---
title: "Comment tokeniser votre .com : Un guide étape par étape (2026)"
date: '2026-05-22'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un guide pratique étape par étape pour tokeniser un domaine que vous possédez déjà — éligibilité, portefeuilles, frais, délais et ce à quoi s'attendre sur chaque écran. Écrit pour les propriétaires, pas pour les experts en protocoles."
keywords: ['comment tokeniser un domaine', 'comment tokeniser un .com', 'tokeniser mon domaine', 'tokeniser un domaine existant', 'tokeniser un domaine étape par étape', 'tutoriel de tokenisation de domaine', 'guide tokenisation .com', 'tokeniser .xyz', 'tokeniser .io', 'namefi tokeniser', 'domaine NFT comment faire', 'transférer domaine vers NFT', 'domaine vers NFT', 'processus de tokenisation de domaine', 'configuration de domaine tokenisé', 'tokeniser domaine ICANN']
---

Vous possédez donc un nom de domaine — peut-être `mybrand.com`, ou un portefeuille de noms `.xyz` — et vous avez décidé de le **tokeniser**. Ce guide vous explique ce qui se passe réellement, écran par écran, afin que vous puissiez prévoir le temps, l'argent et les accès dont vous aurez besoin avant de commencer.

Si vous vous demandez encore *pourquoi* tokeniser, lisez d'abord [Pourquoi tokeniser des noms de domaine sur la blockchain ?](/en/blog/why-tokenize-domains/). Si vous n'êtes pas sûr de ce que *signifie* la tokenisation, [Que sont les domaines tokenisés ?](/en/blog/what-are-tokenized-domains/) est un bon point de départ.

Cet article suppose que vous êtes déjà décidé à le faire.

---

## Avant de commencer : Une liste de vérification de 60 secondes

Le processus sera beaucoup plus fluide si ces éléments sont réunis avant même de cliquer sur quoi que ce soit :

- **Vous contrôlez le domaine chez son [bureau d'enregistrement](/en/glossary/registrar/) actuel.** Vous pouvez vous connecter, modifier les serveurs de noms et approuver les transferts / [codes d'autorisation (auth codes)](/en/glossary/auth-code/).
- **Vous possédez un [portefeuille](/en/glossary/wallet/) auto-hébergé (self-custodial).** MetaMask, Rabby, Coinbase Wallet, ou tout portefeuille EVM standard. Assurez-vous d'avoir réellement la [phrase de récupération (seed phrase)](/en/glossary/seed-phrase/) — pas seulement un compte sur un échange.
- **Le portefeuille contient une petite quantité de [gaz](/en/glossary/gas/).** Quelques dollars en ETH ou Base ETH suffisent pour couvrir la transaction de minting [sur la blockchain (on-chain)](/en/glossary/on-chain/). Vous n'avez pas besoin de beaucoup.
- **Le domaine n'est pas verrouillé, sur le point d'expirer ou en cours de transfert.** Les domaines ayant subi un récent [transfert entre bureaux d'enregistrement](/en/glossary/cross-registrar-transfer/) depuis moins de 60 jours, ou à moins de 30 jours de leur expiration, ne peuvent souvent pas être déplacés. Vérifiez ce point en premier.
- **Vous avez du temps.** Prévoyez environ 30 minutes d'attention, plus jusqu'à 5 à 7 jours de traitement en arrière-plan pour les transferts entre bureaux d'enregistrement.

Si l'un de ces points fait défaut, réglez-le avant de commencer. Le processus s'accommode beaucoup mieux de la patience que des surprises.

---

## Étape 1 : Connectez votre portefeuille sur namefi.io

Rendez-vous sur [namefi.io](https://namefi.io) et cliquez sur « Connect Wallet » (Connecter le portefeuille). Approuvez la connexion dans votre portefeuille. Ce portefeuille deviendra le **propriétaire** du domaine tokenisé : le NFT y sera conservé, et quiconque détient ce portefeuille détient le domaine.

> **Prenez cela au sérieux.** Si vous perdez ce portefeuille, vous perdez la partie on-chain de votre domaine. Nous avons un guide dédié sur [la récupération d'un domaine tokenisé après la perte de son portefeuille](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) : lisez-le maintenant, pas plus tard.

---

## Étape 2 : Ajoutez le domaine que vous souhaitez tokeniser

Dans votre tableau de bord Namefi, recherchez ou ajoutez le domaine que vous possédez déjà. Namefi vérifiera son éligibilité : le [bureau d'enregistrement](/en/glossary/registrar/) où il se trouve actuellement, s'il peut être verrouillé, s'il respecte les règles de transfert de l'[ICANN](/en/glossary/icann/), et si le [TLD (domaine de premier niveau)](/en/glossary/tld/) est pris en charge.

Vous verrez l'un des trois statuts suivants :

- **Éligible maintenant.** Passez à l'étape 3.
- **Éligible après un délai d'attente.** Cela signifie généralement qu'un transfert récent se trouve toujours dans la fenêtre de 60 jours imposée par l'ICANN. Patientez et revenez plus tard.
- **Non pris en charge.** Certains TLD ne sont pas encore supportés. Consultez la liste des TLD pris en charge ou contactez le support.

---

## Étape 3 : Choisissez un chemin de tokenisation

Namefi propose généralement plusieurs chemins en fonction du bureau d'enregistrement actuel du domaine :

1. **Transférer puis tokeniser.** Déplacez le domaine vers le bureau d'enregistrement partenaire accrédité de Namefi, puis frappez (mint) le jeton sur la blockchain. C'est le chemin le plus courant. Cela prend quelques jours en raison du processus de transfert de l'ICANN, et non à cause d'un élément lié à la blockchain.
2. **Tokeniser sur place (lorsque pris en charge).** Pour certaines intégrations de bureaux d'enregistrement, le domaine reste là où il est et la couche blockchain est ajoutée par-dessus. Plus rapide, mais disponible uniquement pour des bureaux d'enregistrement partenaires spécifiques.

Vous verrez le chemin qui s'applique à votre domaine. Le tableau de bord affichera le temps estimé et tous les frais à l'avance.

---

## Étape 4 : Confirmez le code d'autorisation / Approuvez le transfert (si nécessaire)

Pour le chemin de transfert, vous devrez récupérer le [**code d'autorisation**](/en/glossary/auth-code/) (parfois appelé code EPP ou code de transfert) auprès de votre bureau d'enregistrement actuel et le coller dans Namefi. Vous devrez peut-être également :

- Déverrouiller le domaine chez votre bureau d'enregistrement actuel.
- Approuver un e-mail de confirmation envoyé au contact du titulaire.

C'est la partie la plus lente de tout le processus. Prévoyez 5 à 7 jours pour que le transfert entre les bureaux d'enregistrement soit terminé, bien que cela se fasse souvent plus rapidement.

---

## Étape 5 : Frappez (Mint) le jeton sur la blockchain

Une fois le domaine pris en charge par l'intégration d'enregistrement de Namefi, vous serez invité à **frapper (mint)** la représentation [NFT](/en/glossary/nft/) (un jeton [ERC-721](/en/glossary/erc-721/) standard). Votre portefeuille s'ouvre ; vous confirmez une transaction ; le [gaz](/en/glossary/gas/) est payé ; le jeton atterrit dans votre portefeuille.

C'est à ce moment-là que le domaine devient [*tokenisé*](/en/glossary/tokenize/). Vous disposez désormais de :

- L'enregistrement traditionnel du [DNS](/en/glossary/dns/) / bureau d'enregistrement (toujours réel et reconnu par l'ICANN).
- Un NFT [sur la blockchain](/en/glossary/on-chain/) dans votre portefeuille qui représente la propriété.

Les deux sont désormais synchronisés par le protocole.

---

## Étape 6 : Vérifiez dans votre portefeuille et sur un explorateur de blocs

Ouvrez l'onglet NFT de votre portefeuille. Vous devriez voir le nouveau NFT du domaine tokenisé. Cliquez pour accéder à un explorateur de blocs (Etherscan, Basescan, etc.) afin de confirmer le contrat et l'adresse de propriété. C'est le bon moment pour faire une capture d'écran pour vos propres archives.

Si vous possédez un [portefeuille matériel (hardware wallet)](/en/glossary/hardware-wallet/), c'est le moment idéal pour y transférer le NFT. Le transfert est un transfert de NFT normal et coûte du gaz.

---

## Étape 7 : Gérez les DNS et les renouvellements

La tokenisation d'un domaine ne modifie pas sa résolution. Vos serveurs de noms, enregistrements A, enregistrements MX, DNSSEC : tout continue de fonctionner. Vous pouvez les gérer depuis le tableau de bord Namefi, ou les déléguer à votre fournisseur DNS existant (Cloudflare, Route53, etc.) exactement comme avant.

Pour plus de détails sur ce qui change (et ce qui ne change pas) au niveau de la couche DNS, consultez l'article [Le DNS fonctionne toujours : Serveurs de noms, e-mails et DNSSEC sur un domaine tokenisé](/en/blog/dns-on-tokenized-domains/).

Les renouvellements continuent de s'effectuer via la couche du bureau d'enregistrement. Namefi gère la facturation côté bureau d'enregistrement ; vous conservez la propriété sur la blockchain.

---

## À quoi s'attendre en matière de coûts

En gros, vous payez pour trois choses :

- **Les frais du bureau d'enregistrement.** Le tarif annuel normal de renouvellement du domaine, plus d'éventuels frais de transfert entrant. Ce sont des coûts du monde réel qui existent indépendamment de la tokenisation.
- **Le gaz.** Quelques dollars pour la transaction de mint, selon la blockchain utilisée (Base est moins chère qu'Ethereum L1).
- **Les frais de protocole.** Les propres frais de Namefi pour le service de tokenisation. Ceux-ci sont affichés dans le tableau de bord avant que vous ne confirmiez.

Il n'y a pas de mauvaise surprise. Si un montant ne figure pas sur l'écran de confirmation, ce n'est pas facturé.

---

## Problèmes fréquents

- **« Mon bureau d'enregistrement refuse de libérer le code d'autorisation. »** Certains bureaux d'enregistrement cachent cela au fin fond de leur interface ou nécessitent la création d'un ticket au support. Soyez patient et persévérant.
- **« J'ai déverrouillé le domaine mais le système l'indique toujours comme verrouillé. »** Les bureaux d'enregistrement mettent souvent en cache le statut de verrouillage pendant un maximum de 24 heures. Attendez un jour, puis actualisez.
- **« Mon portefeuille affiche le NFT, mais le domaine apparaît toujours chez mon ancien bureau d'enregistrement. »** Pendant la fenêtre de transfert, les deux parties peuvent brièvement afficher la propriété. La partie sur la blockchain (on-chain) fait autorité une fois le transfert finalisé.
- **« Je souhaite utiliser un [multisig (portefeuille multi-signatures)](/en/glossary/multi-sig/) comme propriétaire. »** C'est pris en charge. Connectez le portefeuille multisig. Assurez-vous simplement que vous pouvez réellement exécuter des transactions à partir de celui-ci — un multisig dont vous avez perdu les signataires est un domaine que vous avez également perdu. Pour aller plus loin : [Les portefeuilles multisig améliorent-ils vraiment la sécurité ?](/en/blog/do-multisig-wallets-actually-improve-security/)

---

## Avertissement amical (À lire !)

> Nous ne sommes pas des avocats, des comptables, des conseillers financiers ou des médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou toute autre forme de conseil professionnel.** Nous rédigeons ces articles pour nous éduquer nous-mêmes et pour des raisons pratiques pour nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique, ou tout simplement erronées — il nous arrive aussi de faire des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre genre, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DYOR — Faites vos propres recherches (Do Your Own Research)**. Apprenons tout en nous amusant.

---

## Résumé

- Tokeniser un domaine que vous possédez déjà est un processus interactif et guidé d'environ 30 minutes, auquel s'ajoute jusqu'à une semaine d'attente du côté du bureau d'enregistrement.
- Vous avez besoin : du contrôle du domaine, d'un portefeuille auto-hébergé, d'une petite quantité de gaz et de patience.
- Le mint (frappe) sur la blockchain est la *dernière* étape ; la majeure partie du travail consiste en l'ennuyeux processus de transfert de bureau d'enregistrement imposé par l'ICANN, indépendamment de la blockchain.
- Après la tokenisation, vous disposez de **deux couches de propriété synchronisées** : l'enregistrement DNS traditionnel et un NFT dans votre portefeuille.
- Lisez le [guide de récupération en cas de perte de portefeuille](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *avant* de tokeniser, pas après.

Prêt à commencer ? Rendez-vous sur [namefi.io](https://namefi.io).