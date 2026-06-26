---
title: "L'attaque front-end de BadgerDAO : 120 millions de dollars siphonnés par un seul script injecté"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En décembre 2021, des attaquants ont compromis le compte Cloudflare de BadgerDAO et injecté un seul script malveillant dans le front-end de son site web. Les contrats intelligents audités n'ont jamais été touchés — et pourtant, environ 120 millions de dollars sont partis via des approbations de portefeuilles signées à l'insu des utilisateurs. Une analyse approfondie expliquant pourquoi le site web fait partie de votre surface de sécurité."
keywords: ['piratage badgerdao', 'attaque front-end badgerdao', 'compromission clé api cloudflare', 'attaque par script injecté', 'sécurité front-end web3', 'ice phishing', 'attaque increaseAllowance', 'exploit approbation de tokens', 'sécurité dns et domaine', 'exploit cloudflare workers', 'sécurité defi', 'attaque chaîne d approvisionnement web3', 'falsification de site web', 'sécurité des domaines']
relatedArticles:
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/the-sushiswap-miso-insider-attack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-2024-squarespace-defi-domain-hijacks/
  - /fr/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/web3/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
---

L'audit était propre. Les contrats étaient en ordre. L'argent est parti quand même.

Aux alentours du 2 décembre 2021, BadgerDAO — un projet [DeFi](/fr/glossary/defi/) construit autour de l'intégration du Bitcoin dans la finance décentralisée — a perdu environ **120 millions de dollars** de fonds appartenant à ses utilisateurs. Il n'y a eu ni ruse avec des flash loans, ni faille de réentrance, ni exploitation mathématique ingénieuse contre les vaults. Les contrats intelligents ont fait exactement ce pour quoi ils avaient été écrits. L'attaquant n'a jamais eu besoin de les casser, car il ne les a jamais attaqués.

Il a attaqué le *site web*.

Quelqu'un avait discrètement glissé un script malveillant dans le front-end de app.badger.com. Pour chaque utilisateur qui chargeait la page, elle ressemblait à la même dApp de confiance qu'ils utilisaient tous les jours. Mais lorsqu'ils tentaient d'interagir avec elle, la page demandait à leur [portefeuille](/fr/glossary/wallet/) une permission supplémentaire et invisible — et une fois qu'ils cliquaient sur « approuver », leurs tokens ne leur appartenaient plus.

Voici l'histoire de comment un projet avec des contrats audités a perdu neuf chiffres à cause d'une seule ligne de code front-end injectée, et pourquoi cela devrait changer définitivement votre façon de concevoir les limites de votre sécurité.

## Le mensonge réconfortant : « les contrats sont audités »

La culture crypto a appris aux utilisateurs à poser une seule question avant de faire confiance à un protocole : *a-t-il été audité ?* Les audits ont de l'importance. Ils détectent de vraies failles. Mais quelque part en chemin, « les contrats sont audités » s'est durci en un sentiment de sécurité totale — comme si un rapport d'audit propre était un bouclier protecteur autour de tout ce qui portait le nom du projet.

Ce n'est pas le cas.

Un audit examine le code [on-chain](/fr/glossary/on-chain/) : les vaults, la logique des tokens, les contrôles d'accès. Il ne dit rien sur l'ordinateur portable qu'un développeur a laissé connecté, les enregistrements [DNS](/fr/glossary/dns/) qui dirigent votre navigateur quelque part, le CDN placé devant le site, ni le JavaScript que votre navigateur télécharge et exécute réellement lorsque vous visitez la dApp. Tout cela vit dans le *Web2* — dans des comptes cloud, des clés API et une infrastructure de domaine — et est tout aussi structurellement essentiel que le Solidity.

