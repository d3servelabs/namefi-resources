---
title: "Les domaines expirés et le cycle de chute, expliqués"
date: '2026-06-21'
language: fr
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "Distinguez les délais du bureau d’enregistrement et la suppression du registre : rédemption, suppression en attente, enchères et capture."
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['domaines expirés', 'cycle de chute des domaines', 'cycle de vie d''un domaine', 'période de grâce de rachat', 'suppression en attente', 'capture de domaines à la chute', 'noms de domaine expirés', 'comment les domaines expirent', 'domaines tombés', 'sniping de domaines', 'acheter des domaines expirés', 'période de rachat de domaine', 'quand les domaines chutent', 'backorder de domaine', 'trouver des domaines à revendre']
relatedArticles:
  - /fr/blog/domain-backorders-and-drop-catching/
  - /fr/blog/domain-flipping/
  - /fr/blog/how-to-win-domain-auctions/
  - /fr/blog/hand-registering-domains-to-flip/
  - /fr/blog/when-to-drop-a-domain/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/dns/
  - /fr/glossary/registry/
---

Un domaine expiré ne devient pas immédiatement disponible. Le bureau d’enregistrement gère les délais du client et les éventuelles enchères. Le registre gère la suppression et la libération. Cet article prend les enregistrements ordinaires en `.com` comme exemple. Les extensions nationales et parrainées peuvent suivre d’autres règles.

Les revendeurs s''intéressent à ce recoin du marché parce que les noms tombés ne sont pas des pages blanches. Un nom n''atteint la chute que parce que quelqu''un l''a enregistré, l''a utilisé, puis l''a abandonné : il peut donc porter de l''ancienneté, des liens entrants, un trafic résiduel, ou bien une chaîne de caractères qui avait été prise le jour même où vous auriez sinon pu l''enregistrer à la main. Le cycle est un flux de recyclage pour des noms qui ont déjà prouvé que quelqu''un les voulait — un profil de risque différent de celui d''une chaîne flambant neuve, et l''un des canaux d''approvisionnement que nous cartographions dans [comment trouver des domaines à revendre](/fr/blog/how-to-find-domains-to-flip/). Cet article parcourt le cycle de vie étape par étape, puis couvre les endroits où les noms tombés refont surface et comment les revendeurs se positionnent pour les attraper.

## Étape un : la période d''enregistrement actif et de renouvellement

