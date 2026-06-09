---
title: "Comment tokéniser votre .com : Un guide étape par étape (2026)"
date: '2026-05-22'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Une marche à suivre pratique et détaillée pour tokéniser un domaine que vous possédez déjà : éligibilité, portefeuilles, frais, délais et ce à quoi s'attendre sur chaque écran. Rédigé pour les propriétaires, pas pour les nerds de protocoles."
keywords: ['comment tokéniser un domaine', 'comment tokéniser un .com', 'tokéniser mon domaine', 'tokéniser un domaine existant', 'tokéniser un domaine étape par étape', 'tutoriel de tokénisation de domaine', 'guide tokéniser .com', 'tokéniser .xyz', 'tokéniser .io', 'tokéniser namefi', 'domaine NFT comment faire', 'transférer domaine vers NFT', 'domaine vers NFT', 'processus de tokénisation de domaine', 'configuration de domaine tokénisé', 'tokéniser domaine ICANN']
---

Vous possédez donc un domaine — peut-être `mybrand.com`, ou peut-être un portefeuille de noms en `.xyz` — et vous avez décidé de le **tokéniser**. Ce guide explique ce qui se passe réellement, écran par écran, afin que vous puissiez anticiper le temps, l'argent et les accès dont vous aurez besoin avant de commencer.

Si vous vous demandez encore *pourquoi* tokéniser, lisez d'abord [Pourquoi tokéniser des domaines sur la blockchain ?](/en/blog/why-tokenize-domains/). Si vous n'êtes pas sûr de ce que *signifie* la tokénisation, [Que sont les domaines tokénisés ?](/en/blog/what-are-tokenized-domains/) est le point de départ idéal.

Cet article suppose que votre décision est déjà prise.

---

## Avant de commencer : une checklist de 60 secondes

Le processus sera beaucoup plus fluide si ces conditions sont remplies avant même de cliquer sur quoi que ce soit :