BadgerDAO est la preuve la plus nette de cet écart jamais enregistrée. Comme l'a formulé sans détour une analyse technique de l'incident : [du point de vue des contrats intelligents du projet, rien ne s'était mal passé](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), et l'attaquant utilisait simplement les approbations accordées par les utilisateurs. La chaîne s'est comportée parfaitement. Le site web a menti.

## L'attaque : une vitrine falsifiée avec un reçu propre

![Art conceptuel coloré et vivant d'une vitrine familière et accueillante dont la caisse enregistreuse a été discrètement falsifiée, un tiroir caché supplémentaire siphonnant des pièces pendant que les clients sourient et paient normalement](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Imaginez entrer dans une boutique que vous avez visitée cent fois. Même enseigne, même personnel, même comptoir. Vous achetez quelque chose de petit, la caissière enregistre la vente, vous appuyez votre carte. Tout semble routinier. Ce que vous ne pouvez pas voir, c'est que quelqu'un a remplacé le lecteur de carte par un qui autorise également discrètement une seconde charge illimitée sur votre compte — à destination d'un inconnu, quand il le souhaite.

C'est, en substance, ce qui est arrivé aux utilisateurs de BadgerDAO.

La classification est importante ici, car c'est ce qui rend cet incident si instructif. Comme *Vice* l'a résumé, le piratage [n'impliquait pas d'exploits complexes de contrats intelligents. Il s'agissait plutôt d'une attaque front-end ciblant l'infrastructure web de BadgerDAO](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — en particulier son compte Cloudflare. C'était, dans leur formulation, une attaque web *à l'ancienne* pointée sur une cible [Web3](/fr/glossary/web3/).

Le mécanisme était élégant et discret. Le script malveillant demandait au portefeuille de l'utilisateur d'accorder une autorisation de dépense de tokens à l'adresse de l'attaquant. En termes simples de Vice, [le script malveillant a essentiellement trompé les gens pour qu'ils donnent à l'adresse le droit d'envoyer les tokens à l'adresse de l'exploiteur](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-screen-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). L'utilisateur pensait faire affaire normalement avec la dApp. Il signait en réalité la cession des clés de ses tokens.

Les chercheurs en sécurité appellent ce schéma *ice phishing* : au lieu de voler votre clé privée, vous êtes amené à approuver volontairement un dépensier malveillant. La signature est réelle. L'approbation est réelle. La transaction on-chain est valide. C'est précisément pourquoi c'est si dangereux — et pourquoi aucun audit de contrat n'aurait pu l'arrêter.

## Ce que les utilisateurs ont perdu : environ 120 millions de dollars, une signature à la fois

Les chiffres sont stupéfiants pour une attaque qui n'a jamais touché une seule ligne de code de vault.

La société d'audit de contrats intelligents PeckShield [a estimé que le total des pertes s'élevait à environ 120 millions de dollars](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). La propre comptabilité post-mortem de BadgerDAO, reproduite dans des études de cas d'incidents, a évalué la perte à [environ 2 076,54 BTC (~116,3 millions USD au moment du piratage)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC) une fois tous les actifs volés convertis en un dénominateur commun.

La douleur n'a pas été répartie uniformément. Une seule victime — selon les rapports, un compte institutionnel — a perdu la part du lion en une seule transaction : les études de cas notent qu'[environ 900 BTC ont été retirés du vault Yearn wBTC](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), une seule partie perdant à elle seule [plus de 50 millions de dollars en Bitcoin enveloppé](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). Des centaines d'utilisateurs ordinaires composaient le reste.

Et l'ampleur était une conséquence directe de la patience. L'attaquant n'a pas frappé dans la panique. Comme le décrit l'analyse de Forta, [le pirate a silencieusement accumulé des approbations de près de 200 comptes, puis à 0h48 le 2 décembre 2021, il a vidé les portefeuilles des victimes en moins de 10 heures](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Les approbations malveillantes s'étaient tranquillement accumulées pendant des jours — un piège chargé, déclenché d'un coup. Une autre reconstruction a dénombré [500 portefeuilles ayant créé ces approbations illimitées](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets) au cours de la campagne.

Le détail le plus cruel : il n'y avait rien qu'un utilisateur prudent aurait pu vérifier. L'URL était correcte. Le certificat TLS était valide. L'interface était authentique. La seule chose erronée était un fragment de JavaScript que le site légitime lui-même servait.

## Comment cela s'est produit : une clé API Cloudflare et une approbation injectée

![Art conceptuel coloré et vivant d'une main invisible ajoutant discrètement un bouton « approuver » supplémentaire lumineux dans une fenêtre pop-up de portefeuille pendant que la vraie interface semble calme et digne de confiance, une seule ligne de code malveillante se glissant dans une page web amicale](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

La porte d'entrée qu'a utilisée l'attaquant n'était pas un contrat intelligent. C'était un compte cloud.

BadgerDAO, comme une immense proportion du web moderne, se trouvait derrière Cloudflare — la couche de diffusion de contenu et de calcul en périphérie qui sert et accélère les sites web. Le contrôle de ce compte signifiait le contrôle du code que le site web de BadgerDAO remettait aux visiteurs. Et l'attaquant a obtenu ce contrôle grâce à une clé volée.

Dans la comptabilité officielle de BadgerDAO, relayée par CoinDesk, [le pirate a utilisé une clé API compromise qui avait été créée sans la connaissance ni l'autorisation des ingénieurs de Badger pour injecter périodiquement le code malveillant qui a affecté une partie de ses clients](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Cette formule — *une partie de ses clients* — explique en partie pourquoi cela est resté caché si longtemps. Le script ne se déclenchait pas pour tout le monde, à chaque fois. Il alternait, ne touchant que certains utilisateurs, rendant le comportement malveillant exaspérant difficile à reproduire ou à remarquer.

Comment une clé API non autorisée a-t-elle pu exister ? La cause première remontait à une faille dans le compte Cloudflare. Les études de cas d'incidents notent que des utilisateurs non autorisés pouvaient créer des comptes et pouvaient également créer et consulter des clés API (globales) (qui ne peuvent être ni supprimées ni désactivées) [avant que la vérification par e-mail ne soit complétée](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Un attaquant pouvait placer une clé contre un compte, puis attendre simplement que le vrai propriétaire finisse de vérifier et l'active — à ce stade, l'attaquant détenait silencieusement un accès API valide.

Avec cette clé, l'attaquant a eu recours à Cloudflare Workers — la plateforme de calcul en périphérie de Cloudflare — pour réécrire la page à la volée avant qu'elle n'atteigne l'utilisateur. Le post-mortem de BadgerDAO, préparé avec la société de cybersécurité Mandiant, a conclu que l'incident de phishing du 2 décembre était le résultat d'un extrait de code malveillant injecté fourni par Cloudflare Workers. Le code injecté faisait exactement une seule chose qui importait : il insérait une demande d'approbation de token supplémentaire dans le flux normal de la dApp.

Il y avait même un soin délibéré dans le choix de l'appel d'approbation utilisé. CryptoBriefing a rapporté que [le pirate aurait inséré un script malveillant sur le site de Badger qui présentait aux utilisateurs une transaction pour « augmenter l'allocation »](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Ce choix n'était pas aléatoire. Par rapport à un appel `approve` brut, une invite `increaseAllowance` tend à s'afficher avec des signaux visuels plus faibles et moins alarmants dans les pop-ups de portefeuille — moins d'alertes, moins d'avertissement du type « vous êtes sur le point d'accorder un pouvoir de dépense ». L'attaquant a optimisé *l'expérience utilisateur* du vol.

Voici donc la chaîne complète : une faiblesse de vérification de compte Cloudflare a permis l'existence d'une clé API non autorisée → l'attaquant a utilisé cette clé pour déployer un Worker → le Worker a injecté un script dans app.badger.com → le script a demandé aux portefeuilles une allocation de token en faveur de l'attaquant → les utilisateurs ont approuvé → l'attaquant les a vidés. Pas une seule étape de tout cela n'a touché les contrats audités.

## La réponse : mettre la chaîne en pause pour stopper une blessure Web2

Une fois que les transactions de vidange ont atteint leur pleine ampleur dans les premières heures du 2 décembre, l'empreinte on-chain est finalement devenue impossible à ignorer, et BadgerDAO a réagi rapidement — en utilisant ses contrats intelligents pour stopper un problème qui avait entièrement pris naissance hors chaîne.

L'équipe a publiquement reconnu l'incident et, selon CryptoBriefing, a confirmé que [tous les contrats intelligents ont été mis en pause pour empêcher de nouveaux retraits](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Comme les vaults de Badger disposaient d'une capacité de pause, le gel des transferts a coupé la capacité de l'attaquant à continuer à déplacer des fonds nouvellement approuvés. Une analyse technique décrit l'arrêt comme l'équipe exerçant le pouvoir de geler tous les appels à la fonction `transferFrom` — le mécanisme [ERC-20](/fr/glossary/erc-20/) même que les approbations malveillantes exploitaient. Cette pause explique également pourquoi une partie significative de la perte était théoriquement récupérable : certains actifs avaient été déplacés par l'attaquant mais n'avaient pas encore été entièrement retirés des vaults de Badger avant que le gel ne soit effectif.

Du côté de l'infrastructure, le nettoyage a suivi la sombre liste de contrôle Web2 d'une violation de credentials : rotation des clés API Cloudflare, changement du mot de passe du compte, renforcement de l'authentification multifacteur, et audit de chaque clé qui n'aurait pas dû exister. BadgerDAO a ensuite fait appel à Mandiant pour enquêter et publier un post-mortem technique reconstituant la chronologie — les faiblesses du compte Cloudflare, les clés non autorisées créées au cours des mois précédents, l'injection de script de novembre, et le vidage de décembre.

Mais aucune gestion de crise ne pouvait annuler les approbations que les utilisateurs avaient déjà accordées. Les signatures étaient valides. La remédiation pouvait stopper les *futurs* vols et engager des démarches de récupération ; elle ne pouvait pas inverser le consentement qui avait déjà été accordé on-chain.

## Ce que cela enseigne : le site web fait partie de votre surface de sécurité

La leçon la plus importante de BadgerDAO est une correction de périmètre. La plupart des équipes — et la plupart des utilisateurs — tracent le périmètre de sécurité autour des contrats intelligents. BadgerDAO prouve que ce périmètre est bien plus large.

**1. Votre front-end est dans le périmètre. Toujours.** Le code qu'exécute le navigateur d'un utilisateur fait partie de votre protocole, qu'il vive on-chain ou non. Si un attaquant contrôle le JavaScript que votre site sert, il contrôle les portefeuilles de vos utilisateurs — contrats audités ou pas. Le site n'est pas « juste l'interface ». C'est l'endroit où le consentement est capturé.

**2. Votre infrastructure cloud et de domaine fait partie du contrat.** Un compte Cloudflare, la connexion à un fournisseur DNS, un compte de registrar, une clé CI/CD — chacun est un chemin pour réécrire ce que voient vos utilisateurs. BadgerDAO n'a pas été compromis au niveau du vault ; il a été compromis au niveau du *compte qui contrôlait le site web*. Traitez ces credentials avec la même paranoïa que vous réservez à une clé privée de déploiement.

**3. Les clés API et les flux de création de compte sont de vraies surfaces d'attaque.** Tout le désastre a tourné autour d'une clé API non autorisée qui n'aurait jamais dû exister, rendue possible par une lacune de vérification. Faites l'inventaire de chaque clé. Restreignez-en la portée. Faites-les tourner. Alertez sur les nouvelles. Une clé que vous avez oubliée est une clé qu'un attaquant peut utiliser.

**4. « Audité » est nécessaire, mais pas suffisant.** Un audit propre a une réelle valeur et vous devriez tout de même en obtenir un. Mais il couvre les contrats, pas le compte cloud, le DNS, le CDN, ou le pipeline de construction du front-end. La sécurité, c'est tout le chemin depuis le navigateur d'un utilisateur jusqu'à votre chaîne — et c'est le maillon le plus faible, non le plus fort, qui fixe le niveau.

**5. Les utilisateurs ne peuvent pas se prémunir par la vérification contre un front-end falsifié.** « Vérifiez toujours l'URL » est un bon conseil qui n'aurait rien changé ici. L'URL était correcte. La leçon pour les utilisateurs est plus difficile : soyez profondément méfiant des invites d'approbation et de `increaseAllowance`, privilégiez les portefeuilles et les outils qui décodent et avertissent sur les approbations de tokens, et révoquez régulièrement les autorisations périmées. Ce que vous approuvez importe plus que la page sur laquelle vous vous trouvez.

## L'angle Namefi

![Illustration colorée de la propriété vérifiable et résistante à la falsification d'un domaine et du web — sécurisée par un bouclier vert, un token Namefi vert, et la continuité DNS](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Réduire BadgerDAO à son essence, c'est un problème de **propriété et de contrôle**. L'attaquant ne possédait pas le site web de BadgerDAO — mais pendant des semaines, il pouvait modifier ce qu'il servait. Les personnes qui *possédaient* effectivement le projet n'avaient aucun moyen fiable et inviolable de savoir que la chaîne de contrôle sur leur présence web — compte, clés, configuration en périphérie, DNS — avait été discrètement compromise.

C'est l'écart qui préoccupe [Namefi](https://namefi.io). Namefi traite les domaines et la propriété web comme des actifs de première classe, natifs d'Internet : un contrôle qui est vérifiable, auditable et plus difficile à détourner silencieusement, tout en restant compatible avec le DNS. La surface d'attaque du front-end — qui contrôle le nom, où il se résout, quelle infrastructure se trouve derrière — n'est pas une réflexion après coup par rapport aux contrats intelligents. Comme BadgerDAO l'a démontré de la façon la plus coûteuse possible, elle *fait* partie du modèle de sécurité.

Vous pouvez auditer vos contrats jusqu'à ce qu'ils soient impeccables. Mais si une clé non autorisée peut réécrire votre site web et qu'un script injecté peut collecter les approbations de vos utilisateurs, l'audit n'a jamais raconté toute l'histoire. Le domaine, le DNS et l'infrastructure web qui livrent votre application aux vraies personnes font partie de votre surface de sécurité. Traitez-les comme tels — car les attaquants le font déjà.

## Sources et lectures complémentaires

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
