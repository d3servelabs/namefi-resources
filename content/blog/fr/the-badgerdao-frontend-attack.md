---
title: "L'attaque front-end de BadgerDAO : 120 millions de dollars siphonnés via un seul script injecté"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En décembre 2021, des attaquants ont compromis le compte Cloudflare de BadgerDAO et injecté un script malveillant dans le front-end de son site web. Les smart contracts audités n'ont jamais été touchés — pourtant, près de 120 millions de dollars se sont envolés via des approbations de portefeuille que les utilisateurs ont signées à leur insu. Une analyse approfondie de la raison pour laquelle le site web fait partie de votre surface de sécurité."
keywords: ["piratage badgerdao", "attaque front-end badgerdao", "compromission de clé api cloudflare", "attaque par script injecté", "sécurité front-end web3", "ice phishing", "attaque increaseAllowance", "faille d'approbation de token", "sécurité dns et domaine", "faille cloudflare workers", "sécurité defi", "attaque supply chain web3", "falsification de site web", "sécurité de domaine"]
---

L'audit était parfait. Les contrats étaient sains. L'argent a disparu quand même.

Aux alentours du 2 décembre 2021, BadgerDAO — un projet DeFi dont le but est d'intégrer Bitcoin dans la finance décentralisée — a perdu environ **120 millions de dollars** des fonds de ses utilisateurs. Il n'y a pas eu d'astuce de flash-loan, ni de faille de réentrance, ni d'exploit mathématique ingénieux ciblant les coffres-forts (vaults). Les smart contracts ont exécuté exactement ce pour quoi ils avaient été programmés. L'attaquant n'a jamais eu besoin de les forcer, car l'attaquant ne les a jamais attaqués.

Il a attaqué le *site web*.

Quelqu'un avait discrètement glissé un script malveillant dans le front-end de app.badger.com. Pour chaque utilisateur qui chargeait la page, elle ressemblait à la même dApp de confiance qu'ils utilisaient tous les jours. Mais lorsqu'ils interagissaient avec celle-ci, la page demandait à leur portefeuille une permission supplémentaire et invisible — et une fois qu'ils avaient cliqué sur « approuver », leurs tokens ne leur appartenaient plus.

Voici l'histoire de la façon dont un projet avec des contrats audités a perdu neuf chiffres à cause d'une seule ligne de code injectée dans son front-end, et pourquoi cela devrait changer définitivement votre perception des limites de votre sécurité.

## Le mensonge réconfortant : « les contrats sont audités »

La culture crypto a habitué les utilisateurs à se poser une seule question avant de faire confiance à un protocole : *a-t-il été audité ?* Les audits sont importants. Ils permettent de détecter de véritables bugs. Mais quelque part en cours de route, « les contrats sont audités » s'est transformé en un sentiment de sécurité absolue — comme si un rapport d'audit vierge agissait tel un champ de force autour de tout ce qui portait le nom du projet.

Ce n'est pas le cas.

Un audit examine le code on-chain : les coffres-forts, la logique du token, les contrôles d'accès. Il ne dit rien sur l'ordinateur portable qu'un développeur a laissé connecté, sur les enregistrements DNS qui redirigent votre navigateur, sur le CDN placé devant le site, ou sur le JavaScript que votre navigateur télécharge et exécute réellement lorsque vous visitez la dApp. Ces éléments se trouvent dans le *Web2* — dans des comptes cloud, des clés API et des infrastructures de domaine — et ils sont tout aussi cruciaux et porteurs que le code Solidity.