- **Vous contrôlez le domaine chez son [bureau d'enregistrement](/en/glossary/registrar/) (registrar) actuel.** Vous pouvez vous connecter, modifier les serveurs de noms et approuver les transferts / [codes d'autorisation](/en/glossary/auth-code/).
- **Vous possédez un [portefeuille](/en/glossary/wallet/) (wallet) auto-hébergé.** MetaMask, Rabby, Coinbase Wallet, ou tout portefeuille EVM standard. Assurez-vous de bien détenir la [phrase de récupération](/en/glossary/seed-phrase/) (seed phrase) — et pas seulement un compte sur une plateforme d'échange.
- **Le portefeuille contient un peu de [gaz](/en/glossary/gas/) (gas).** Quelques dollars en ETH ou Base ETH suffisent pour couvrir la transaction de création (*mint*) [sur la blockchain](/en/glossary/on-chain/). Vous n'avez pas besoin de beaucoup.
- **Le domaine n'est ni verrouillé, ni sur le point d'expirer, ni en cours de transfert.** Les domaines ayant subi un récent [transfert entre bureaux d'enregistrement](/en/glossary/cross-registrar-transfer/) il y a moins de 60 jours environ, ou expirant dans moins de 30 jours, ne peuvent souvent pas être déplacés. Vérifiez d'abord.
- **Vous avez du temps.** Prévoyez environ 30 minutes d'attention, plus jusqu'à 5 à 7 jours de traitement en arrière-plan pour les transferts entre registrars.

Si l'un de ces points est incertain, réglez-le avant de commencer. Le processus tolère bien mieux la patience que les surprises.

---

## Étape 1 : Connectez votre portefeuille sur namefi.io

Rendez-vous sur [namefi.io](https://namefi.io) et cliquez sur « Connect Wallet » (Connecter le portefeuille). Approuvez la connexion dans votre portefeuille. Ce portefeuille deviendra le **propriétaire** du domaine tokénisé — le NFT y résidera, et quiconque détient ce portefeuille détient le domaine.

> **Prenez cela très au sérieux.** Si vous perdez ce portefeuille, vous perdez la partie on-chain de votre domaine. Nous avons un guide dédié sur [la récupération d'un domaine tokénisé après la perte d'un portefeuille](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) — lisez-le maintenant, et non plus tard.

---

## Étape 2 : Ajoutez le domaine que vous souhaitez tokéniser

Dans votre tableau de bord Namefi, recherchez ou ajoutez le domaine que vous possédez déjà. Namefi vérifiera son éligibilité : le [bureau d'enregistrement](/en/glossary/registrar/) actuel, s'il est verrouillable, s'il respecte les règles de transfert de l'[ICANN](/en/glossary/icann/), et si l'extension ([TLD](/en/glossary/tld/)) est prise en charge.

Vous verrez l'un des trois statuts suivants :

- **Éligible immédiatement.** Passez à l'étape 3.
- **Éligible après un délai d'attente.** Cela signifie généralement qu'un transfert récent se trouve toujours dans la fenêtre de 60 jours imposée par l'ICANN. Patientez et revenez plus tard.
- **Non pris en charge.** Certains TLD ne sont pas encore supportés. Consultez la liste des TLD compatibles, ou contactez le support.

---

## Étape 3 : Choisissez un parcours de tokénisation

Namefi propose généralement quelques parcours en fonction du registrar actuel du domaine :

1. **Transfert entrant puis tokénisation.** Déplacez le domaine vers le bureau d'enregistrement partenaire accrédité de Namefi, puis *mintez* le jeton sur la blockchain. C'est le parcours le plus courant. Cela prend quelques jours en raison du processus de transfert de l'ICANN, et non à cause de contraintes liées à la blockchain.
2. **Tokénisation sur place (si pris en charge).** Pour certaines intégrations de registrars, le domaine reste là où il est et la couche blockchain est ajoutée par-dessus. Plus rapide, mais disponible uniquement pour certains bureaux d'enregistrement partenaires.

Vous verrez le parcours qui s'applique à votre domaine. Le tableau de bord affichera le temps estimé et tous les frais à l'avance.

---

## Étape 4 : Confirmez le code d'autorisation / Approuvez le transfert (si nécessaire)

Pour le parcours avec transfert entrant, vous devrez récupérer le [**code d'autorisation**](/en/glossary/auth-code/) (parfois appelé code EPP) auprès de votre registrar actuel et le coller dans Namefi. Vous pourriez également avoir besoin de :

- Déverrouiller le domaine chez votre bureau d'enregistrement actuel.
- Approuver un e-mail de confirmation envoyé au contact du titulaire (registrant).

C'est la partie la plus lente de tout le processus. Prévoyez 5 à 7 jours pour que le changement de registrar se termine, bien que cela se fasse souvent plus rapidement.

---

## Étape 5 : *Mintez* le jeton sur la blockchain

Une fois le domaine passé sous l'intégration du registrar Namefi, vous serez invité à **minter** (créer) sa représentation [NFT](/en/glossary/nft/) (un jeton standard [ERC-721](/en/glossary/erc-721/)). Votre portefeuille s'ouvre ; vous confirmez la transaction ; le [gaz](/en/glossary/gas/) est payé ; et le jeton atterrit dans votre portefeuille.

C'est à ce moment précis que le domaine devient [*tokénisé*](/en/glossary/tokenize/). Vous disposez désormais de :

- L'enregistrement [DNS](/en/glossary/dns/) / registrar traditionnel (toujours réel et reconnu par l'ICANN).
- Un NFT [on-chain](/en/glossary/on-chain/) dans votre portefeuille, représentant la propriété du domaine.

Les deux sont désormais maintenus synchronisés par le protocole.

---

## Étape 6 : Vérifiez dans votre portefeuille et sur un explorateur de blocs

Ouvrez l'onglet NFT de votre portefeuille. Vous devriez y voir le nouveau NFT de votre domaine tokénisé. Cliquez pour ouvrir un explorateur de blocs (Etherscan, Basescan, etc.) afin de confirmer le contrat et l'adresse du propriétaire. C'est le bon moment pour faire une capture d'écran pour vos archives.

Si vous avez un [portefeuille matériel](/en/glossary/hardware-wallet/) (hardware wallet), c'est l'occasion idéale d'y transférer le NFT. Le transfert se fait comme n'importe quel transfert de NFT classique et consomme du gaz.

---

## Étape 7 : Gérez les DNS et les renouvellements

Tokéniser un domaine ne modifie en rien sa résolution. Vos serveurs de noms, enregistrements A, enregistrements MX, DNSSEC : tout continue de fonctionner normalement. Vous pouvez gérer cela depuis le tableau de bord Namefi, ou bien déléguer la gestion à votre fournisseur DNS existant (Cloudflare, Route53, etc.) exactement comme avant.

Pour plus de détails sur ce qui change (ou pas) au niveau de la couche DNS, consultez [Le DNS fonctionne toujours : serveurs de noms, e-mails et DNSSEC sur un domaine tokénisé](/en/blog/dns-on-tokenized-domains/).

Les renouvellements continuent de s'effectuer via la couche du bureau d'enregistrement. Namefi gère la facturation côté registrar ; et vous conservez la propriété on-chain.

---

## À quels coûts s'attendre ?

Pour simplifier, vous payez pour trois choses :

- **Frais de bureau d'enregistrement.** Le tarif annuel normal de renouvellement du domaine, plus d'éventuels frais de transfert entrant. Ce sont des coûts bien réels qui existent indépendamment de la tokénisation.
- **Frais de gaz.** Quelques dollars pour la transaction de *mint*, selon la blockchain utilisée (Base est moins chère que la couche 1 d'Ethereum).
- **Frais de protocole.** Les frais prélevés par Namefi pour le service de tokénisation. Ceux-ci sont affichés dans le tableau de bord avant que vous ne confirmiez.

Il n'y a aucune surprise cachée. Si un montant ne figure pas sur l'écran de confirmation, il ne vous sera pas facturé.

---

## Problèmes fréquents

- **« Mon registrar refuse de libérer le code d'autorisation. »** Certains bureaux d'enregistrement cachent cette option dans les tréfonds de leur interface ou exigent que vous ouvriez un ticket au support. Soyez patient et persévérant.
- **« J'ai déverrouillé le domaine mais le système l'indique toujours verrouillé. »** Les registrars mettent souvent le statut de verrouillage en cache, parfois jusqu'à 24 heures. Attendez un jour, puis rafraîchissez la page.
- **« Mon portefeuille affiche le NFT, mais le domaine apparaît encore chez mon ancien registrar. »** Pendant la fenêtre de transfert, les deux côtés peuvent afficher brièvement la propriété. La partie on-chain fait autorité une fois le transfert finalisé.
- **« Je souhaite utiliser un [multisig](/en/glossary/multi-sig/) comme propriétaire. »** C'est pris en charge. Connectez le portefeuille multisig. Assurez-vous simplement que vous pouvez réellement y exécuter des transactions — un multisig dont vous auriez perdu les signataires est un domaine que vous perdrez également. Pour aller plus loin : [Les portefeuilles multisig améliorent-ils vraiment la sécurité ?](/en/blog/do-multisig-wallets-actually-improve-security/)

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous rédigeons ces articles pour nous informer nous-mêmes et pour des raisons pratiques pour nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique ou tout simplement fausses — il nous arrive aussi de faire des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre style, demandez à un ami, demandez sur Twitter, sur Reddit, à une IA ou à un voyant. Bref : **DYOR — Do Your Own Research** (Faites vos propres recherches). Apprenons et amusons-nous.

---

## Résumé

- Tokéniser un domaine que vous possédez déjà est un processus interactif guidé d'environ 30 minutes, auquel s'ajoute jusqu'à une semaine d'attente côté bureau d'enregistrement.
- Vous avez besoin : du contrôle du domaine, d'un portefeuille auto-hébergé, d'une petite quantité de gaz et de patience.
- Le *mint* sur la blockchain est la *dernière* étape ; le gros du travail réside dans l'ennuyeux processus de transfert de registrar qu'impose l'ICANN, indépendamment de toute blockchain.
- Après la tokénisation, vous obtenez **deux couches de propriété synchronisées** : l'enregistrement DNS traditionnel et un NFT dans votre portefeuille.
- Lisez le [guide de récupération en cas de perte de portefeuille](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *avant* de tokéniser, et non pas après.

Prêt à commencer ? Rendez-vous sur [namefi.io](https://namefi.io).