Le registre peut renouveler automatiquement un `.com` sans paiement du client. Le délai de grâce de 45 jours concerne la facturation entre registre et bureau d’enregistrement. Une suppression pendant ce délai peut donner droit au crédit correspondant. Le client ne bénéficie donc pas automatiquement de 45 jours pour renouveler. Une date prolongée ne prouve pas le paiement du client. Consultez [l’annexe 7, section 3.1.3 du contrat actuel](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm). La [politique actuelle de l’ICANN, section 2.2](https://www.icann.org/resources/pages/errp-2024-02-21-en) autorise la suppression après expiration selon les règles applicables.

## Étape deux : la période de grâce de rachat

![Illustration éditoriale d''une étiquette de nom de domaine suspendue dans un sablier à l''intérieur d''un cadran de compte à rebours, avec une main tendant une pièce pour payer des frais de récupération avant la fin du temps imparti](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

La suppression d’un `.com` ordinaire hors du délai de grâce initial déclenche `redemptionPeriod` pour 30 jours calendaires. La date d’expiration ne déclenche pas directement cette période. Le titulaire doit demander la restauration au bureau qui a supprimé l’enregistrement. Le registre désactive la résolution DNS. L’ICANN impose 30 jours aux gTLD non parrainés, avec une exception pour les suppressions pendant le délai initial. Aucun tarif universel de 100 dollars ne s’applique. Demandez le coût total de restauration et de renouvellement. Consultez les [sections 3 et 4 de la politique actuelle](https://www.icann.org/resources/pages/errp-2024-02-21-en).

## Étape trois : la suppression en attente

Sans restauration pendant la période de rédemption, un `.com` ordinaire entre dans la phase finale de suppression en attente pour cinq jours calendaires. Le registre refuse les modifications, puis purge l’enregistrement. [L’annexe 7, section 3.3.2](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm) fixe ce délai.

Vérifiez tous les statuts ensemble. `pendingDelete` peut accompagner `redemptionPeriod` ou `pendingRestore`. Dans ces cas, la description de la rédemption ou de la restauration s’applique. Le [guide de l’ICANN](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) explique cette distinction. Le statut public ne donne pas une heure exacte de libération. Additionner 45 + 30 + 5 ne garantit pas une libération 80 jours après expiration.

## Étape quatre : la libération, et la course pour l''attraper

![Illustration éditoriale de plusieurs serveurs robots automatisés se ruant à travers un portail ouvert pour attraper une unique étiquette de domaine qui tombe à l''instant même où elle se libère](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

Après la purge, le registre permet un nouvel enregistrement selon ses règles. Une vente aux enchères peut transférer le domaine avant sa suppression. Le domaine peut donc changer de titulaire sans libération publique. Le calendrier des enchères ne constitue pas le calendrier de suppression du registre.

Une réservation demande une tentative d’acquisition sans garantir le résultat. Plusieurs services ne peuvent pas chacun réussir le même nouvel enregistrement. Le service gagnant peut organiser des enchères lorsque plusieurs clients ont réservé le nom. Par exemple, [Dynadot](https://www.dynadot.com/help/question/backorder-auction) organise des enchères publiques après une capture réussie avec plusieurs réservations. Les enchères privées ne constituent pas une règle générale.

## Où les noms tombés refont surface

![Illustration éditoriale d''un hub central en forme de loupe se ramifiant vers quatre canaux — une liste de chute, un ticket de backorder, un marteau d''enchères et une vitrine de marché secondaire — chacun portant une étiquette de domaine](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

Connaître le cycle ne sert que si vous savez où le surveiller. Les noms tombés et en train de tomber refont surface dans quelques endroits prévisibles, et une routine d''approvisionnement efficace puise généralement dans plusieurs à la fois :

- **Listes de chute et bases de données de domaines expirés.** Des listes publiques et payantes publient chaque jour les noms qui entrent en suppression en attente, souvent filtrables par longueur, [TLD](/fr/glossary/tld/), mot-clé, ancienneté et métriques de liens — le flux brut pour une liste de surveillance de noms sur le point de se libérer.
- **Plateformes de backorder et de drop-catch.** Au lieu de surveiller le calendrier vous-même, vous passez un backorder et un service se bat pour le nom à la libération à votre place. C''est la voie pratique pour tout ce qui est demandé — voir [backorders de domaines et drop catching](/fr/blog/domain-backorders-and-drop-catching/).
- **Enchères de domaines expirés.** Beaucoup de bureaux d''enregistrement ne laissent pas leur inventaire de valeur en cours d''expiration arriver jusqu''à la chute publique ; ils l''acheminent vers leurs propres enchères de domaines expirés pendant ou après la fenêtre de grâce, si bien que le nom est vendu plutôt que libéré. Cela recoupe le canal plus large évoqué dans [comment remporter des enchères de domaines](/fr/blog/how-to-win-domain-auctions/).
- **Places de marché secondaires.** Les noms attrapés par quelqu''un d''autre, ou récupérés et re-listés, réapparaissent à la revente sur le [marché secondaire](/fr/glossary/aftermarket/). Ce n''est pas la chute elle-même, mais c''est là qu''aboutit une bonne partie de l''inventaire post-chute.

L''avantage du revendeur consiste à faire correspondre le canal au nom — une chaîne peu disputée sur une liste de chute publique est un coup proche de l''enregistrement à la main, tandis qu''un nom premium d''un seul mot exige un backorder et probablement un budget d''enchères. Si votre instinct vous pousse plutôt à enregistrer des chaînes neuves, c''est une voie légitime et différente, parcourue dans [enregistrer des domaines à la main pour les revendre](/fr/blog/hand-registering-domains-to-flip/).

## Lire le cycle en revendeur

Le titulaire doit contacter immédiatement son bureau d’enregistrement pour connaître les options et les frais de récupération. L’acheteur doit noter l’extension, le bureau, tous les statuts, l’heure de consultation, les enchères et le délai de réservation. La date d’expiration ne garantit aucune date de libération. Une revente ou un transfert de jetons ne supprime pas les obligations de renouvellement du domaine.

**La diligence voyage avec le nom.** Un nom tombé hérite de son histoire, et toute histoire n''est pas bonne. Avant d''enchérir sur un nom ancien, vérifiez son usage antérieur, son [WHOIS](/fr/glossary/whois/) et sa traçabilité de propriété, d''éventuels verrous du [bureau d''enregistrement](/fr/glossary/registrar/), et s''il a jamais hébergé quelque chose qui le ternit. Un nom qui a précédemment porté atteinte à une marque peut toujours attirer une plainte [UDRP](/fr/glossary/udrp/) entre vos mains ; des backlinks existants peuvent aussi bien être du spam que de l''or. La chute vous remet l''actif *et* son passif.

## L''angle Namefi

Attraper un excellent nom tombé n''est que la moitié du travail ; la prochaine fois qu''il change de mains, vous heurtez la même friction que rencontre tout [trading de domaines](/fr/glossary/domain-trading/) de grande valeur. L''acheteur ne paiera pas avant que le nom ne bouge, le vendeur ne le bougera pas avant d''être payé, et le passage de relais du [code d''autorisation](/fr/glossary/auth-code/) entre bureaux d''enregistrement laisse un trou anxiogène au milieu. Ce face-à-face est la raison d''être du [séquestre](/fr/glossary/escrow/), et il devient d''autant plus aigu qu''un nom ancien et riche en liens vaut cher.

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces billets pour nous instruire et par commodité pour nos clients. Les informations qui y figurent peuvent être périmées, propres à une région, ou tout simplement fausses. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n''est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DOYR — Do Your Own Research (faites vos propres recherches)**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

Sources consultées le 22 octobre 2026 (UTC). La traduction conserve sa date initiale.

- [ICANN / Verisign — Contrat actuel .com, annexe 7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)
- [ICANN — ERRP 2024](https://www.icann.org/resources/pages/errp-2024-02-21-en)
- [ICANN — EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/backorder-auction)