BadgerDAO est la preuve la plus flagrante de cette faille jamais enregistrée. Comme l'a résumé sans détour une analyse technique de l'incident : [du point de vue des smart contracts du projet, rien ne s'était mal passé](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), et l'attaquant ne faisait qu'utiliser les approbations accordées par les utilisateurs. La blockchain s'est comportée parfaitement. Le site web a menti.

## L'attaque : une vitrine falsifiée avec un reçu conforme

![Vivid colorful concept art of a trusted, friendly-looking storefront whose cash register has been quietly tampered with, an extra hidden drawer siphoning coins while customers smile and pay normally](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Imaginez entrer dans un magasin que vous avez visité une centaine de fois. Même enseigne, même personnel, même comptoir. Vous achetez un petit article, le caissier l'enregistre, vous utilisez votre carte. Tout semble normal. Ce que vous ne pouvez pas voir, c'est que quelqu'un a échangé le lecteur de carte contre un autre qui autorise aussi discrètement un deuxième prélèvement, illimité, sur votre compte — au profit d'un inconnu, quand il le souhaite.

C'est, en effet, ce qui est arrivé aux utilisateurs de BadgerDAO.

La classification de cette attaque est importante, car c'est ce qui rend cet incident si instructif. Comme l'a résumé *Vice*, le piratage [n'impliquait pas d'exploits de smart contracts complexes. Au lieu de cela, il s'agissait d'une attaque front-end ciblant l'infrastructure web de BadgerDAO](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — en particulier son compte Cloudflare. C'était, selon leurs termes, une attaque web *à l'ancienne* dirigée vers une cible Web3.

Le mécanisme était élégant et silencieux. Le script malveillant demandait au portefeuille de l'utilisateur d'accorder une autorisation de dépense de tokens à l'adresse de l'attaquant. Selon les mots de Vice, [le script malveillant a essentiellement trompé les gens pour qu'ils accordent à l'adresse les droits d'envoyer les tokens vers l'adresse de l'exploiteur](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). L'utilisateur pensait effectuer une opération habituelle sur la dApp. En réalité, il cédait les clés de ses tokens.

Les chercheurs en sécurité appellent ce schéma le *ice phishing* : au lieu de voler votre clé privée, vous êtes piégé pour approuver volontairement un dépensier malveillant. La signature est réelle. L'approbation est réelle. La transaction on-chain est valide. C'est exactement pour cela que c'est si dangereux — et pourquoi aucun audit de contrat n'aurait pu l'arrêter.

## Ce que les utilisateurs ont perdu : ~120 millions de dollars, une signature à la fois

Les chiffres sont stupéfiants pour une attaque qui n'a jamais touché à une seule ligne de code des coffres-forts.

L'entreprise d'audit de smart contracts PeckShield [a estimé que les pertes totales s'élevaient à environ 120 millions de dollars](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Le propre bilan post-mortem de BadgerDAO, reproduit dans les études de cas de l'incident, a évalué la perte à [environ 2076,54 BTC (~116,3 millions de dollars américains au moment du piratage)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC) une fois tous les actifs volés convertis dans une unité commune.

La douleur n'a pas été répartie équitablement. Une seule victime — qui serait un compte institutionnel — a perdu la part du lion en une seule transaction : les études de cas notent qu'[environ 900 BTC ont été retirés du coffre-fort wBTC de Yearn](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), une seule entité perdant à elle seule [plus de 50 millions de dollars en wrapped Bitcoin](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). Des centaines d'utilisateurs ordinaires ont constitué le reste.

Et l'ampleur de l'attaque a été une conséquence directe de la patience. L'attaquant n'a pas agi dans la précipitation. Comme le décrit l'analyse de Forta, [le hacker a silencieusement accumulé les approbations de près de 200 comptes, puis à 00h48 le 2 décembre 2021, il a vidé les portefeuilles des victimes en moins de 10 heures](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Les approbations malveillantes s'étaient accumulées discrètement pendant des jours — un piège armé, déclenché d'un seul coup. Une autre reconstitution a comptabilisé [500 portefeuilles ayant créé ces approbations illimitées](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets) sur toute la durée de la campagne.

Le détail le plus cruel : il n'y avait rien qu'un utilisateur prudent aurait pu vérifier. L'URL était correcte. Le certificat TLS était valide. L'interface était authentique. La seule anomalie était un extrait de JavaScript que le site légitime lui-même distribuait.

## Comment c'est arrivé : une clé API Cloudflare et une approbation injectée

![Vivid colorful concept art of an invisible hand quietly adding one extra glowing approve button to a wallet pop-up while the real interface looks calm and trustworthy, a single malicious line of code slipping into a friendly web page](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

La porte d'entrée utilisée par l'attaquant n'était pas un smart contract. C'était un compte cloud.

BadgerDAO, comme une énorme partie du web moderne, se trouvait derrière Cloudflare — la couche de distribution de contenu (CDN) et de calcul à la périphérie (edge-compute) qui héberge et accélère les sites web. Le contrôle de ce compte signifiait le contrôle du code que le site web de BadgerDAO transmettait aux visiteurs. Et l'attaquant a obtenu ce contrôle via une clé volée.

Selon la déclaration officielle de BadgerDAO, relayée par CoinDesk, [le hacker a utilisé une clé API compromise qui a été créée à l'insu et sans l'autorisation des ingénieurs de Badger pour injecter périodiquement le code malveillant qui a affecté un sous-ensemble de ses clients](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Cette phrase — *un sous-ensemble de ses clients* — explique en partie pourquoi l'attaque est restée cachée si longtemps. Le script ne s'activait pas pour tout le monde, ni à chaque fois. Il s'activait et se désactivait, ne touchant que certains utilisateurs, rendant le comportement malveillant atrocement difficile à reproduire ou à remarquer.

Comment une clé API non autorisée a-t-elle pu exister en premier lieu ? La cause première remonte à une faille dans la gestion du compte Cloudflare. Les études de cas de l'incident soulignent que des utilisateurs non autorisés pouvaient créer des comptes et également créer et voir des clés API (globales) (qui ne peuvent pas être supprimées ou désactivées) [avant même que la vérification de l'e-mail ne soit terminée](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Un attaquant pouvait implanter une clé sur un compte, puis simplement attendre que le véritable propriétaire termine la vérification et l'active — à ce moment-là, l'attaquant détenait discrètement un accès API valide.

Avec cette clé, l'attaquant a exploité Cloudflare Workers — la plateforme edge-compute de Cloudflare — pour réécrire la page en cours d'acheminement vers l'utilisateur. Le post-mortem de BadgerDAO, préparé avec l'entreprise de cybersécurité Mandiant, a conclu que l'incident de phishing du 2 décembre était le résultat d'un extrait de code injecté de manière malveillante, diffusé par l'intermédiaire de Cloudflare Workers. Le code injecté ne faisait qu'une seule chose d'important : il insérait une demande supplémentaire d'approbation de token dans le flux normal de la dApp.

Il y avait même un soin délibéré quant au *type* d'appel d'approbation qu'il utilisait. CryptoBriefing a rapporté que [le hacker aurait inséré un script malveillant sur le site de Badger qui présentait aux utilisateurs une transaction visant à « increase allowance »](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Ce choix n'était pas aléatoire. Comparé à un appel `approve` brut, une requête `increaseAllowance` a tendance à générer des indicateurs visuels plus faibles et moins alarmants dans les fenêtres contextuelles (pop-ups) des portefeuilles — moins d'alertes rouges, moins de messages du type « vous êtes sur le point d'accorder un pouvoir de dépense ». L'attaquant a optimisé l'*expérience utilisateur* du vol.

Ainsi, la chaîne complète ressemblait à ceci : une faille dans la vérification des comptes Cloudflare a permis l'existence d'une clé API non autorisée → l'attaquant a utilisé cette clé pour déployer un Worker → le Worker a injecté un script dans app.badger.com → le script a demandé aux portefeuilles une allocation de tokens au profit de l'attaquant → les utilisateurs ont approuvé → l'attaquant les a siphonnés. Aucune étape de ce processus n'a touché aux contrats audités.

## La réponse : mettre la blockchain en pause pour stopper une blessure Web2

Une fois que les transactions de siphonnage ont pris de l'ampleur aux premières heures du 2 décembre, l'empreinte on-chain est finalement devenue impossible à ignorer, et BadgerDAO a agi rapidement — utilisant ses smart contracts pour stopper un problème qui avait commencé entièrement off-chain.

L'équipe a reconnu l'incident publiquement et, selon CryptoBriefing, a confirmé que [tous les smart contracts ont été mis en pause pour éviter de nouveaux retraits](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Étant donné que les coffres-forts de Badger avaient une fonctionnalité de pause, le gel des transferts a coupé à l'attaquant la possibilité de continuer à déplacer les fonds fraîchement approuvés. Un compte-rendu technique décrit cet arrêt comme l'exercice par l'équipe du pouvoir de geler tous les appels à la fonction `transferFrom` — le mécanisme ERC-20 même que les approbations malveillantes exploitaient. Cette pause est également la raison pour laquelle une part significative des pertes était théoriquement récupérable : certains actifs avaient été déplacés par l'attaquant, mais pas encore entièrement retirés des coffres-forts de Badger avant que le gel ne soit mis en place.

Du côté de l'infrastructure, le nettoyage consistait en la sinistre check-list Web2 d'une violation d'identifiants : renouveler les clés API Cloudflare, changer le mot de passe du compte, renforcer l'authentification multifacteur et auditer chaque clé qui n'aurait pas dû exister. BadgerDAO s'est ensuite associé à Mandiant pour enquêter et publier un post-mortem technique reconstituant la chronologie — les failles du compte Cloudflare, les clés non autorisées créées au cours des mois précédents, l'injection du script en novembre et le siphonnage en décembre.

Mais aucune réponse à l'incident ne pouvait annuler les approbations que les utilisateurs avaient déjà données. Les signatures étaient valides. Les mesures correctives pouvaient empêcher les vols *futurs* et faciliter la récupération ; elles ne pouvaient pas inverser un consentement qui avait déjà été accordé on-chain.

## Ce que cela nous apprend : le site web fait partie de votre surface de sécurité

La leçon la plus importante de BadgerDAO est une correction des frontières. La plupart des équipes — et la plupart des utilisateurs — tracent le périmètre de sécurité autour des smart contracts. BadgerDAO prouve que le périmètre est beaucoup plus large.

**1. Votre front-end fait partie du périmètre. Toujours.** Le code exécuté par le navigateur d'un utilisateur fait partie de votre protocole, qu'il soit on-chain ou non. Si un attaquant contrôle le JavaScript distribué par votre site, il contrôle les portefeuilles de vos utilisateurs — contrats audités ou non. Le site n'est pas « juste l'interface utilisateur ». C'est l'endroit où le consentement est recueilli.

**2. Votre cloud et votre infrastructure de domaine font partie du contrat.** Un compte Cloudflare, des identifiants chez un fournisseur DNS, un compte chez un registraire, une clé CI/CD — chacun constitue une voie permettant de réécrire ce que vos utilisateurs voient. BadgerDAO n'a pas été piraté au niveau de son coffre-fort ; il l'a été au niveau du *compte qui contrôlait le site web*. Traitez ces identifiants avec la même paranoïa que vous réservez à la clé privée du déployeur.

**3. Les clés API et les flux de création de comptes constituent de véritables surfaces d'attaque.** L'ensemble de ce désastre reposait sur une clé API non autorisée qui n'aurait jamais dû exister, rendue possible par une faille dans le processus de vérification. Faites l'inventaire de chaque clé. Limitez strictement leur périmètre. Renouvelez-les régulièrement. Configurez des alertes pour les nouvelles clés. Une clé que vous avez oubliée est une clé qu'un attaquant peut utiliser.

**4. « Audité » est nécessaire, mais pas suffisant.** Un audit sans faille a une réelle valeur et vous devriez toujours en obtenir un. Mais il couvre les contrats, pas le compte cloud, ni le DNS, le CDN, ou la pipeline de compilation du front-end. La sécurité englobe l'intégralité du parcours, du navigateur de l'utilisateur jusqu'à votre blockchain — et c'est le maillon le plus faible, non le plus fort, qui fixe le niveau d'exigence.

**5. La vigilance des utilisateurs ne suffit pas face à un front-end falsifié.** « Toujours vérifier l'URL » est un bon conseil qui n'aurait servi à rien ici. L'URL était correcte. La leçon pour les utilisateurs est plus rude : soyez profondément méfiants face aux demandes d'approbation et d'`increaseAllowance`, privilégiez les portefeuilles et les outils qui décodent et alertent sur les approbations de tokens, et révoquez régulièrement les anciennes autorisations. Ce que vous approuvez a plus d'importance que la page sur laquelle vous vous trouvez.

## La perspective de Namefi

![Colorful illustration of verifiable, tamper-resistant domain and web ownership — secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Si l'on réduit l'affaire BadgerDAO à son essence, il s'agit d'un problème de **propriété et de contrôle**. L'attaquant ne possédait pas le site web de BadgerDAO — mais pendant des semaines, il a pu modifier ce que celui-ci affichait. Les personnes qui possédaient *effectivement* le projet n'avaient aucun moyen fiable et inaltérable de savoir que la chaîne de contrôle de leur présence sur le web — compte, clés, configuration edge, DNS — avait été discrètement compromise.

C'est cette faille dont [Namefi](https://namefi.io) se préoccupe. Namefi traite les domaines et la propriété du web comme des actifs de premier plan, natifs d'Internet : un contrôle qui est vérifiable, auditable et plus difficile à pirater silencieusement, tout en restant compatible avec le DNS. La surface d'attaque front-end — qui contrôle le nom, vers quoi il pointe, quelle infrastructure se trouve derrière lui — ne vient pas en second plan par rapport aux smart contracts. Comme BadgerDAO l'a montré de la façon la plus coûteuse possible, elle *fait* partie intégrante du modèle de sécurité.

Vous pouvez auditer vos contrats jusqu'à ce qu'ils soient irréprochables. Mais si une clé non autorisée peut réécrire votre site web et qu'un script injecté peut récolter les approbations de vos utilisateurs, l'audit ne couvrait en réalité qu'une partie du problème. Le domaine, le DNS et l'infrastructure web qui distribuent votre application à des personnes réelles font partie de votre surface de sécurité. Traitez-les comme tels — car les attaquants le font déjà.

## Sources et lectures complémentaires

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)