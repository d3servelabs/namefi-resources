---
title: "Le piratage du domaine Panix.com : comment une règle d'approbation automatique de cinq jours a volé le plus ancien FAI de New York"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En janvier 2005, panix.com — le domaine du plus ancien FAI commercial de New York — a été transféré frauduleusement à un bureau d'enregistrement en Australie à l'aide de cartes de crédit volées, mettant le Web et les e-mails hors ligne pendant des jours. Les règles de transfert inter-bureau d'enregistrement avec approbation automatique de l'époque ont rendu cela possible, et le nettoyage qui a suivi a remodelé la politique de transfert de domaine."
keywords: ['panix.com', 'piratage de domaine panix', 'vol de domaine', "transfert inter-bureau d'enregistrement", 'Melbourne IT', 'Dotster', 'Fibranet', 'politique de transfert ICANN', "verrouillage du bureau d'enregistrement", 'clientTransferProhibited', 'sécurité des domaines', 'piratage DNS', "code d'autorisation EPP"]
---

Pendant plus de quinze ans, l'un des plus anciens fournisseurs d'accès à Internet (FAI) commerciaux aux États-Unis a résidé à une seule adresse : **panix.com**. Puis, lors d'un long week-end férié en janvier 2005, quelqu'un s'en est emparé.

Pas en piratant un serveur. Pas en devinant un mot de passe. Ils ont rempli un formulaire de transfert, payé avec une carte de crédit volée, et ont attendu qu'une toute nouvelle règle de l'ICANN fasse le reste. En quelques heures, la propriété de panix.com a été transférée à une entreprise en Australie, son DNS a été pointé vers un hôte au Royaume-Uni, et ses e-mails ont été réacheminés via le Canada — tout cela pendant que les personnes qui dirigeaient réellement Panix dormaient un samedi soir, sans avoir reçu le moindre avertissement.

C'est l'histoire de la façon dont une simple démarche administrative, et non une faille de sécurité, a permis de pirater le plus ancien FAI de New York — et comment les mesures de réparation ont aidé à réécrire les règles régissant qui est autorisé à transférer un domaine.

## Un FAI pionnier dont toute l'activité reposait sur un seul domaine

Panix — Public Access Networks Corporation — n'était pas une petite structure. Fondé en 1989, il s'agissait, selon Wikipédia, du [troisième plus ancien FAI au monde après The World et NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). C'était une institution des débuts de l'Internet commercial à New York : comptes shell, e-mails, hébergement web, et les connexions bas débit puis haut débit que des milliers de New-Yorkais utilisaient pour se connecter.

Et comme presque toutes les entreprises Internet d'hier et d'aujourd'hui, l'identité de Panix *était* son domaine. Les boîtes mail des clients se terminaient par `@panix.com`. Les serveurs web répondaient à `www.panix.com`. L'entreprise tout entière — sa marque, son accessibilité, ce qui faisait qu'un e-mail d'un client arrivait réellement — reposait sur les enregistrements DNS attachés à un seul nom. Perdez le contrôle de ce nom, et vous ne perdez pas seulement un atout marketing. Vous perdez le système nerveux de l'entreprise.

C'est exactement ce qui s'est produit.

## Janvier 2005 : le transfert frauduleux

Le compte rendu juridique est précis quant à la date. Comme le cabinet d'avocats Davis Wright Tremaine l'a résumé à l'époque, [le vendredi 14 janvier 2005, un piratage très médiatisé s'est produit lorsque le nom de domaine "panix.com", appartenant au fournisseur d'accès Internet new-yorkais du même nom, a été transféré sans autorisation à un tiers](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

