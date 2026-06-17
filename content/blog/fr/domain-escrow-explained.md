---
title: "L'Escrow de domaine expliqué : Comment fonctionnent les transactions sécurisées"
date: '2026-06-10'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un guide simple sur l'escrow et l'escrow de domaine : ce qu'est un compte séquestre, comment l'escrow fonctionne étape par étape lors d'une vente de domaine, pourquoi il est essentiel pour éviter la fraude, la différence entre les services d'escrow traditionnels et l'approche moderne par tokenisation, et comment les smart contracts peuvent remplacer l'escrow par un règlement on-chain atomique."
keywords: ['escrow de domaine', "qu'est-ce que l'escrow", 'compte séquestre', 'signification escrow', 'comment fonctionne un escrow', "service d'escrow de domaine", 'alternative à escrow.com', 'acheter un domaine en toute sécurité', 'vendre un domaine en toute sécurité', "code d'autorisation", 'code EPP', 'transfert de registrar', "frais d'escrow", 'transaction de domaine sécurisée', 'fraude à la vente de domaine', 'escrow de domaine tokenisé', 'escrow par smart contract', 'règlement atomique', 'vente de domaine on-chain', 'comment éviter la fraude de domaine']
---

Si vous avez déjà acheté ou vendu quelque chose de cher à un inconnu — une voiture, une maison, un `.com` à cinq chiffres — vous avez rencontré le même problème : l'acheteur ne veut pas payer avant d'avoir reçu le bien, et le vendeur ne veut pas céder le bien avant d'avoir été payé. Quelqu'un doit faire le premier pas, et faire le premier pas implique de faire confiance à l'autre personne.

L'**escrow** (ou compte séquestre) est la solution standard à ce problème. Ce guide explique ce qu'est un compte séquestre en termes simples, comment l'escrow fonctionne étape par étape lors d'une vente de domaine, pourquoi c'est important, et comment une approche plus récente — les [domaines tokenisés](/en/blog/what-are-tokenized-domains/) et les smart contracts — commence à remplacer complètement l'escrow traditionnel.

---

## Qu'est-ce qu'un compte séquestre (Escrow) ? (En termes simples)

Un **compte séquestre** (escrow account) est un compte de dépôt neutre, contrôlé par un tiers de confiance, qui se place au milieu d'une transaction. Au lieu de payer le vendeur directement, l'acheteur paie *l'escrow*. Le service d'escrow conserve l'argent — et parfois l'actif — jusqu'à ce que les deux parties aient rempli leur part du contrat. Ce n'est qu'à ce moment-là que l'escrow libère les fonds au vendeur.

Le mot clé est **neutre**. Le fournisseur du service d'escrow n'a aucun intérêt dans la réussite ou l'échec de la transaction. Son seul travail est de suivre une règle simple :

> Conserver l'argent. Ne le débloquer pour le vendeur que lorsque les conditions convenues sont remplies. Sinon, le restituer à l'acheteur.

C'est toute l'idée. L'escrow ne rend aucune des parties plus honnête — il supprime simplement le besoin de se faire confiance, en insérant un arbitre payé pour être impartial. Vous verrez des services d'escrow dans l'immobilier, les fusions et acquisitions, les plateformes pour freelances, et très couramment dans l'industrie des noms de domaine.

---

## Comment fonctionne l'Escrow étape par étape dans une vente de domaine

