---
title: "Le séquestre de domaine expliqué : comment fonctionnent les transactions de domaines sécurisées"
date: '2026-06-10'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: Un guide en langage clair sur le séquestre et le séquestre de domaine — ce qu'est un compte séquestre, comment fonctionne le séquestre étape par étape dans une vente de domaine, pourquoi c'est important pour éviter la fraude, les services de séquestre traditionnels par rapport à l'approche tokenisée moderne, et comment les contrats intelligents peuvent remplacer le séquestre par un règlement atomique en chaîne.
keywords: ['séquestre de domaine', 'qu''est-ce que le séquestre', 'compte séquestre', 'signification séquestre', 'comment fonctionne le séquestre', 'service de séquestre de domaine', 'alternative escrow.com', 'acheter un domaine en toute sécurité', 'vendre un domaine en toute sécurité', 'code auth', 'code EPP', 'transfert de registrar', 'frais de séquestre', 'transaction de domaine sécurisée', 'fraude à la vente de domaine', 'séquestre de domaine tokenisé', 'séquestre par contrat intelligent', 'règlement atomique', 'vente de domaine en chaîne', 'comment éviter la fraude de domaine']
---

Si vous avez déjà acheté ou vendu quelque chose de coûteux entre inconnus — une voiture, une maison, un `.com` valant plusieurs dizaines de milliers d'euros — vous vous êtes heurté au même problème : l'acheteur ne veut pas payer avant d'avoir reçu la chose, et le vendeur ne veut pas remettre la chose avant d'avoir été payé. Quelqu'un doit faire le premier pas, et faire le premier pas signifie faire confiance à l'autre personne.

**Le séquestre** est la solution standard à ce problème. Ce guide explique en termes simples ce qu'est un compte séquestre, comment fonctionne le séquestre étape par étape dans une vente de domaine, pourquoi c'est important, et comment une approche plus récente — les [domaines tokenisés](/fr/blog/what-are-tokenized-domains/) et les contrats intelligents — commence à remplacer entièrement le séquestre traditionnel.

---

## Qu'est-ce qu'un compte séquestre ? (En langage clair)

Un **compte séquestre** est un compte de dépôt neutre, contrôlé par un tiers de confiance, qui se place au milieu d'une transaction. Au lieu de payer directement le vendeur, l'acheteur paie *le séquestre*. Le séquestre conserve l'argent — et parfois l'actif — jusqu'à ce que les deux parties aient rempli leur part. Ce n'est qu'à ce moment que le séquestre libère les fonds au vendeur.

Le mot clé est **neutre**. Le prestataire de séquestre n'a aucun intérêt dans la réussite de la transaction. Son seul rôle est de suivre une règle simple :

> Conserver l'argent. Ne le libérer au vendeur que lorsque les conditions convenues sont remplies. Sinon, le restituer à l'acheteur.

C'est toute l'idée. Le séquestre ne rend pas l'une ou l'autre des parties plus honnête — il supprime la nécessité pour elles de se faire mutuellement confiance, en insérant un arbitre dont le rôle est d'être impartial. Vous rencontrerez le séquestre dans l'immobilier, dans les fusions-acquisitions, dans les places de marché pour indépendants, et très souvent dans le secteur des noms de domaine.

---

## Comment fonctionne le séquestre étape par étape dans une vente de domaine

Voici le processus classique pour vendre un nom de domaine via un service de séquestre tel qu'[Escrow.com](https://www.escrow.com/) :

