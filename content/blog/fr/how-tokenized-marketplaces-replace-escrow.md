---
title: "De la mise en vente au règlement : Comment les places de marché tokenisées remplacent le séquestre (escrow)"
date: '2026-05-22'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Comment les places de marché de domaines tokenisés permettent aux acheteurs et aux vendeurs de régler de manière atomique sur la blockchain — pas de service de séquestre, pas de codes d'autorisation, pas de verrouillage de registraire de cinq jours. Ce qui remplace chaque étape du flux traditionnel, et quels risques sont transférés à d'autres niveaux."
keywords: ['place de marché de domaines blockchain', 'transfert de domaine atomique', 'place de marché de domaines tokenisés', 'remplacer séquestre domaine', 'vente de domaine sans séquestre', 'vente de domaine crypto', 'processus de vente de domaine tokenisé', 'vendre domaine tokenisé', 'acheter domaine tokenisé', 'vente de domaine on-chain', 'règlement NFT de domaine', 'place de marché de domaines 2026', 'liquidité de domaine tokenisé']
---

Le processus traditionnel pour vendre un `.com` ressemble à peu près à ceci :

1. Mise en vente sur [Sedo](https://sedo.com/), [Afternic](https://www.afternic.com/) ou Dan.com.
2. Négociation.
3. Ouverture d'un compte de séquestre ([escrow](/en/glossary/escrow/)) chez [Escrow.com](https://www.escrow.com/) ou similaire. L'acheteur vire les fonds.
4. Le vendeur déverrouille le domaine et fournit le [code d'autorisation](/en/glossary/auth-code/) (auth code).
5. L'acheteur initie le [transfert inter-bureaux d'enregistrement](/en/glossary/cross-registrar-transfer/) (cross-registrar transfer) chez son [bureau d'enregistrement](/en/glossary/registrar/) (registrar).
6. Attente de 5 à 7 jours pour que le transfert [ICANN](/en/glossary/icann/) soit validé.
7. Confirmation du transfert ; le service de séquestre libère les fonds.
8. Paiement de 3 à 6 % de frais de séquestre, plus les commissions de la place de marché.

Cela fonctionne. C'est la norme depuis deux décennies. C'est aussi lent, coûteux et rempli de moments où une partie doit faire confiance à l'autre (ou à un tiers de confiance) pour agir correctement.

Les ventes de domaines tokenisés compressent tout cela en une seule transaction. Cet article explique comment, et vers quoi la confiance est réellement déplacée.

---

## Le nouveau processus, de bout en bout

1. Mettre en vente le [domaine tokenisé](/en/blog/what-are-tokenized-domains/) sur une [place de marché](/en/glossary/marketplace/) (celle de Namefi, de Doma, [OpenSea](https://opensea.io/), [Blur](https://blur.io/), etc.).
2. L'acheteur paie. Le [NFT](/en/glossary/nft/) est transféré vers le [portefeuille](/en/glossary/wallet/) (wallet) de l'acheteur. L'enregistrement du côté du [bureau d'enregistrement](/en/glossary/registrar/) est maintenu synchronisé par la plateforme.
3. Terminé.

C'est tout. Deux étapes. Pas de [code d'autorisation](/en/glossary/auth-code/), pas de [séquestre](/en/glossary/escrow/), pas de verrouillage de 5 jours par le bureau d'enregistrement, et pas de vide juridique du type « j'ai fait le virement, maintenant je vous fais confiance ».

Cela fonctionne car le **NFT est le registre de propriété canonique**, et les transactions [on-chain](/en/glossary/on-chain/) sont [atomiques](/en/glossary/atomic-transfer/) : le paiement et le transfert de l'actif se produisent dans le même bloc, ou aucun des deux n'a lieu.

---

## Ce que devient chaque élément traditionnel

### La plateforme de mise en vente (Listing platform)

Même idée, interface différente. Les places de marché prennent toujours une commission et continuent de sélectionner les annonces. Le grand changement : les annonces tokenisées peuvent apparaître sur **plusieurs places de marché à la fois** car ce sont des NFT standards. Mettez-le en vente une fois sur la plateforme qui a créé le domaine ; OpenSea/Blur peuvent l'agréger automatiquement.

C'est une amélioration significative de la liquidité par rapport au monde des domaines traditionnels, où Sedo et Afternic fonctionnaient comme des écosystèmes fermés.

### Escrow.com

**Disparu.** Remplacé par le règlement atomique on-chain.

Dans le flux traditionnel, le service de séquestre (escrow) existe pour combler le décalage asynchrone entre le paiement par l'acheteur et le transfert par le vendeur. Dans le flux tokenisé, ce décalage n'existe pas — la transaction est atomique, donc aucun tiers n'a besoin de conserver l'argent entre-temps. Cela élimine les frais de séquestre de 3 à 6 % ainsi que le temps d'attente.

### Les codes d'autorisation (codes EPP)

**Inutiles pour la moitié tokenisée de la transaction.** Le transfert on-chain s'effectue immédiatement. La synchronisation de l'enregistrement du côté du bureau d'enregistrement est gérée par le protocole ; l'acheteur n'a rien à faire manuellement.

(Si un acheteur souhaite ultérieurement *dé-tokeniser* le domaine et le transférer entièrement vers un autre bureau d'enregistrement, il s'agit d'un processus distinct qui réactiverait le mécanisme de transfert traditionnel du registraire — avec les codes d'autorisation et tout le reste.)

### Le verrouillage de transfert de 5 jours de l'ICANN

**Ignoré pour le transfert tokenisé lui-même.** Les règles de transfert de l'ICANN s'appliquent aux transferts entre bureaux d'enregistrement (inter-registrar), et non aux changements de propriété au sein d'un même bureau d'enregistrement. La plateforme de domaines tokenisés gère le changement on-chain sans déclencher un transfert inter-bureaux d'enregistrement complet.

Il existe une règle connexe — la période de restriction de 60 jours après un transfert de bureau d'enregistrement — qui s'applique toujours si un domaine a été récemment transféré entre bureaux. Cela concerne les transferts de bureaux d'enregistrement, pas les transferts on-chain, donc cela ne bloque pas les ventes tokenisées.

### Virements bancaires et délais bancaires

**Remplacés par les paiements en crypto et en [stablecoins](/en/glossary/stablecoin/).** L'USDC, l'ETH et d'autres paiements on-chain sont réglés en quelques secondes. Les virements bancaires prennent des jours. La différence est d'autant plus frappante pour les ventes internationales.

### « Je fais confiance à l'autre personne pour faire sa part »

**Remplacé par l'atomicité des contrats intelligents.** Soit la transaction est entièrement finalisée (vous obtenez l'actif, ils obtiennent l'argent), soit elle n'a pas lieu du tout (aucun mouvement d'un côté ni de l'autre). Il n'existe pas de scénario où une partie agit et l'autre non.

---

## Vers quoi les risques se déplacent réellement

Tout n'est pas positif — le profil de risque évolue. Certains risques que le séquestre (escrow) gérait dans le processus traditionnel se trouvent désormais ailleurs.

### Risque lié à la sécurité du portefeuille

Vous envoyez désormais un NFT à l'adresse d'un portefeuille. Si l'acheteur vous a donné la mauvaise adresse — ou si votre interface vous trompe et vous fait envoyer l'actif à la mauvaise adresse — c'est de votre responsabilité. Vérifiez toujours l'adresse du destinataire.

### Risque lié aux contrats intelligents (Smart-contract risk)

Le contrat intelligent de la place de marché est le nouveau « séquestre ». S'il contient un bug, des choses étranges peuvent se produire. C'est pourquoi il est crucial d'utiliser des places de marché auditées et éprouvées. Ne soyez pas le premier à utiliser un tout nouveau contrat pour une vente de grande valeur.

### Front-running et MEV

Les annonces on-chain sont publiques. Un acteur déterminé peut tenter de devancer une transaction (le terme générique est [MEV — Maximal Extractable Value](https://ethereum.org/en/developers/docs/mev/)). Les principales places de marché ont mis en place des mesures d'atténuation, mais c'est une catégorie de risque qui n'existait pas dans le processus traditionnel.

### Risque d'actif volé

Si le NFT que vous achetez a été volé, vous pourriez vous retrouver avec un domaine que les plateformes et les places de marché se coordonnent pour signaler. Certaines places de marché refuseront d'honorer les ventes de NFT signalés. C'est un domaine de travail réel et continu dans l'écosystème plus large des NFT.

### KYC / Sanctions

Selon la place de marché et la juridiction, les vendeurs et les acheteurs peuvent être soumis à des exigences de vérification d'identité (KYC). Ce n'est pas nouveau — les services de séquestre en avaient aussi — mais la mécanique est différente.

### Événements fiscaux

Une vente payée en crypto constitue un événement fiscal différent d'une vente payée en monnaie fiduciaire dans certaines juridictions. Consultez [l'article sur les questions fiscales et comptables](/en/blog/tax-and-accounting-questions-for-tokenized-domains/) pour connaître la liste des questions à soumettre à votre expert-comptable (CPA).

---

## Ce que cela signifie pour les acheteurs

- **Rapidité.** Les ventes sont réglées en quelques minutes, et non en quelques jours.
- **Frais réduits.** Pas de commission de séquestre. Les frais de la place de marché et de gaz (frais de réseau) sont généralement bien inférieurs à 3–6 %.
- **Propriété directe.** Le NFT est dans votre portefeuille, immédiatement, sans aucune attente.
- **Vérification.** Vous pouvez vérifier l'historique on-chain avant d'acheter — la date de création du domaine, les transferts précédents, les annonces antérieures.

Vous échangez le confort d'un processus de séquestre familier contre le confort moins familier de l'atomicité cryptographique. Pour la plupart des acheteurs habitués aux NFT, c'est une nette amélioration. Pour les novices, il est conseillé de commencer par une petite transaction d'essai.

---

## Ce que cela signifie pour les vendeurs

- **Les mêmes avantages :** plus rapide, moins cher, plus transparent.
- **Plus de vitrines.** Votre annonce peut apparaître simultanément sur plusieurs places de marché NFT.
- **Un public différent.** Les acheteurs des places de marché NFT se comportent différemment des acheteurs de domaines traditionnels. La dynamique des prix peut évoluer dans les deux sens selon le domaine.
- **Pas de risque de « faux bond » de l'acheteur.** Soit la transaction aboutit, soit elle échoue. Fini le scénario : « l'acheteur a payé le séquestre puis a disparu ».

Le revers de la médaille : vous renoncez à la portée marketing (parfois considérable) des courtiers spécialisés de l'industrie traditionnelle des domaines. Pour les domaines premium, les stratégies hybrides — les mettre en vente à la fois sous forme de NFT tokenisé et via les canaux traditionnels — sont courantes.

---

## Les annonces hybrides

Rien ne vous empêche de mettre également en vente un domaine tokenisé à l'ancienne. De nombreux propriétaires publient leur annonce :

- Sur la propre place de marché de la plateforme.
- Sur les places de marché NFT généralistes (OpenSea, Blur).
- Sur les places de marché de domaines traditionnelles (Sedo, Afternic), avec la nuance que l'acheteur pourrait vouloir « dé-tokeniser » le domaine ou accepter sa forme tokenisée.

Cela demande plus de travail, mais pour les domaines de premier plan, cela élargit considérablement le bassin d'acheteurs.

---

## Où nous pensons que tout cela mène

Une fois que les acheteurs et les vendeurs s'habituent au règlement atomique, le processus de séquestre traditionnel commence à ressembler au fait de faire un chèque — fonctionnel mais archaïque. Les éléments dont les places de marché de domaines tokenisés ont encore besoin pour capter une plus grande part de volume sont :

- De meilleures fonctions de recherche et de filtrage spécifiques aux domaines sur les places de marché NFT.
- De meilleurs outils d'évaluation pour les actifs hétérogènes.
- Une couverture plus large des extensions de domaines (TLD) sur l'ensemble des plateformes de tokenisation.
- Des contrats stables et bien audités n'ayant généré aucun incident majeur.

Tous ces éléments sont en cours de développement et s'améliorent visiblement d'année en année.

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou toute autre forme de conseil professionnel.** Nous rédigeons ces articles pour nous éduquer nous-mêmes et pour la commodité de nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique, ou tout simplement erronées — nous faisons aussi des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre style, demandez à un ami, demandez sur Twitter, sur Reddit, à une IA, ou consultez un voyant. En résumé : **Faites vos propres recherches (DYOR - Do Your Own Research)**. Apprenons et amusons-nous.

---

## Résumé

- Les places de marché de domaines tokenisés compressent le processus traditionnel annonce → négociation → séquestre → transfert → règlement en une seule transaction on-chain.
- L'élément qui disparaît le plus manifestement est **le séquestre (escrow)** : l'atomicité cryptographique rend inutile la présence d'un tiers détenteur de fonds.
- Les codes d'autorisation, les verrouillages de bureaux d'enregistrement et les virements bancaires disparaissent également pour la partie tokenisée de la transaction.
- De nouveaux risques font leur apparition : sécurité du portefeuille, bugs de contrats intelligents, MEV, coordination en cas d'actifs volés. Ces risques se situent à des endroits différents, ils n'ont pas totalement disparu.
- Bilan net : des ventes plus rapides, moins chères, plus transparentes, avec une expérience utilisateur (UX) différente (et perfectible). Les annonces hybrides restent courantes pour les domaines premium.

Si vous souhaitez essayer de vendre un domaine tokenisé, rendez-vous sur [namefi.io](https://namefi.io). Pour une vue d'ensemble, consultez [Les cas d'usage des domaines tokenisés en 2026](/en/blog/tokenized-domain-use-cases-2026/).