Voici le processus classique pour la vente d'un nom de domaine via un service d'escrow comme [Escrow.com](https://www.escrow.com/) :

1. **Accord sur les termes.** L'acheteur et le vendeur s'entendent sur un prix et sur qui paiera les frais d'escrow. Ils ouvrent une transaction sur le service d'escrow.
2. **L'acheteur approvisionne l'escrow.** L'acheteur envoie le montant convenu sur le compte séquestre — par virement, carte ou crypto. Point crucial, le vendeur ne possède *pas* encore cet argent ; l'escrow ne fait que le conserver.
3. **L'escrow confirme les fonds.** Le service d'escrow vérifie que le paiement a été validé et notifie le vendeur : *"L'argent est là. Vous pouvez transférer le domaine en toute sécurité."*
4. **Le vendeur transfère le domaine.** Le vendeur déverrouille le domaine chez son [registrar](/en/glossary/registrar/) (bureau d'enregistrement) et fournit le [code d'autorisation](/en/glossary/auth-code/) (également appelé code EPP) — un mot de passe qui autorise le transfert du domaine vers un autre registrar.
5. **L'acheteur initie le transfert.** À l'aide de ce code d'autorisation, l'acheteur lance le transfert vers son propre registrar. Un transfert inter-registrar de l'[ICANN](https://www.icann.org/) prend généralement de cinq à sept jours pour être entièrement validé.
6. **L'acheteur confirme la réception.** Une fois que le domaine arrive sur le compte de l'acheteur, celui-ci confirme la réception via le service d'escrow.
7. **L'escrow libère les fonds.** Maintenant — et seulement maintenant — l'escrow paie le vendeur. La transaction est terminée.
8. **Déduction des frais.** Les services d'escrow prélèvent généralement un pourcentage (souvent un petit chiffre à un seul chiffre), auquel peuvent s'ajouter des commissions de la marketplace.

Remarquez ce que l'escrow accomplit : il met fin à l'impasse. Le vendeur transfère le domaine *en sachant que l'argent se trouve déjà* sur le compte séquestre, et l'acheteur paie *en sachant qu'il récupérera son argent* si le domaine n'arrive jamais. Aucune des parties n'a besoin de faire confiance à l'autre — toutes deux font confiance à l'arbitre.

---

## Pourquoi l'Escrow est important : Il s'agit d'éviter la fraude

Les domaines sont une cible privilégiée pour la fraude précisément parce qu'ils sont précieux, intangibles et échangés entre des parties anonymes à travers le monde. Sans escrow, une vente de domaine regorge de moyens de se faire avoir :

- **L'acheteur paie et le domaine n'arrive jamais.** Le vendeur encaisse le virement et disparaît.
- **Le vendeur transfère le domaine et le paiement n'arrive jamais.** Ou bien l'acheteur annule son paiement après avoir reçu le domaine (une rétrofacturation ou chargeback).
- **Le "domaine" n'a jamais appartenu au vendeur.** Des domaines volés ou piratés sont mis en vente par des personnes qui ne les possèdent pas réellement.

L'escrow neutralise directement les deux premiers risques : l'argent et l'actif ne peuvent pas disparaître en même temps, car l'escrow conserve l'un jusqu'à ce que l'autre soit confirmé. Les services d'escrow réputés ajoutent également des contrôles d'identité et des vérifications de paiement qui permettent aussi d'intercepter une partie de la troisième catégorie de fraudes. Pour toute vente de domaine significative entre des personnes qui ne se connaissent pas, **l'utilisation d'un escrow est la norme de base** — refuser de l'utiliser est en soi un signal d'alarme (red flag).

Pour en savoir plus sur le paysage des menaces, découvrez [comment le piratage de domaine se produit réellement](/en/blog/how-domain-hijacking-actually-happens/).

---

## Services traditionnels d'Escrow de domaine : Les compromis

Le modèle de l'escrow est la norme dans les domaines depuis deux décennies, et il fonctionne. Mais il comporte des coûts réels :

- **Les frais.** Un pourcentage du prix de vente revient au service d'escrow — de l'argent qui est déduit de la transaction.
- **Le temps.** Entre le dépôt des fonds, le transfert du registrar et la fenêtre de compensation de l'ICANN, une vente peut prendre une semaine ou plus.
- **Les étapes manuelles.** Codes d'autorisation, déverrouillages, confirmations de transfert — chaque étape est une occasion de faire une erreur ou de subir un retard.
- **Vous devez toujours faire confiance à un tiers.** L'escrow déplace la confiance de "l'autre personne" vers "l'entreprise d'escrow". C'est une grande amélioration, mais ce n'est pas du "zéro confiance". L'entreprise d'escrow conserve votre argent pendant toute la durée de l'opération.

Ces compromis étaient simplement le prix à payer pour la sécurité — jusqu'à ce qu'un modèle de règlement différent fasse son apparition.

---

## Comment les Domaines Tokenisés et les Smart Contracts remplacent l'Escrow

Lorsqu'un domaine est [tokenisé](/en/blog/what-are-tokenized-domains/), la propriété est représentée par un jeton sur la blockchain (un NFT) plutôt que par une simple entrée dans la base de données d'un registrar. Cela change les possibilités au moment du règlement.

Un [smart contract](/en/glossary/smart-contract/) (ou contrat intelligent) est un code qui s'exécute sur une blockchain et se déclenche automatiquement lorsque ses conditions sont remplies. Plus important encore, une transaction on-chain (sur la blockchain) est **atomique** : le paiement et le transfert de l'actif se produisent dans la *même* transaction, dans le même bloc — ou aucun des deux ne se produit. Il n'y a pas d'état intermédiaire où l'une des parties a agi et pas l'autre.

Cette propriété fait exactement ce pour quoi l'escrow a été inventé, sans qu'un tiers ne détienne quoi que ce soit :

- Le paiement de l'acheteur et le transfert du jeton du vendeur s'échangent **au même instant**. Le vendeur ne peut pas prendre l'argent et fuir, car le jeton ne se déplace que si le paiement se déplace avec lui.
- Il n'y a **aucun code d'autorisation à partager** et aucun transfert de registrar de plusieurs jours pour le changement de propriété on-chain — le jeton se déplace immédiatement.
- Il n'y a **aucun frais d'escrow**, car aucun tiers neutre ne conserve les fonds. Le smart contract *est* l'arbitre impartial, et son exécution est gratuite, au-delà des frais de réseau habituels (frais de gaz).

En d'autres termes, le smart contract devient l'escrow — mais il est transparent, automatique, instantané, et ne prend pas de commission pour détenir votre argent. Pour une explication plus détaillée du flux complet des marketplaces et des endroits où les risques se déplacent, voir [De l'annonce au règlement : Comment les marketplaces tokenisées remplacent l'escrow](/en/blog/how-tokenized-marketplaces-replace-escrow/).

Cela n'est pas sans risque — cela ne fait que déplacer les risques. Au lieu de faire confiance à une société d'escrow, vous dépendez maintenant de la sécurité de votre portefeuille crypto et de la fiabilité du smart contract. L'idée n'est pas que le règlement par tokenisation est magique ; c'est que le *travail effectué par l'escrow* peut être accompli par du code plutôt que par un intermédiaire rémunéré.

---

## Alors, devez-vous toujours utiliser un Escrow ?

Cela dépend de ce que vous échangez :

- **Acheter ou vendre un domaine traditionnel non tokenisé entre inconnus ?** Oui — utilisez un service d'escrow réputé. Les frais en valent la peine, et ignorer l'escrow est le meilleur moyen de se faire escroquer.
- **Échanger un domaine tokenisé sur une marketplace ?** Le règlement atomique on-chain vous offre déjà la garantie fondamentale de l'escrow. Votre attention se porte alors sur la vérification du contrat et de l'adresse du destinataire.

Namefi travaille avec des domaines tokenisés afin que l'achat et la vente puissent se régler de manière on-chain — vous offrant la sécurité de l'escrow sans l'attente ou la commission. Si vous voulez voir comment cela fonctionne en pratique, rendez-vous sur [namefi.io](https://namefi.io).

---

## Foire Aux Questions

### Qu'est-ce qu'un compte séquestre (escrow account) ?

Un compte séquestre est un compte neutre détenu par un tiers de confiance qui conserve le paiement d'un acheteur pendant une transaction. Les fonds ne sont libérés pour le vendeur qu'une fois les conditions convenues remplies — et restitués à l'acheteur dans le cas contraire. Il permet à deux parties de réaliser une transaction sans avoir à se faire confiance directement.

### Que signifie l'escrow dans une vente de domaine ?

Dans une vente de domaine, l'escrow signifie qu'un service tiers conserve l'argent de l'acheteur pendant que le domaine est transféré du registrar du vendeur à celui de l'acheteur. Une fois que l'acheteur confirme qu'il a bien reçu le domaine, l'escrow libère les fonds au vendeur. Cela protège les deux parties contre la fraude.

### Comment fonctionne l'escrow de domaine étape par étape ?

L'acheteur approvisionne le compte séquestre ; l'escrow confirme le paiement ; le vendeur déverrouille le domaine et partage le code d'autorisation ; l'acheteur transfère le domaine vers son registrar ; l'acheteur confirme la réception ; et l'escrow libère ensuite l'argent au vendeur.

### Pourquoi ai-je besoin d'un escrow pour acheter un domaine ?

Parce que sans cela, soit l'acheteur peut payer et ne jamais recevoir le domaine, soit le vendeur peut le transférer et ne jamais être payé. L'escrow garde l'argent au milieu afin qu'aucune des parties ne puisse tromper l'autre. Pour toute vente importante entre inconnus, c'est la pratique de sécurité de base.

### Les smart contracts peuvent-ils remplacer l'escrow ?

Oui, pour les actifs tokenisés. Un smart contract peut régler le paiement et le transfert d'actifs de manière atomique — les deux se produisent ensemble ou aucun ne se produit — ce qui offre la garantie fondamentale de l'escrow de manière automatique, instantanée et sans qu'un tiers ne détienne de fonds ou ne prélève de frais.

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical, ou toute autre forme de conseil professionnel.** Nous rédigeons ces articles pour nous éduquer nous-mêmes et pour des raisons pratiques pour nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique, ou tout simplement fausses — nous faisons aussi des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre style, demandez à un ami, demandez sur Twitter, demandez sur Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DYOR — Do Your Own Research (Faites vos propres recherches)**. Apprenons tout en nous amusant.

---

## Résumé

- Un **compte séquestre** (escrow) est un compte de dépôt neutre, détenu par un tiers, qui ne libère les fonds au vendeur qu'une fois les conditions convenues remplies.
- Dans une vente de domaine, l'escrow conserve l'argent de l'acheteur pendant le transfert du domaine via le registrar et le code d'autorisation, puis paie le vendeur une fois que l'acheteur a confirmé la réception.
- L'escrow est important car il **supprime le besoin de faire confiance à l'autre partie**, neutralisant ainsi les fraudes les plus courantes lors des ventes de domaines.
- L'escrow traditionnel fonctionne, mais coûte des frais, prend du temps et nécessite toujours de faire confiance à un intermédiaire.
- **Les domaines tokenisés couplés aux smart contracts** peuvent remplacer l'escrow par un règlement on-chain atomique — le paiement et l'actif se déplacent ensemble ou pas du tout — offrant la même sécurité sans l'attente ou la commission.