1. **Accord sur les conditions.** L'acheteur et le vendeur s'entendent sur un prix et sur qui paie les frais de séquestre. Ils ouvrent une transaction auprès du service de séquestre.
2. **L'acheteur approvisionne le séquestre.** L'acheteur envoie le montant convenu sur le compte séquestre — par virement, carte ou crypto. Fait important, le vendeur ne dispose *pas* encore de cet argent ; le séquestre le conserve simplement.
3. **Le séquestre confirme les fonds.** Le service de séquestre vérifie que le paiement a bien été reçu et notifie le vendeur : *« L'argent est disponible. Vous pouvez transférer le domaine en toute sécurité. »*
4. **Le vendeur transfère le domaine.** Le vendeur déverrouille le domaine auprès de son [registrar](/fr/glossary/registrar/) et fournit le [code auth](/fr/glossary/auth-code/) (également appelé code EPP) — un mot de passe qui autorise le déplacement du domaine vers un autre registrar.
5. **L'acheteur initie le transfert.** En utilisant ce code auth, l'acheteur lance un transfert vers son propre registrar. Un [transfert inter-registrar](/fr/glossary/cross-registrar-transfer/) [ICANN](https://www.icann.org/) prend généralement entre cinq et sept jours pour être entièrement finalisé.
6. **L'acheteur confirme la réception.** Une fois le domaine arrivé dans le compte de l'acheteur, celui-ci le confirme via le service de séquestre.
7. **Le séquestre libère les fonds.** Maintenant — et seulement maintenant — le séquestre paie le vendeur. La transaction est terminée.
8. **Les frais sont prélevés.** Les services de séquestre facturent généralement un pourcentage (souvent quelques points), et des commissions de place de marché peuvent s'y ajouter.

Remarquez ce que le séquestre accomplit : il brise l'impasse. Le vendeur transfère le domaine *en sachant que l'argent existe déjà* dans le compte séquestre, et l'acheteur paie *en sachant qu'il récupérera son argent* si le domaine n'arrive jamais. Aucune des deux parties n'a besoin de faire confiance à l'autre — elles font toutes deux confiance à l'arbitre.

---

## Pourquoi le séquestre est important : il s'agit d'éviter la fraude

Les domaines sont une cible privilégiée pour la fraude précisément parce qu'ils sont précieux, immatériels et circulent entre des parties anonymes à travers le monde. Sans séquestre, une vente de domaine regorge de possibilités de se faire arnaquer :

- **L'acheteur paie et le domaine n'arrive jamais.** Le vendeur encaisse le virement et disparaît.
- **Le vendeur transfère et le paiement ne vient jamais.** Ou l'acheteur conteste le paiement après avoir reçu le domaine (un chargeback).
- **Le « domaine » n'appartenait jamais au vendeur.** Des domaines volés ou piratés sont mis en vente par des personnes qui n'en sont pas les propriétaires.

Le séquestre neutralise directement les deux premiers cas : l'argent et l'actif ne peuvent pas disparaître tous les deux, car le séquestre conserve l'un jusqu'à ce que l'autre soit confirmé. Les services de séquestre réputés ajoutent également des vérifications d'identité et de paiement qui permettent de détecter certains cas de la troisième catégorie. Pour toute vente de domaine significative entre inconnus, **le séquestre est l'attente de base** — refuser de l'utiliser est en soi un signal d'alarme.

Pour en savoir plus sur le paysage des menaces, consultez [comment le piratage de domaine se produit réellement](/fr/blog/how-domain-hijacking-actually-happens/).

---

## Les services de séquestre de domaine traditionnels : les compromis

Le modèle de séquestre est la norme dans les domaines depuis deux décennies, et il fonctionne. Mais il comporte de réels coûts :

- **Les frais.** Un pourcentage du prix de vente va au service de séquestre — de l'argent qui sort de la transaction.
- **Le temps.** Entre l'approvisionnement, le transfert du registrar et la fenêtre de compensation [ICANN](/fr/glossary/icann/), une vente peut prendre une semaine ou plus.
- **Les étapes manuelles.** Codes auth, déverrouillages, confirmations de transfert — chacun est une occasion d'erreur ou de retard.
- **Vous faites toujours confiance à un tiers.** Le séquestre déplace la confiance de « l'autre personne » vers « la société de séquestre ». C'est une grande amélioration, mais ce n'est pas zéro confiance. La société de séquestre conserve votre argent pendant toute la durée de la transaction.

Ces compromis étaient simplement le prix de la sécurité — jusqu'à l'arrivée d'un modèle de règlement différent.

---

## Comment les domaines tokenisés + les contrats intelligents remplacent le séquestre

Lorsqu'un domaine est [tokenisé](/fr/blog/what-are-tokenized-domains/), la propriété est représentée par un jeton en chaîne (un NFT) plutôt que par une simple entrée dans la base de données d'un registrar. Cela change ce qui est possible au moment du règlement.

Un [contrat intelligent](/fr/glossary/smart-contract/) est un code qui s'exécute sur une [blockchain](/fr/glossary/blockchain/) et s'active automatiquement lorsque ses conditions sont remplies. Fait crucial, une transaction en chaîne est **atomique** : le paiement et le transfert d'actif se produisent dans la *même* transaction, dans le même bloc — ou aucun des deux ne se produit. Il n'existe pas d'état intermédiaire où un côté a bougé et l'autre non.

Cette propriété accomplit exactement ce pour quoi le séquestre a été inventé, sans qu'un tiers ne retienne quoi que ce soit :

- Le paiement de l'acheteur et le jeton du vendeur s'échangent **au même instant**. Le vendeur ne peut pas prendre l'argent et partir, car le jeton ne bouge que si le paiement bouge avec lui.
- Il n'y a **pas de code auth à partager** et pas de transfert de registrar sur plusieurs jours pour le changement de propriété en chaîne — le jeton se déplace immédiatement.
- Il n'y a **pas de frais de séquestre**, car aucune partie neutre ne conserve des fonds. Le contrat intelligent *est* l'arbitre impartial, et son exécution est gratuite au-delà des frais réseau normaux.

En d'autres termes, le contrat intelligent devient le séquestre — mais il est transparent, automatique, instantané et ne prélève pas de commission pour conserver votre argent. Pour une présentation détaillée du flux complet de la place de marché et de l'évolution des risques, consultez [De la mise en vente au règlement : comment les places de marché tokenisées remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/).

Ce n'est pas sans risque — cela déplace simplement les risques. Au lieu de faire confiance à une société de séquestre, vous dépendez désormais de la sécurité du [portefeuille](/fr/glossary/wallet/) et de la solidité du contrat intelligent. L'objectif n'est pas que le règlement tokenisé soit magique ; c'est que *le travail qu'accomplit le séquestre* peut être réalisé par du code plutôt que par un intermédiaire rémunéré.

---

## Devriez-vous encore utiliser le séquestre ?

Cela dépend de ce que vous négociez :

- **Achat ou vente d'un domaine traditionnel non tokenisé entre inconnus ?** Oui — utilisez un service de séquestre réputé. Les frais en valent la peine, et ignorer le séquestre est la façon dont les gens se font arnaquer.
- **Transaction d'un domaine tokenisé sur une place de marché ?** Le règlement atomique en chaîne vous offre déjà la garantie fondamentale du séquestre. Votre attention se porte alors sur la vérification du contrat et de l'adresse du destinataire.

Namefi travaille avec des domaines tokenisés afin que les achats et les ventes puissent se régler en chaîne — vous offrant la sécurité que procure le séquestre sans l'attente ni le pourcentage. Si vous voulez voir comment cela fonctionne en pratique, rendez-vous sur [namefi.io](https://namefi.io).

---

## Questions fréquemment posées

### Qu'est-ce qu'un compte séquestre ?

Un compte séquestre est un compte neutre détenu par un tiers de confiance qui conserve le paiement de l'acheteur pendant une transaction. Les fonds sont libérés au vendeur uniquement une fois les conditions convenues remplies — et restitués à l'acheteur dans le cas contraire. Il permet à deux parties de transacter sans avoir à se faire directement confiance.

### Que signifie le séquestre dans une vente de domaine ?

Dans une vente de domaine, le séquestre signifie qu'un service tiers conserve l'argent de l'acheteur pendant que le domaine est transféré du registrar du vendeur à celui de l'acheteur. Une fois que l'acheteur confirme qu'il a reçu le domaine, le séquestre libère les fonds au vendeur. Cela protège les deux parties contre la fraude.

### Comment fonctionne le séquestre de domaine étape par étape ?

L'acheteur approvisionne le compte séquestre ; le séquestre confirme le paiement ; le vendeur déverrouille le domaine et partage le code auth ; l'acheteur transfère le domaine vers son registrar ; l'acheteur confirme la réception ; et le séquestre libère ensuite l'argent au vendeur.

### Pourquoi ai-je besoin d'un séquestre pour acheter un domaine ?

Parce que sans lui, soit l'acheteur peut payer et ne jamais recevoir le domaine, soit le vendeur peut le transférer et ne jamais être payé. Le séquestre conserve l'argent au milieu afin qu'aucune des parties ne puisse tromper l'autre. Pour toute vente significative entre inconnus, c'est la pratique de sécurité de base.

### Les contrats intelligents peuvent-ils remplacer le séquestre ?

Oui, pour les actifs tokenisés. Un contrat intelligent peut régler le paiement et le transfert d'actif de manière atomique — les deux se produisent ensemble ou aucun ne se produit — ce qui offre automatiquement, instantanément et sans tiers conservant des fonds ni prélevant de frais, la garantie fondamentale du séquestre.

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes pas avocats, comptables, conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou professionnel de quelque nature que ce soit.** Nous rédigeons ces articles pour nous éduquer nous-mêmes et comme service à nos clients. Les informations ici peuvent être obsolètes, spécifiques à une région, ou tout simplement incorrectes — nous faisons des erreurs aussi.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre style, demandez à un ami, à Twitter, à Reddit, à une IA, ou à un voyant. En bref : **FRPV — Faites Vos Propres Vérifications**. Apprenons et amusons-nous.

---

## Résumé

- Un **compte séquestre** est un compte de dépôt neutre, tenu par un tiers, qui libère les fonds au vendeur uniquement après que les conditions convenues sont remplies.
- Dans une vente de domaine, le séquestre conserve l'argent de l'acheteur pendant que le domaine est transféré via le registrar et le code auth, puis paie le vendeur une fois que l'acheteur confirme la réception.
- Le séquestre est important car il **supprime la nécessité de faire confiance à l'autre partie**, neutralisant les fraudes les plus courantes dans la vente de domaines.
- Le séquestre traditionnel fonctionne mais coûte des frais, prend du temps et nécessite toujours de faire confiance à un intermédiaire.
- **Les domaines tokenisés + les contrats intelligents** peuvent remplacer le séquestre par un règlement atomique en chaîne — le paiement et l'actif se déplacent ensemble ou pas du tout — offrant la même sécurité sans l'attente ni la commission.