Aux premières heures de ce week-end, les conséquences étaient déjà visibles. The Register, qui couvrait l'incident en temps réel, a décrit la redirection en une phrase qui ressemble encore au plan d'un braquage : [la propriété de panix.com a été transférée à une entreprise en Australie, les enregistrements DNS réels ont été déplacés vers une entreprise au Royaume-Uni, et la messagerie de Panix.com a été redirigée vers une autre entreprise au Canada](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, où la nouvelle a été annoncée à la communauté technique élargie le 16 janvier, l'a formulé sans détour : [Panix, le plus ancien fournisseur d'accès Internet commercial de New York, s'est fait pirater son nom de domaine 'panix.com' par des inconnus](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

Le détail le plus accablant, du point de vue de Panix, a été le silence. L'entreprise [fondée en 1989 et le plus ancien FAI commercial de New York, a déclaré que ni elle ni son bureau d'enregistrement n'avaient reçu de notification concernant les modifications proposées](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). Le transfert qui a dérobé le domaine était, pour autant que le propriétaire légitime puisse en juger, totalement invisible jusqu'à ce qu'il soit déjà effectif.

## La perturbation : Web et e-mails hors ligne pendant des jours

![Illustration conceptuelle vive et colorée d'un titre de propriété discrètement réenregistré au nom d'un inconnu à l'étranger pendant que le propriétaire légitime dort, un titre en papier lumineux glissant sur un océan vers un bureau étranger tamponné à minuit](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

Un domaine piraté n'est pas un simple interrupteur marche/arrêt net — c'est une disparition lente et pernicieuse, et les pires dommages concernent la messagerie.

Lorsque vous contrôlez le DNS d'un domaine, vous contrôlez l'endroit où ses e-mails sont livrés. En redirigeant les enregistrements de messagerie de panix.com, les pirates se sont transformés en bureau de poste pour toute la clientèle d'un FAI. Les messages entrants — factures, réinitialisations de mot de passe, correspondance professionnelle, courrier personnel — ont cessé d'arriver chez Panix et ont commencé à affluer vers un serveur contrôlé par les attaquants. InfoWorld, faisant le point une fois la tempête passée, a noté que le piratage [a privé certains clients de Panix d'accès à leurs e-mails pendant deux jours](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), et que certains de ces clients ont pu perdre une centaine de messages ou plus au cours du week-end.

Les e-mails mal acheminés lors d'un piratage ne sont pas simplement retardés. Une grande partie est perdue : rejetée, supprimée ou avalée silencieusement par un serveur qui n'aurait jamais dû la recevoir. Pour un fournisseur dont les clients mesuraient la valeur du service à l'aune de « mon e-mail est-il arrivé ? », des jours d'e-mails mal acheminés représentaient presque la pire panne imaginable.

Et les clients ne pouvaient absolument rien faire. Le problème ne venait pas des machines de Panix, qui fonctionnaient parfaitement. Il se situait dans la table de routage mondiale du système des noms de domaine (DNS), à qui l'on avait indiqué — par un bureau d'enregistrement en Australie, agissant sur une demande frauduleuse — que panix.com appartenait désormais à quelqu'un d'autre.

## Comment c'est arrivé : la faille de l'approbation automatique des transferts

![Illustration conceptuelle vive et colorée d'un tampon géant apposant la mention APPROUVÉ sur un formulaire de transfert pour une clé de domaine lumineuse, sans vérification d'identité, sans signature, sans gardien au bureau — une horloge en arrière-plan affichant un compte à rebours de cinq jours](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Voici ce qui fait de Panix un cas d'école plutôt qu'un simple mauvais week-end : personne n'est entré par effraction. Le système a fonctionné exactement comme prévu. C'est sa conception même qui constituait la vulnérabilité.

La mécanique a impliqué une chaîne d'intermédiaires. Le domaine de Panix était enregistré chez **Dotster**, un bureau d'enregistrement à Vancouver, dans l'État de Washington. Le transfert frauduleux a été initié via un compte chez **Fibranet Services Ltd.**, un revendeur basé au Royaume-Uni, qui l'a soumis à **Melbourne IT**, un grand bureau d'enregistrement en Australie. Comme l'a rapporté InfoWorld, [une erreur de Melbourne IT Ltd. a permis à des fraudeurs utilisant des cartes de crédit volées de prendre le contrôle de Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) — le compte utilisé pour le transfert était [frauduleux et ouvert avec des cartes de crédit volées](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

Mais la fraude à la carte de crédit n'a servi qu'à ouvrir le compte. Ce qui a réellement déplacé le domaine, c'est une politique. L'ICANN avait introduit un nouveau processus de transfert inter-bureau d'enregistrement qui n'était entré en vigueur que quelques semaines plus tôt, en novembre 2004, fondé sur le principe de l'*approbation par défaut*. Comme l'expliquait The Register, dans ce nouveau cadre, [ces règles, entrées en vigueur en novembre dernier, signifient que les demandes de transfert inter-registres sont automatiquement approuvées après cinq jours, sauf annulation par le propriétaire du domaine](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Relisez cela attentivement, car tout est là. Le silence signifiait *oui*. Si le propriétaire légitime ne faisait rien — parce que, par exemple, il n'avait jamais reçu la notification —, le transfert s'effectuait de lui-même. Davis Wright Tremaine a décrit le même piège du point de vue juridique : les nouvelles règles [facilitent sans doute la réalisation de transferts frauduleux car, selon ces règles, les domaines sont automatiquement transférés à moins que le propriétaire n'annule la demande de transfert dans les cinq jours](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Cumulez les défaillances et le tableau est sombre. Le bureau d'enregistrement *bénéficiaire* (Melbourne IT, via Fibranet) a accepté une demande soutenue par une carte volée et, de son propre aveu par la suite, [n'a pas vérifié correctement la demande](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). Le bureau d'enregistrement *perdant* (Dotster) et le propriétaire légitime (Panix) n'ont reçu aucune notification efficace et n'ont donc jamais rien annulé. Et le comportement par défaut de la politique — approuver à moins que quelqu'un ne s'y oppose — a transformé cette absence d'objection en un vol réussi. Aucun pare-feu n'a été franchi. La paperasse a été l'arme de l'attaque.

## Le rétablissement et les réformes politiques qu'il a déclenchés

Le rétablissement, une fois que des humains s'en sont mêlés, a été rapide — ce qui est en soi une accusation, car cela prouvait que le transfert n'aurait jamais dû être approuvé au départ.

Dès le dimanche, [Panix avait récupéré son domaine Panix.com auprès de l'entreprise australienne d'hébergement et d'enregistrement de domaines Melbourne IT, où le domaine dérobé était parqué](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain), et l'avait redirigé vers sa maison mère chez Dotster. La réparation au niveau du registre a été presque instantanée ; le nettoyage global ne l'a pas été, car le DNS n'oublie pas sur commande. Comme l'a noté The Register, les serveurs racines ont été mis à jour rapidement, mais la nature distribuée du DNS signifiait qu'il faudrait jusqu'à 24 heures avant que la normalité ne soit complètement rétablie — les caches du monde entier devaient expirer avant que chaque utilisateur ne voie à nouveau le vrai panix.com.

Melbourne IT, tout à son honneur, ne s'est pas caché. Deux jours plus tard, The Register rapportait qu'[un bureau d'enregistrement de domaines australien a admis sa part de responsabilité dans le piratage de nom de domaine du week-end dernier](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), remontant la faille jusqu'à une étape de vérification de son processus de transfert qui n'avait pas été effectuée, et promettant que l'échappatoire ayant permis l'erreur avait été comblée.

Mais la conséquence la plus importante fut structurelle. Panix est devenu l'exemple typique dans la vaste remise en question de la sécurité des transferts qui a suivi. Le Comité consultatif sur la sécurité et la stabilité (SSAC) de l'ICANN a publié un rapport en 2005, [*Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), examinant exactement cette catégorie d'échec : des bureaux d'enregistrement acceptant des transferts sans confirmer que le demandeur était bien le titulaire du nom. Les correctifs durables qui ont renforcé le système découlent directement de week-ends comme celui-ci :

- **Verrouillages des bureaux d'enregistrement par défaut.** Un domaine configuré sur `clientTransferProhibited` refuse tout simplement d'être transféré jusqu'à ce que le verrou soit levé par le titulaire légitime. Ce qui n'était autrefois qu'une option obscure est devenu, pour de nombreux bureaux d'enregistrement, l'état par défaut — un frein que la règle de l'approbation automatique ne pouvait pas contourner.
- **Codes d'autorisation (codes de transfert EPP).** Les transferts modernes de gTLD nécessitent un code d'autorisation secret que le bureau d'enregistrement *perdant* ne divulgue qu'au titulaire vérifié, de sorte qu'un bureau d'enregistrement bénéficiaire ne peut plus s'emparer d'un domaine uniquement avec des formalités administratives.
- **Une [politique de transfert de l'ICANN](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy) documentée** avec des obligations de confirmation plus strictes et un canal de contact d'urgence pour annuler rapidement ce type de transfert frauduleux.

Le piratage de Panix n'a pas inventé ces mécanismes à lui seul, mais il est devenu le cas de référence sur lequel tout le monde s'est appuyé pour démontrer leur nécessité.

## Ce que cela nous apprend sur les verrouillages de transfert et la vérification

Faites abstraction des dates et des noms de bureaux d'enregistrement, et le cas Panix laisse quelques leçons durables.

1. **L'autorisation par défaut est une décision de sécurité, et c'est généralement la mauvaise.** Le choix de conception le plus dangereux en 2005 était que *qui ne dit mot consent*. Un transfert qui aboutit alors que le propriétaire ne fait rien suppose que ce dernier est toujours attentif et toujours joignable. Ni l'un ni l'autre n'est vrai pendant un week-end prolongé.
2. **L'identité doit être vérifiée par la partie qui cède l'actif, et non seulement par celle qui le prend.** Le bureau d'enregistrement bénéficiaire voulait le client et avait tout intérêt à dire oui. La véritable sécurité n'a été atteinte que lorsque le bureau d'enregistrement *perdant* a dû délivrer un code d'autorisation à un titulaire vérifié — plaçant ainsi la vérification là où l'actif réside réellement.
3. **Activez le verrouillage.** `clientTransferProhibited` est la protection la moins chère et la plus efficace dont dispose un propriétaire de domaine contre cette attaque précise, et elle ne coûte rien. Un domaine verrouillé ne peut pas être transféré silencieusement, aussi convaincantes que soient les formalités administratives. Verrouillez vos noms importants et laissez-les verrouillés.
4. **Votre domaine est votre point de défaillance unique.** Les serveurs de Panix n'ont jamais été compromis, et pourtant l'entreprise s'est retrouvée effectivement hors ligne. Lorsqu'un seul enregistrement dans un registre peut rediriger l'intégralité de votre présence Web et e-mail, cet enregistrement mérite une meilleure protection que vos serveurs.
5. **Surveillez les notifications.** La fenêtre d'annulation de cinq jours ne protège qu'un propriétaire qui reçoit — et lit — réellement la notification de transfert. Une adresse e-mail de titulaire obsolète, un contact administratif non surveillé ou un week-end prolongé transforment une soupape de sécurité en une faille silencieuse.

## L'approche Namefi

![Illustration colorée d'une propriété de domaine vérifiable et infalsifiable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et la continuité DNS](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Le piratage de Panix est, fondamentalement, un problème d'*autorité*. La réponse à la question « qui a le droit de transférer ce domaine ? » a été apportée par une chaîne de revendeurs et un délai d'approbation par défaut, plutôt que par une preuve de propriété solide et vérifiable. Une carte de crédit volée et cinq jours de silence ont suffi pour convaincre le système qu'un inconnu dans un autre hémisphère parlait au nom d'un FAI à New York.

[Namefi](https://namefi.io) part du postulat inverse : le contrôle d'un domaine doit être prouvable, et non supposé. En représentant la propriété d'un domaine sous la forme d'un actif tokenisé sur la blockchain qui reste compatible avec le DNS, l'acte déterminant « qui détient ce nom » devient vérifiable et auditable de manière cryptographique — un enregistrement qui ne peut pas être discrètement écrasé par un bureau d'enregistrement acceptant de faux documents. Les transferts se font lorsque la clé du détenteur les autorise, et non lorsqu'un délai de cinq jours expire sans surveillance. La configuration par défaut est le *refus*, et le consentement doit être démontré, et pas seulement ne pas susciter d'objection.

Rien de tout cela n'existait en 1989 lors de la fondation de Panix — ni même en 2005, lorsque le piratage a eu lieu. Mais cela souligne la leçon que ce week-end a enseignée à toute l'industrie : un domaine est trop important pour être régi par le silence. La propriété doit être quelque chose que vous pouvez prouver à la demande — et quelque chose qu'un inconnu ne peut pas vous prendre simplement parce que vous ne surveilliez pas votre boîte de réception pendant un long week-end.

## Sources et lectures complémentaires

- The Register — [Panix recovers from domain hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com hijack: Aussie firm shoulders blame](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Guarding Against Domain Name Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australian company takes blame for Panix domain hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [New York's Oldest ISP Gets Domain-Jacked](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipédia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipédia — [Domain hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- Archives de la liste de diffusion NANOG — [discussion sur le transfert de panix.com et les solutions de l'ICANN](https://diswww.mit.edu/charon/nanog/77162)